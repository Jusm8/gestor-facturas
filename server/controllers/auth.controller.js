const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { sendRegistrationEmail } = require('../utils/mail');
const nodemailer = require('nodemailer');

//Registro de usuario
exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    //Verificar si ya existe el email
    const [existing] = await pool.query('SELECT idUsuario FROM Usuario WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }

    //Generar código de verificación
    const verificationCode = Math.floor(100000 + Math.random() * 900000);

    //Guardar datos temporalmente en memoria global
    global.pendingUsers = global.pendingUsers || {};
    global.pendingUsers[email] = {
      nombre,
      email,
      password,
      rol,
      code: verificationCode,
      //Aprox 10 minutos para que expire el codigo
      expiresAt: Date.now() + 10 * 60 * 1000
    };

    //Enviar código por email
    await sendRegistrationEmail(email, verificationCode);

    res.status(200).json({ message: 'Código de verificación enviado al correo.' });

  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error al iniciar el proceso de registro.' });
  }
};

//Verificacon por email
exports.verifyCodeAndRegister = async (req, res) => {
  const { email, code } = req.body;

  const pending = global.pendingUsers?.[email];
  if (!pending) {
    return res.status(400).json({ error: 'No hay una solicitud de registro para este correo' });
  }

  if (parseInt(code) !== pending.code) {
    return res.status(400).json({ error: 'Código incorrecto' });
  }

  //Expirar codigo tras pasado un tiempo
  if (Date.now() > pending.expiresAt) {
    delete global.pendingUsers[email];
    return res.status(400).json({ error: 'El código ha expirado' });
  }

  //Verificar la contraseña valida
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(pending.password)) {
    delete global.pendingUsers[email];
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número' });
  }

  try {
    const hashedPassword = await bcrypt.hash(pending.password, 10);

    await pool.query(
      'INSERT INTO Usuario (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [pending.nombre, pending.email, hashedPassword, pending.rol]
    );

    delete global.pendingUsers[email];

    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error al verificar y registrar:', error);
    res.status(500).json({ error: 'Error final al registrar' });
  }
};

//Login de usuario
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.idUsuario, rol: user.rol }, process.env.JWT_SECRET);
    res.json({
      token,
      user: {
        id: user.idUsuario,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        imagen_url: user.imagen_url,
        fecha_nacimiento: user.fecha_nacimiento,
        sexo: user.sexo,
        localidad: user.localidad
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
};

//Limpiar fecha
const cleanDate = (dateStr) => {
  if (!dateStr) return null;
  //Tiempo en modo YYYY-MM-DD
  return new Date(dateStr).toISOString().split('T')[0];
};

//Actualizar perfil
exports.updateProfile = async (req, res) => {
  const {
    idUsuario,
    nombre,
    email,
    fecha_nacimiento,
    sexo,
    localidad
  } = req.body;

  //Si se sube una imagen, obtenemos la ruta generada por multer
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

  try {
    const clean = (value) => value === '' ? null : value;

    const [result] = await pool.query(
      `UPDATE Usuario SET
        nombre = ?, 
        email = ?, 
        imagen_url = COALESCE (?, imagen_url), 
        fecha_nacimiento = ?, 
        sexo = ?, 
        localidad = ?
      WHERE idUsuario = ?`,
      [
        clean(nombre),
        clean(email),
        imagen_url,
        cleanDate(fecha_nacimiento),
        clean(sexo),
        clean(localidad),
        idUsuario
      ]
    );

    const [updatedUser] = await pool.query('SELECT * FROM Usuario WHERE idUsuario = ?', [idUsuario]);

    res.json({
      message: 'Perfil actualizado correctamente',
      user: updatedUser[0]
    });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ error: 'Error actualizando el perfil' });
  }
};

//Crear proyecto para alamacenar los datos, clientes, productos, facturas y presupuestos
exports.crearProyecto = async (req, res) => {
  const {
    nombre,
    descripcion,
    fecha_inicio,
    fecha_fin,
    estado,
    Usuario_idUsuario
  } = req.body;

  try {
    await pool.query(
      `INSERT INTO Proyecto (nombre, descripcion, fecha_inicio, fecha_fin, estado, Usuario_idUsuario)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, descripcion, fecha_inicio, fecha_fin, estado, Usuario_idUsuario]
    );

    res.status(201).json({ message: 'Proyecto creado correctamente' });
  } catch (error) {
    console.error('Error al crear proyecto:', error);
    res.status(500).json({ error: 'Error al crear el proyecto' });
  }
};

//Sacar los proyectos de un usuario
exports.obtenerProyectosPorUsuario = async (req, res) => {
  const { idUsuario } = req.params;

  try {
    const [rows] = await pool.query(
      'SELECT * FROM Proyecto WHERE Usuario_idUsuario = ?',
      [idUsuario]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener proyectos:', error);
    res.status(500).json({ error: 'Error al obtener los proyectos' });
  }
};

//Crear presupuesto
exports.crearPresupuesto = async (req, res) => {
  const {
    fecha,
    fecha_validez,
    forma_pago,
    estado,
    Usuario_idUsuario,
    Cliente_idCliente,
    Proyecto_idProyecto,
    detalles
  } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [presupuestoRes] = await connection.query(
      `INSERT INTO Presupuesto (fecha, fecha_validez, forma_pago, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fecha, fecha_validez, forma_pago, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto]

    );

    const presupuestoId = presupuestoRes.insertId;

    //Creamos la variabl del total
    let total = 0;

    for (const detalle of detalles) {
      const { Producto_idProducto, cantidad, precio_unitario } = detalle;

      await connection.query(
        `INSERT INTO PresupuestoDetalle (cantidad, precio_unitario, descripcion, Presupuesto_idPresupuesto)
        VALUES (?, ?, ?, ?)`,
        [cantidad, precio_unitario, detalle.descripcion, presupuestoId]
      );

      await connection.query(
        `INSERT INTO Producto_has_PresupuestoDetalle (Producto_idProducto, PresupuestoDetalle_idPresupuestoDetalle)
         VALUES (?, LAST_INSERT_ID())`,
        [Producto_idProducto]
      );

      //Calculamos el total de fomra automatica para el usuario
      total += cantidad * precio_unitario;
    }

    await connection.query(
      `UPDATE Presupuesto SET total = ? WHERE idPresupuesto = ?`,
      [total, presupuestoId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Presupuesto creado correctamente', id: presupuestoId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear presupuesto:', error);
    res.status(500).json({ error: 'Error al crear presupuesto' });
  } finally {
    connection.release();
  }
};

//Obtener clientes
exports.obtenerClientes = async (req, res) => {
  try {
    const [clientes] = await pool.query('SELECT idCliente, nombre, nif, email FROM Cliente WHERE Usuario_idUsuario = ?', [req.params.id]);
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

//Eliminar proyecto
exports.eliminarProyecto = async (req, res) => {
  const id = req.params.id;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    //Eliminar presupuestos relacionados
    const [presupuestos] = await conn.query(
      'SELECT idPresupuesto FROM Presupuesto WHERE Proyecto_idProyecto = ?', [id]
    );
    for (const presupuesto of presupuestos) {
      await conn.query('DELETE FROM Producto_has_PresupuestoDetalle WHERE PresupuestoDetalle_idPresupuestoDetalle IN (SELECT idPresupuestoDetalle FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?)', [presupuesto.idPresupuesto]);
      await conn.query('DELETE FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?', [presupuesto.idPresupuesto]);
      await conn.query('DELETE FROM Presupuesto WHERE idPresupuesto = ?', [presupuesto.idPresupuesto]);
    }

    //Eliminar facturas relacionadas
    const [facturas] = await conn.query(
      'SELECT idFactura FROM Factura WHERE Proyecto_idProyecto = ?', [id]
    );
    for (const factura of facturas) {
      await conn.query('DELETE FROM FacturaDetalle WHERE Factura_idFactura = ?', [factura.idFactura]);
      await conn.query('DELETE FROM Factura WHERE idFactura = ?', [factura.idFactura]);
    }

    //Eliminar el proyecto
    await conn.query('DELETE FROM Proyecto WHERE idProyecto = ?', [id]);

    await conn.commit();
    res.json({ message: 'Proyecto eliminado correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar proyecto:', error);
    res.status(500).json({ error: 'Error al eliminar el proyecto' });
  } finally {
    conn.release();
  }
};

//Sacamos el proyecto por su id
exports.obtenerProyectoById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await pool.query('SELECT * FROM Proyecto WHERE idProyecto = ?', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('Error al obtener el proyecto:', error);
    res.status(500).json({ error: 'Error al obtener el proyecto' });
  }
};

//Editar proyecto
exports.editarProyecto = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, fecha_inicio, fecha_fin, estado } = req.body;

  try {
    await pool.query(
      `UPDATE Proyecto SET nombre = ?, descripcion = ?, fecha_inicio = ?, fecha_fin = ?, estado = ?
       WHERE idProyecto = ?`,
      [nombre, descripcion, fecha_inicio, fecha_fin, estado, id]
    );

    res.json({ message: 'Proyecto actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar proyecto:', error);
    res.status(500).json({ error: 'Error al actualizar el proyecto' });
  }
};

//Sacar los productos de un usuario
exports.obtenerProductosPorUsuario = async (req, res) => {
  const { id } = req.params;

  try {
    const [productos] = await pool.query(
      'SELECT idProducto, nombre, tipo, precio, descripcion FROM Producto WHERE Usuario_idUsuario = ?',
      [id]
    );

    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

//Cambiar la contraseña de un usuario usando su contraseña actual
exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await pool.query('SELECT password FROM Usuario WHERE idUsuario = ?', [userId]);
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return res.status(403).json({ error: 'Contraseña actual incorrecta' });

    //Compruevo que la nueva contraseña cumple con los requisitos
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número' });
    }
    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query('UPDATE Usuario SET password = ? WHERE idUsuario = ?', [hashed, userId]);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar contraseña' });
  }
};

//Eliminar cuenta del usuario
exports.deleteAccount = async (req, res) => {
  const { password } = req.body;
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'No autorizado' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id;

    const [rows] = await pool.query('SELECT * FROM Usuario WHERE idUsuario = ?', [userId]);
    const user = rows[0];

    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(403).json({ error: 'Contraseña incorrecta' });

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      //Eliminar presupuestos
      const [presupuestos] = await conn.query('SELECT idPresupuesto FROM Presupuesto WHERE Usuario_idUsuario = ?', [userId]);
      for (const p of presupuestos) {
        await conn.query('DELETE FROM Producto_has_PresupuestoDetalle WHERE PresupuestoDetalle_idPresupuestoDetalle IN (SELECT idPresupuestoDetalle FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?)', [p.idPresupuesto]);
        await conn.query('DELETE FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?', [p.idPresupuesto]);
      }
      await conn.query('DELETE FROM Presupuesto WHERE Usuario_idUsuario = ?', [userId]);

      //Eliminar facturas (opcional: si conectadas a usuario)
      await conn.query('DELETE FROM FacturaDetalle WHERE Factura_idFactura IN (SELECT idFactura FROM Factura WHERE Cliente_idCliente IN (SELECT idCliente FROM Cliente WHERE Usuario_idUsuario = ?))', [userId]);
      await conn.query('DELETE FROM Factura WHERE Cliente_idCliente IN (SELECT idCliente FROM Cliente WHERE Usuario_idUsuario = ?)', [userId]);

      //Eliminar productos y clientes
      await conn.query('DELETE FROM Producto WHERE Usuario_idUsuario = ?', [userId]);
      await conn.query('DELETE FROM Cliente WHERE Usuario_idUsuario = ?', [userId]);

      //Eliminar proyectos
      await conn.query('DELETE FROM Proyecto WHERE Usuario_idUsuario = ?', [userId]);

      //Eliminar usuario
      await conn.query('DELETE FROM Usuario WHERE idUsuario = ?', [userId]);

      await conn.commit();
      res.json({ message: 'Cuenta eliminada correctamente' });
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  } catch (error) {
    console.error('Error al eliminar cuenta:', error);
    res.status(500).json({ error: 'Error al eliminar la cuenta' });
  }
};

//Obtener usuarios
exports.obtenerUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query('SELECT idUsuario AS id, nombre, email, rol FROM Usuario');
    res.json(usuarios);
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

//Obtener usuario por id
exports.obtenerUsuarioById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT idUsuario AS id, nombre, email, rol FROM Usuario WHERE idUsuario = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
};

//Banear usuario cambiano el rol a baneado (Seguridad)
exports.banUser = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('UPDATE Usuario SET rol = "baneado" WHERE idUsuario = ?', [id]);
    res.json({ message: 'Usuario baneado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al banear el usuario' });
  }
};

//Desbanear usuario cambiando el rol a usuario (Seguridad)
exports.unbanUser = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email es requerido' });
  }

  try {
    const [result] = await pool.query(
      'UPDATE Usuario SET rol = "usuario" WHERE email = ? AND rol = "baneado"',
      [email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado o no estaba baneado' });
    }

    res.json({ message: 'Usuario desbaneado correctamente' });
  } catch (error) {
    console.error('Error al desbanear usuario:', error);
    res.status(500).json({ error: 'Error del servidor' });
  }
};

//Opcion de que el admin pueda eliminar un usuario
exports.deleteUserByAdmin = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    //Elimino detalles de presupuestos relacionados
    await conn.query(`
      DELETE FROM Producto_has_PresupuestoDetalle
      WHERE PresupuestoDetalle_idPresupuestoDetalle IN (
        SELECT idPresupuestoDetalle
        FROM PresupuestoDetalle
        WHERE Presupuesto_idPresupuesto IN (
          SELECT idPresupuesto
          FROM Presupuesto
          WHERE Usuario_idUsuario = ?
        )
      )`, [id]);

    await conn.query(`
      DELETE FROM PresupuestoDetalle
      WHERE Presupuesto_idPresupuesto IN (
        SELECT idPresupuesto
        FROM Presupuesto
        WHERE Usuario_idUsuario = ?
      )`, [id]);

    //Eliminar presupuestos
    await conn.query('DELETE FROM Presupuesto WHERE Usuario_idUsuario = ?', [id]);

    //Eliminar facturas (detalle y principal) de los clientes de este usuario
    await conn.query(`
      DELETE FROM FacturaDetalle
      WHERE Factura_idFactura IN (
        SELECT idFactura
        FROM Factura
        WHERE Cliente_idCliente IN (
          SELECT idCliente
          FROM Cliente
          WHERE Usuario_idUsuario = ?
        )
      )`, [id]);

    await conn.query(`
      DELETE FROM Factura
      WHERE Cliente_idCliente IN (
        SELECT idCliente
        FROM Cliente
        WHERE Usuario_idUsuario = ?
      )`, [id]);

    //Eliminar clientes, productos, proyectos y el propio usuario
    await conn.query('DELETE FROM Cliente WHERE Usuario_idUsuario = ?', [id]);
    await conn.query('DELETE FROM Producto WHERE Usuario_idUsuario = ?', [id]);
    await conn.query('DELETE FROM Proyecto WHERE Usuario_idUsuario = ?', [id]);
    await conn.query('DELETE FROM Usuario WHERE idUsuario = ?', [id]);

    await conn.commit();
    res.json({ message: 'Cuenta y datos eliminados correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al eliminar usuario completo:', error);
    res.status(500).json({ error: 'Error al eliminar cuenta', detalle: error.toString() });
  } finally {
    conn.release();
  }
};

//Recibir apelacion por email
exports.recibirApelacion = async (req, res) => {
  const { email, mensaje } = req.body;

  //Revisamos de que haya un mensaje
  if (!email || !mensaje) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const { sendRegistrationEmail } = require('../utils/mail');
    const transporter = require('../utils/mail').transporter;

    await transporter.sendMail({
      from: `"SimpliFac" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM,
      subject: `Apelación de desbaneo - ${email}`,
      text: mensaje,
    });

    res.status(200).json({ message: 'Apelación enviada' });
  } catch (error) {
    console.error('Error SMTP:', error);
    res.status(500).json({ error: 'No se pudo enviar el mensaje', detalle: error.toString() });
  }
};

//Recibir comentario de los usuarios
exports.recibirContacto = async (req, res) => {
  const { nombre, email, mensaje } = req.body;

  //Revisamos de que haya un mensaje
  if (!nombre || !email || !mensaje) {
    return res.status(400).json({ error: 'Faltan datos obligatorios' });
  }

  try {
    const { transporter } = require('../utils/mail');

    await transporter.sendMail({
      from: `"Formulario de Contacto" <${process.env.EMAIL_FROM}>`,
      to: process.env.EMAIL_FROM,
      subject: `Mensaje de contacto de ${nombre} (${email})`,
      text: mensaje
    });

    res.status(200).json({ message: 'Mensaje enviado con éxito' });
  } catch (error) {
    console.error('Error al enviar mensaje de contacto:', error);
    res.status(500).json({ error: 'No se pudo enviar el mensaje', detalle: error.toString() });
  }
};

//Mapa temporal para códigos de recuperación
global.passwordResetCodes = global.passwordResetCodes || {};

//Enviar código por correo
exports.enviarCodigoReset = async (req, res) => {
  const { email } = req.body;
  const [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
  const user = rows[0];

  if (!user) return res.status(404).json({ error: 'Correo no registrado' });

  const codigo = Math.floor(100000 + Math.random() * 900000);
  global.passwordResetCodes[email] = {
    codigo,
    //10 min de expiracion
    expiresAt: Date.now() + 10 * 60 * 1000
  };

  const { sendPasswordResetEmail } = require('../utils/mail');
  await sendPasswordResetEmail(email, codigo);

  res.json({ message: 'Código enviado' });
};

//Verificar código
exports.verificarCodigoReset = (req, res) => {
  const { email, codigo } = req.body;
  const registro = global.passwordResetCodes[email];

  if (!registro) return res.status(400).json({ error: 'No se solicitó recuperación para este correo' });
  if (Date.now() > registro.expiresAt) return res.status(400).json({ error: 'El código ha expirado' });
  if (parseInt(codigo) !== registro.codigo) return res.status(400).json({ error: 'Código incorrecto' });

  res.json({ message: 'Código válido' });
};

//Cambiar contraseña
exports.restablecerPassword = async (req, res) => {
  const { email, nuevoPassword } = req.body;
  const registro = global.passwordResetCodes[email];

  if (!registro) return res.status(400).json({ error: 'No autorizado para cambiar contraseña' });

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)[A-Za-z\d@$!%*?&]{8,}$/;

  if (!passwordRegex.test(nuevoPassword)) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres, una mayúscula y un número' });
  }

  const hashed = await bcrypt.hash(nuevoPassword, 10);
  await pool.query('UPDATE Usuario SET password = ? WHERE email = ?', [hashed, email]);
  delete global.passwordResetCodes[email];

  res.json({ message: 'Contraseña restablecida correctamente' });
};

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { ImGift } = require('react-icons/im');

//Registro de usuario
exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    //Verificar si ya se usa el email
    const [existing] = await pool.query('SELECT idUsuario FROM Usuario WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ error: 'El email ya está registrado.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    //Insertar nuevo usuario
    await pool.query(
      'INSERT INTO Usuario (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol]
    );
    //Confirmar que se registro el usuario
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    //Error en el registro
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error en el registro' });
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
const cleanDate = (dateStr) => {
  if (!dateStr) return null;
  return new Date(dateStr).toISOString().split('T')[0]; // 'YYYY-MM-DD'
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

  // Si se sube una imagen, obtenemos la ruta generada por multer
  const imagen_url = req.file ? `/uploads/${req.file.filename}` : null;

  //test
  console.log({
    nombre,
    email,
    imagen_url,
    fecha_nacimiento,
    sexo,
    localidad,
    idUsuario
  });

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

//Presupuestos de un proyecto
exports.getPresupuestosByProyecto = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT p.idPresupuesto, p.fecha, p.estado, c.nombre AS cliente
      FROM Presupuesto p
      JOIN Cliente c ON p.Cliente_idCliente = c.idCliente
      WHERE p.Proyecto_idProyecto = ?
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener presupuestos:', error);
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
};

//Facturas de un proyecto
exports.getFacturasByProyecto = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT f.idFactura, f.fecha, f.estado, c.nombre as cliente, fd.precio_unitario as descripcion
      FROM Factura f
      JOIN Cliente c ON f.Cliente_idCliente = c.idCliente
      LEFT JOIN FacturaDetalle fd ON fd.Factura_idFactura = f.idFactura
      WHERE f.Proyecto_idProyecto = ?
    `, [req.params.id]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
  }
};

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

    let total = 0;

    for (const detalle of detalles) {
      const { Producto_idProducto, cantidad, precio_unitario } = detalle;

      await connection.query(
        `INSERT INTO PresupuestoDetalle (cantidad, precio_unitario, Presupuesto_idPresupuesto)
         VALUES (?, ?, ?)`,
        [cantidad, precio_unitario, presupuestoId]
      );

      await connection.query(
        `INSERT INTO Producto_has_PresupuestoDetalle (Producto_idProducto, PresupuestoDetalle_idPresupuestoDetalle)
         VALUES (?, LAST_INSERT_ID())`,
        [Producto_idProducto]
      );

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

exports.crearFactura = async (req, res) => {
  const {
    fecha,
    estado,
    Cliente_idCliente,
    Proyecto_idProyecto,
    detalles
  } = req.body;

  const connection = await pool.getConnection();
  await connection.beginTransaction();

  try {
    const [facturaRes] = await connection.query(
      `INSERT INTO Factura (fecha, estado, total, Cliente_idCliente, Proyecto_idProyecto)
       VALUES (?, ?, ?, ?, ?)`,
      [fecha, estado, Cliente_idCliente, Proyecto_idProyecto]
    );

    const facturaId = facturaRes.insertId;
    let total = 0;

    for (const detalle of detalles) {
      const { Producto_idProducto, cantidad, precio_unitario } = detalle;

      await connection.query(
        `INSERT INTO FacturaDetalle (cantidad, precio_unitario, Factura_idFactura, Producto_idProducto)
         VALUES (?, ?, ?, ?)`,
        [cantidad, precio_unitario, facturaId, Producto_idProducto]
      );

      total += cantidad * precio_unitario;
    }

    await connection.query(
      `UPDATE Factura SET total = ? WHERE idFactura = ?`,
      [total, facturaId]
    );

    await connection.commit();
    res.status(201).json({ message: 'Factura creada correctamente', id: facturaId });
  } catch (error) {
    await connection.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura' });
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
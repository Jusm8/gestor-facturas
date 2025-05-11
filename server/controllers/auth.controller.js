const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

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

//Actualizar perfil
exports.updateProfile = async (req, res) => {
  const {
    idUsuario,
    nombre,
    email,
    imagen_url,
    fecha_nacimiento,
    sexo,
    localidad
  } = req.body;

  try {
    const clean = (value) => value === '' ? null : value;

    const [result] = await pool.query(
      `UPDATE Usuario SET
    nombre = ?, 
    email = ?, 
    imagen_url = ?, 
    fecha_nacimiento = ?, 
    sexo = ?, 
    localidad = ?
  WHERE idUsuario = ?`,
      [
        clean(nombre),
        clean(email),
        clean(imagen_url),
        clean(fecha_nacimiento),
        clean(sexo),
        clean(localidad),
        idUsuario
      ]
    );

    res.json({ message: 'Perfil actualizado correctamente' });
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

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

exports.register = async (req, res) => {
  const { nombre, email, password, rol } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO Usuario (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hashedPassword, rol]
    );
    res.status(201).json({ message: 'Usuario registrado correctamente' });
  } catch (error) {
    console.error('Error en el registro:', error);
    res.status(500).json({ error: 'Error en el registro' });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const [rows] = await pool.query('SELECT * FROM Usuario WHERE email = ?', [email]);
    const user = rows[0];

    if (!user) return res.status(401).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    const token = jwt.sign({ id: user.idUsuario, rol: user.rol }, process.env.JWT_SECRET);
    res.json({ token, user: { id: user.idUsuario, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error en el login' });
  }
};

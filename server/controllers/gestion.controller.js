const db = require('../db');

//CLIENTES
exports.obtenerClientes = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const [clientes] = await db.query(
      'SELECT * FROM Cliente WHERE Usuario_idUsuario = ?',
      [idUsuario]
    );
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.crearCliente = async (req, res) => {
  try {
    const { nombre, email, nif, direccion, telefono, Usuario_idUsuario } = req.body;
    const [resultado] = await db.query(
      'INSERT INTO Cliente (nombre, email, nif, direccion, telefono, Usuario_idUsuario) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, email, nif, direccion, telefono, Usuario_idUsuario]
    );
    res.status(201).json({ idCliente: resultado.insertId });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

exports.obtenerClienteById = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('SELECT * FROM Cliente WHERE idCliente = ?', [id]);
    if (resultado.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(resultado[0]);
  } catch (error) {
    console.error('Error al obtener cliente:', error);
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
};

exports.actualizarCliente = async (req, res) => {
  const { id } = req.params;
  const { nombre, email, nif, direccion, telefono } = req.body;
  try {
    await db.query(
      'UPDATE Cliente SET nombre = ?, email = ?, nif = ?, direccion = ?, telefono = ? WHERE idCliente = ?',
      [nombre, email, nif, direccion, telefono, id]
    );
    res.json({ message: 'Cliente actualizado' });
  } catch (error) {
    console.error('Error al actualizar cliente:', error);
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
};

exports.eliminarCliente = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM Cliente WHERE idCliente = ?', [id]);
    res.json({ message: 'Cliente eliminado correctamente' });
  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};

//PRODUCTOS
exports.obtenerProductos = async (req, res) => {
  try {
    const { idUsuario } = req.params;
    const [productos] = await db.query('SELECT * FROM Producto WHERE Usuario_idUsuario = ?', [idUsuario]);
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const { nombre, tipo, precio, descripcion, Usuario_idUsuario } = req.body;
    const [resultado] = await db.query(
      'INSERT INTO Producto (nombre, tipo, precio, descripcion, Usuario_idUsuario) VALUES (?, ?, ?, ?, ?)',
      [nombre, tipo, precio, descripcion, Usuario_idUsuario]
    );
    res.status(201).json({ idProducto: resultado.insertId });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

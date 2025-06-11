const db = require('../db');

//CLIENTES
exports.obtenerClientes = async (req, res) => {
  try {
    const { idUsuario, idProyecto } = req.params;
    const [clientes] = await db.query(
      'SELECT * FROM Cliente WHERE Usuario_idUsuario = ? AND Proyecto_idProyecto = ?',
      [idUsuario, idProyecto]
    );
    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.crearCliente = async (req, res) => {
  try {
    const { nombre, email, nif, direccion, telefono, Usuario_idUsuario, Proyecto_idProyecto } = req.body;

    const [resultado] = await db.query(
      'INSERT INTO Cliente (nombre, email, nif, direccion, telefono, Usuario_idUsuario, Proyecto_idProyecto) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, email, nif, direccion, telefono, Usuario_idUsuario, Proyecto_idProyecto]
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
    const { idUsuario, idProyecto } = req.params;
    const [productos] = await db.query(
      'SELECT * FROM Producto WHERE Usuario_idUsuario = ? AND Proyecto_idProyecto = ?',
      [idUsuario, idProyecto]
    );
    res.json(productos);
  } catch (error) {
    console.error('Error al obtener productos:', error);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
};

exports.crearProducto = async (req, res) => {
  try {
    const { nombre, tipo, precio, descripcion, Usuario_idUsuario, Proyecto_idProyecto } = req.body;

    const [resultado] = await db.query(
      'INSERT INTO Producto (nombre, tipo, precio, descripcion, Usuario_idUsuario, Proyecto_idProyecto) VALUES (?, ?, ?, ?, ?, ?)',
      [nombre, tipo, precio, descripcion, Usuario_idUsuario, Proyecto_idProyecto]
    );

    res.status(201).json({ idProducto: resultado.insertId });
  } catch (error) {
    console.error('Error al crear producto:', error);
    res.status(500).json({ error: 'Error al crear producto' });
  }
};

exports.obtenerProductoById = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('SELECT * FROM Producto WHERE idProducto = ?', [id]);
    if (resultado.length === 0) return res.status(404).json({ error: 'No encontrado' });
    res.json(resultado[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
};

exports.actualizarProducto = async (req, res) => {
  const { id } = req.params;
  const { nombre, tipo, precio, descripcion } = req.body;
  try {
    await db.query(
      'UPDATE Producto SET nombre = ?, tipo = ?, precio = ?, descripcion = ? WHERE idProducto = ?',
      [nombre, tipo, precio, descripcion, id]
    );
    res.json({ message: 'Producto actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
};

exports.eliminarProducto = async (req, res) => {
  const { id } = req.params;
  try {
    const [resultado] = await db.query('DELETE FROM Producto WHERE idProducto = ?', [id]);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    res.json({ message: 'Producto eliminado' });
  } catch (error) {
    console.error('Error al eliminar producto:', error);
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
};

exports.duplicarCliente = async (req, res) => {
  const { idClienteOrigen, idProyectoDestino } = req.body;

  try {
    const [[cliente]] = await db.query('SELECT * FROM Cliente WHERE idCliente = ?', [idClienteOrigen]);
    if (!cliente) return res.status(404).json({ error: 'Cliente no encontrado' });

    const [resultado] = await db.query(
      'INSERT INTO Cliente (nombre, email, nif, direccion, telefono, Usuario_idUsuario, Proyecto_idProyecto) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        cliente.nombre,
        cliente.email,
        cliente.nif,
        cliente.direccion,
        cliente.telefono,
        cliente.Usuario_idUsuario,
        idProyectoDestino
      ]
    );

    res.status(201).json({ message: 'Cliente duplicado', idNuevoCliente: resultado.insertId });
  } catch (error) {
    console.error('Error al duplicar cliente:', error);
    res.status(500).json({ error: 'Error al duplicar cliente' });
  }
};

exports.duplicarProducto = async (req, res) => {
  const { idProductoOrigen, idProyectoDestino } = req.body;

  try {
    const [[producto]] = await db.query('SELECT * FROM Producto WHERE idProducto = ?', [idProductoOrigen]);
    if (!producto) return res.status(404).json({ error: 'Producto no encontrado' });

    const [resultado] = await db.query(
      'INSERT INTO Producto (nombre, tipo, precio, descripcion, Usuario_idUsuario, Proyecto_idProyecto) VALUES (?, ?, ?, ?, ?, ?)',
      [
        producto.nombre,
        producto.tipo,
        producto.precio,
        producto.descripcion,
        producto.Usuario_idUsuario,
        idProyectoDestino
      ]
    );

    res.status(201).json({ message: 'Producto duplicado', idNuevoProducto: resultado.insertId });
  } catch (error) {
    console.error('Error al duplicar producto:', error);
    res.status(500).json({ error: 'Error al duplicar producto' });
  }
};

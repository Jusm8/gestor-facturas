const pool = require('../db');

// Crear Presupuesto
exports.crearPresupuesto = async (req, res) => {
  const {
    fecha, total, estado,
    Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto,
    detalles
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [presupuestoResult] = await conn.query(`
      INSERT INTO Presupuesto (fecha, total, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [fecha, total, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto]
    );

    const idPresupuesto = presupuestoResult.insertId;

    for (const item of detalles) {
      await conn.query(`
        INSERT INTO PresupuestoDetalle (cantidad, precio_unitario, Presupuesto_idPresupuesto)
        VALUES (?, ?, ?)`,
        [item.cantidad, item.precio_unitario, idPresupuesto]
      );

      await conn.query(`
        INSERT INTO Producto_has_PresupuestoDetalle (Producto_idProducto, PresupuestoDetalle_idPresupuestoDetalle)
        VALUES (?, LAST_INSERT_ID())`,
        [item.Producto_idProducto]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Presupuesto creado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error('Error en crearPresupuesto:', err);
    res.status(500).json({ error: 'Error al crear el presupuesto' });
  } finally {
    conn.release();
  }
};

// Crear Factura
exports.crearFactura = async (req, res) => {
  const {
    fecha, total, estado,
    Cliente_idCliente, Proyecto_idProyecto,
    detalles
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const [facturaResult] = await conn.query(`
      INSERT INTO Factura (fecha, total, estado, Cliente_idCliente, Proyecto_idProyecto)
      VALUES (?, ?, ?, ?, ?)`,
      [fecha, total, estado, Cliente_idCliente, Proyecto_idProyecto]
    );

    const idFactura = facturaResult.insertId;

    for (const item of detalles) {
      await conn.query(`
        INSERT INTO FacturaDetalle (cantidad, precio_unitario, Factura_idFactura, Producto_idProducto)
        VALUES (?, ?, ?, ?)`,
        [item.cantidad, item.precio_unitario, idFactura, item.Producto_idProducto]
      );
    }

    await conn.commit();
    res.status(201).json({ message: 'Factura creada correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al crear la factura' });
  } finally {
    conn.release();
  }
};

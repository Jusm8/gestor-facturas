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

exports.getPresupuestosByProyecto = async (req, res) => {
  const idProyecto = req.params.id;
  console.log('Buscando presupuestos para proyecto:', idProyecto);

  try {
    const [rows] = await pool.query(`
      SELECT p.idPresupuesto, p.fecha, p.estado, c.nombre as cliente
      FROM Presupuesto p
      JOIN Cliente c ON p.Cliente_idCliente = c.idCliente
      LEFT JOIN PresupuestoDetalle pd ON pd.Presupuesto_idPresupuesto = p.idPresupuesto
      WHERE p.Proyecto_idProyecto = ?`,
      [idProyecto]
    );

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener presupuestos:', error); 
    res.status(500).json({ error: 'Error al obtener presupuestos' });
  }
};


//Facturas de un proyecto
exports.getFacturasByProyecto = async (req, res) => {
  const idProyecto = req.params.id;
  try {
    const [rows] = await pool.query(`
      SELECT f.idFactura, f.fecha, f.estado, c.nombre as cliente, fd.precio_unitario as descripcion
      FROM Factura f
      JOIN Cliente c ON f.Cliente_idCliente = c.idCliente
      LEFT JOIN FacturaDetalle fd ON fd.Factura_idFactura = f.idFactura
      WHERE f.Proyecto_idProyecto = ?`, [idProyecto]);

    res.json(rows);
  } catch (error) {
    console.error('Error al obtener facturas:', error);
    res.status(500).json({ error: 'Error al obtener facturas' });
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
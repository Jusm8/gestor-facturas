const pool = require('../db');

//Crear Presupuesto
exports.crearPresupuesto = async (req, res) => {
  const {
    fecha, fecha_validez, forma_pago, total, estado,
    Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto,
    detalles
  } = req.body;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    //Paso las fechas al formato YYYY-MM-DD
    const fechaSQL = new Date(fecha).toISOString().split('T')[0];
    const fechaValidezSQL = fecha_validez ? new Date(fecha_validez).toISOString().split('T')[0] : null;

    const [presupuestoResult] = await conn.query(`
      INSERT INTO Presupuesto (fecha, fecha_validez, forma_pago, total, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [fechaSQL, fechaValidezSQL, forma_pago, total, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto]

    );

    const idPresupuesto = presupuestoResult.insertId;

    for (const item of detalles) {
      await conn.query(`
        INSERT INTO PresupuestoDetalle (cantidad, precio_unitario, descripcion, Presupuesto_idPresupuesto)
        VALUES (?, ?, ?, ?)`,
        [item.cantidad, item.precio_unitario, item.descripcion || null, idPresupuesto]
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

  try {
    const [rows] = await pool.query(`
      SELECT 
        p.idPresupuesto, 
        p.fecha, 
        p.estado, 
        c.nombre as cliente, 
        GROUP_CONCAT(pd.descripcion SEPARATOR ', ') AS descripcion
      FROM Presupuesto p
      JOIN Cliente c ON p.Cliente_idCliente = c.idCliente
      LEFT JOIN PresupuestoDetalle pd ON pd.Presupuesto_idPresupuesto = p.idPresupuesto
      WHERE p.Proyecto_idProyecto = ?
      GROUP BY p.idPresupuesto, p.fecha, p.estado, c.nombre
    `, [idProyecto]);

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
      SELECT 
        f.idFactura, 
        f.fecha, 
        f.estado, 
        c.nombre as cliente, 
        fd.descripcion
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

//Crear Factura
exports.crearFactura = async (req, res) => {
  const {
    fecha,
    fecha_validez,
    forma_pago,
    estado,
    Cliente_idCliente,
    Proyecto_idProyecto,
    detalles,
    iva = 21,
    retencion = 0
  } = req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    //Factura base
    const [facturaRes] = await conn.query(
      `INSERT INTO Factura (fecha, fecha_validez, forma_pago, estado, Cliente_idCliente, Proyecto_idProyecto, iva, retencion, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      [fecha, fecha_validez || null, forma_pago, estado, Cliente_idCliente, Proyecto_idProyecto, iva, retencion]
    );

    const idFactura = facturaRes.insertId;
    let baseImponible = 0;

    for (const item of detalles) {
      await conn.query(
        `INSERT INTO FacturaDetalle (cantidad, precio_unitario, descripcion, Factura_idFactura, Producto_idProducto)
         VALUES (?, ?, ?, ?, ?)`,
        [item.cantidad, item.precio_unitario, item.descripcion, idFactura, item.Producto_idProducto]
      );

      baseImponible += item.cantidad * item.precio_unitario;
    }

    //Calculo total con IVA y retención
    const total =
      baseImponible +
      (baseImponible * (iva / 100)) -
      (baseImponible * (retencion / 100));

    await conn.query(
      `UPDATE Factura SET total = ? WHERE idFactura = ?`,
      [total, idFactura]
    );

    await conn.commit();
    res.status(201).json({ message: 'Factura creada correctamente', id: idFactura });
  } catch (error) {
    await conn.rollback();
    console.error('Error al crear factura:', error);
    res.status(500).json({ error: 'Error al crear factura' });
  } finally {
    conn.release();
  }
};

exports.eliminarPresupuesto = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM Producto_has_PresupuestoDetalle WHERE PresupuestoDetalle_idPresupuestoDetalle IN (SELECT idPresupuestoDetalle FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?)', [id]);
    await pool.query('DELETE FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?', [id]);
    await pool.query('DELETE FROM Presupuesto WHERE idPresupuesto = ?', [id]);
    res.json({ message: 'Presupuesto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar presupuesto' });
  }
};

exports.eliminarFactura = async (req, res) => {
  const id = req.params.id;
  try {
    await pool.query('DELETE FROM FacturaDetalle WHERE Factura_idFactura = ?', [id]);
    await pool.query('DELETE FROM Factura WHERE idFactura = ?', [id]);
    res.json({ message: 'Factura eliminada' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al eliminar factura' });
  }
};

exports.getFacturaById = async (req, res) => {
  const id = req.params.id;
  try {
    const [facturaRows] = await pool.query('SELECT * FROM Factura WHERE idFactura = ?', [id]);
    if (!facturaRows.length) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const [detalles] = await pool.query('SELECT * FROM FacturaDetalle WHERE Factura_idFactura = ?', [id]);

    res.json({ ...facturaRows[0], detalles });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
};

//Presupuesto
exports.getPresupuestoById = async (req, res) => {
  const id = req.params.id;
  try {
    const [presupuestoRows] = await pool.query(`
      SELECT p.*, c.nombre AS cliente_nombre, c.email AS cliente_email, c.nif, c.direccion
      FROM Presupuesto p
      JOIN Cliente c ON p.Cliente_idCliente = c.idCliente
      WHERE p.idPresupuesto = ?
    `, [id]);

    if (!presupuestoRows.length) {
      return res.status(404).json({ error: 'Presupuesto no encontrado' });
    }

    const presupuesto = presupuestoRows[0];

    const [detalles] = await pool.query(`
      SELECT 
        pd.idPresupuestoDetalle,
        pd.descripcion,
        pd.cantidad,
        pd.precio_unitario,
        php.Producto_idProducto,
        pr.nombre AS nombre_producto
      FROM PresupuestoDetalle pd
      LEFT JOIN Producto_has_PresupuestoDetalle php 
        ON pd.idPresupuestoDetalle = php.PresupuestoDetalle_idPresupuestoDetalle
      LEFT JOIN Producto pr 
        ON pr.idProducto = php.Producto_idProducto
      WHERE pd.Presupuesto_idPresupuesto = ?
    `, [id]);

    res.json({ ...presupuesto, detalles });

  } catch (error) {
    console.error('Error al obtener presupuesto:', error);
    res.status(500).json({ error: 'Error al obtener presupuesto' });
  }
};

//Factura
exports.getFacturaById = async (req, res) => {
  const id = req.params.id;
  try {
    const [facturaRows] = await pool.query('SELECT * FROM Factura WHERE idFactura = ?', [id]);
    if (!facturaRows.length) {
      return res.status(404).json({ error: 'Factura no encontrada' });
    }

    const [detalles] = await pool.query(`
      SELECT fd.*, p.descripcion
      FROM FacturaDetalle fd
      LEFT JOIN Producto p ON p.idProducto = fd.Producto_idProducto
      WHERE fd.Factura_idFactura = ?`, [id]);

    const clienteId = facturaRows[0].Cliente_idCliente;
    const [clienteRows] = await pool.query('SELECT nombre, nif FROM Cliente WHERE idCliente = ?', [clienteId]);

    res.json({
      ...facturaRows[0],
      cliente_nombre: clienteRows[0]?.nombre || '',
      nif: clienteRows[0]?.nif || '',
      detalles
    });
  } catch (error) {
    console.error('Error al obtener factura:', error);
    res.status(500).json({ error: 'Error al obtener factura' });
  }
};

//Editar un presupuesto
exports.editarPresupuesto = async (req, res) => {
  const id = req.params.id;
  const {
    fecha, fecha_validez, forma_pago, total, estado,
    Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto,
    detalles
  } = req.body;

  //Convertir fechas a formato YYYY-MM-DD
  const fechaSQL = new Date(fecha).toISOString().split('T')[0];
  const fechaValidezSQL = fecha_validez ? new Date(fecha_validez).toISOString().split('T')[0] : null;

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    await conn.query(`
      UPDATE Presupuesto SET fecha = ?, fecha_validez = ?, forma_pago = ?, total = ?, estado = ?,
        Usuario_idUsuario = ?, Cliente_idCliente = ?, Proyecto_idProyecto = ?
      WHERE idPresupuesto = ?
    `, [fechaSQL, fechaValidezSQL, forma_pago, total, estado, Usuario_idUsuario, Cliente_idCliente, Proyecto_idProyecto, id]);

    await conn.query(`
      DELETE FROM Producto_has_PresupuestoDetalle 
      WHERE PresupuestoDetalle_idPresupuestoDetalle IN (
        SELECT idPresupuestoDetalle FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?
      )`, [id]);

    await conn.query(`DELETE FROM PresupuestoDetalle WHERE Presupuesto_idPresupuesto = ?`, [id]);

    for (const item of detalles) {
      const [detalleResult] = await conn.query(`
        INSERT INTO PresupuestoDetalle (cantidad, precio_unitario, descripcion, Presupuesto_idPresupuesto)
        VALUES (?, ?, ?, ?)`,
        [item.cantidad, item.precio_unitario, item.descripcion || null, id]);

      const idDetalle = detalleResult.insertId;

      await conn.query(`
        INSERT INTO Producto_has_PresupuestoDetalle (Producto_idProducto, PresupuestoDetalle_idPresupuestoDetalle)
        VALUES (?, ?)`,
        [item.Producto_idProducto, idDetalle]);
    }

    await conn.commit();
    res.json({ message: 'Presupuesto actualizado correctamente' });
  } catch (err) {
    await conn.rollback();
    console.error('Error al editar presupuesto:', err);
    res.status(500).json({ error: 'Error al editar presupuesto' });
  } finally {
    conn.release();
  }
};

exports.editarFactura = async (req, res) => {
  const id = req.params.id;
  const {
    fecha,
    fecha_validez,
    forma_pago,
    estado,
    Cliente_idCliente,
    Proyecto_idProyecto,
    detalles,
    iva = 21,
    retencion = 0
  } = req.body;

  const conn = await pool.getConnection();
  await conn.beginTransaction();

  try {
    //Calculo la base imponible y total actualizado
    let baseImponible = 0;

    for (const item of detalles) {
      baseImponible += item.cantidad * item.precio_unitario;
    }

    const total =
      baseImponible +
      (baseImponible * (iva / 100)) -
      (baseImponible * (retencion / 100));

    await conn.query(
      `UPDATE Factura SET fecha = ?, fecha_validez = ?, forma_pago = ?, estado = ?, Cliente_idCliente = ?, Proyecto_idProyecto = ?, iva = ?, retencion = ?, total = ?
       WHERE idFactura = ?`,
      [fecha, fecha_validez || null, forma_pago, estado, Cliente_idCliente, Proyecto_idProyecto, iva, retencion, total, id]
    );

    await conn.query('DELETE FROM FacturaDetalle WHERE Factura_idFactura = ?', [id]);

    for (const item of detalles) {
      await conn.query(
        `INSERT INTO FacturaDetalle (cantidad, precio_unitario, descripcion, Factura_idFactura, Producto_idProducto)
         VALUES (?, ?, ?, ?, ?)`,
        [item.cantidad, item.precio_unitario, item.descripcion, id, item.Producto_idProducto]
      );
    }

    await conn.commit();
    res.json({ message: 'Factura actualizada correctamente' });
  } catch (error) {
    await conn.rollback();
    console.error('Error al editar factura:', error);
    res.status(500).json({ error: 'Error al editar factura' });
  } finally {
    conn.release();
  }
};

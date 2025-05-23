const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');

//Crear un presupuesto
router.post('/presupuesto', documentoController.crearPresupuesto);

//Crear una factura
router.post('/factura', documentoController.crearFactura);

//Mostrar presupuestos y facturas de un proyecto
router.get('/presupuestos/:id', documentoController.getPresupuestosByProyecto);
router.get('/facturas/:id', documentoController.getFacturasByProyecto);

//Eliminar presupuestos y facturas
router.delete('/presupuesto/:id', documentoController.eliminarPresupuesto);
router.delete('/factura/:id', documentoController.eliminarFactura);

module.exports = router;

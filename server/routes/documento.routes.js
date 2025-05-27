const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');

const {
    crearPresupuesto,
    crearFactura,
    getPresupuestosByProyecto,
    getFacturasByProyecto,
    eliminarPresupuesto,
    eliminarFactura,
    getPresupuestoById,
    getFacturaById,
    editarPresupuesto,
    editarFactura
} = require('../controllers/documento.controller');

//Crear un presupuesto y factura
router.post('/presupuesto', documentoController.crearPresupuesto);
router.post('/factura', documentoController.crearFactura);

//Mostrar presupuestos y facturas de un proyecto
router.get('/presupuestos/:id', documentoController.getPresupuestosByProyecto);
router.get('/facturas/:id', documentoController.getFacturasByProyecto);

//Eliminar presupuestos y facturas
router.delete('/presupuesto/:id', documentoController.eliminarPresupuesto);
router.delete('/factura/:id', documentoController.eliminarFactura);

//Obtener presupuesto  y factura por id
router.get('/presupuesto/:id', documentoController.getPresupuestoById);
router.get('/factura/:id', documentoController.getFacturaById);

//Editar presupuesto y factura
router.put('/presupuesto/:id', documentoController.editarPresupuesto);
router.put('/factura/:id', documentoController.editarFactura);

module.exports = router;
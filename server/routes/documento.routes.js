const express = require('express');
const router = express.Router();
const documentoController = require('../controllers/documento.controller');

// Crear un presupuesto
router.post('/presupuesto', documentoController.crearPresupuesto);

// Crear una factura
router.post('/factura', documentoController.crearFactura);

module.exports = router;

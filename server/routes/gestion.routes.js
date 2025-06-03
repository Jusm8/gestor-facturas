const express = require('express');
const router = express.Router();
const gestionController = require('../controllers/gestion.controller');

// CLIENTES
router.get('/clientes/usuario/:idUsuario', gestionController.obtenerClientes);
router.post('/clientes', gestionController.crearCliente);
router.get('/clientes/:id', gestionController.obtenerClienteById); // lectura individual
router.put('/clientes/:id', gestionController.actualizarCliente);  // edición
router.delete('/clientes/:id', gestionController.eliminarCliente); // ESTA RUTA FALTABA

// PRODUCTOS
router.get('/productos/:idUsuario', gestionController.obtenerProductos);
router.post('/productos', gestionController.crearProducto);

module.exports = router;

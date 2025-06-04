const express = require('express');
const router = express.Router();
const gestionController = require('../controllers/gestion.controller');

// CLIENTES
router.get('/clientes/usuario/:idUsuario/proyecto/:idProyecto', gestionController.obtenerClientes);
router.post('/clientes', gestionController.crearCliente);
router.get('/clientes/:id', gestionController.obtenerClienteById);
router.put('/clientes/:id', gestionController.actualizarCliente);
router.delete('/clientes/:id', gestionController.eliminarCliente);

// PRODUCTOS
router.get('/productos/usuario/:idUsuario/proyecto/:idProyecto', gestionController.obtenerProductos);
router.get('/productos/:id', gestionController.obtenerProductoById);
router.post('/productos', gestionController.crearProducto);
router.put('/productos/:id', gestionController.actualizarProducto);
router.delete('/productos/:id', gestionController.eliminarProducto);

module.exports = router;

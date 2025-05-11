const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update', authController.updateProfile);
router.post('/proyecto', authController.crearProyecto);
router.get('/proyectos/:idUsuario', authController.obtenerProyectosPorUsuario);

module.exports = router;

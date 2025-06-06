const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

//Imagenes
const multer = require('multer');
const path = require('path');

//configuracion personalizada para guardar la imagen con su nombre original
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        const ext = path.extname(file.originalname);
        const name = `${Date.now()}-${file.originalname}`;
        cb(null, name);
    }
});

const upload = multer({ storage });

//Autenticación
router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update', upload.single('imagen'), authController.updateProfile);
//Ruta para verificar el codigo
router.post('/verify', authController.verifyCodeAndRegister);
//Ruta para cambiar la contraseña
router.put('/change-password', authController.changePassword);
//Borrar cuenta
router.delete('/delete-account', authController.deleteAccount);

//Proyectos
router.post('/proyecto', authController.crearProyecto);
router.get('/proyectos/usuario/:idUsuario', authController.obtenerProyectosPorUsuario);
router.get('/proyectos/:id/editar', authController.obtenerProyectoById);
router.put('/proyectos/:id', authController.editarProyecto);
router.delete('/proyectos/:id', authController.eliminarProyecto);

//Presupuestos y Clientes
router.post('/presupuestos', authController.crearPresupuesto);
router.get('/clientes/:id', authController.obtenerClientes);

//Productos
router.get('/productos/:id', authController.obtenerProductosPorUsuario);

module.exports = router;
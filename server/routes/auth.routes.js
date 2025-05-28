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

//Proyectos
router.post('/proyecto', authController.crearProyecto);                          // Crear proyecto
router.get('/proyectos/usuario/:idUsuario', authController.obtenerProyectosPorUsuario); // Listar proyectos de usuario
router.get('/proyectos/:id/editar', authController.obtenerProyectoById);        // Obtener datos para editar
router.put('/proyectos/:id', authController.editarProyecto);                    // Actualizar
router.delete('/proyectos/:id', authController.eliminarProyecto);               // Eliminar

//Presupuestos y Clientes
router.post('/presupuestos', authController.crearPresupuesto);
router.get('/clientes/:id', authController.obtenerClientes);
module.exports = router;
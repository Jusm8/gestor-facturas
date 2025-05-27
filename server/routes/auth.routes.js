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

router.post('/register', authController.register);
router.post('/login', authController.login);
router.put('/update', upload.single('imagen'), authController.updateProfile);
router.post('/proyecto', authController.crearProyecto);
router.get('/proyectos/:idUsuario', authController.obtenerProyectosPorUsuario);
router.post('/presupuestos', authController.crearPresupuesto);
router.get('/clientes/:id', authController.obtenerClientes);
router.delete('/proyectos/:id', authController.eliminarProyecto);

module.exports = router;

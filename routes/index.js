const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');
const vacantesController = require('../controllers/vacantesController');
const usuarioController = require('../controllers/usuarioController');
const autenticarController = require('../controllers/autenticarController');
module.exports = () => {
    router.get('/', homeController.mostrarTrabajos);

    //Vacantes
    router.get('/vacantes/nueva', 
        autenticarController.verificarUsuario,
        vacantesController.formularioNuevaVacante);
    router.post('/vacantes/nueva', 
        autenticarController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.agregarVacante);
    //Muestra un unica vacante
    router.get('/vacantes/:url', vacantesController.mostrarVacante);
    //Editar vacante
    router.get('/vacantes/editar/:url', 
        autenticarController.verificarUsuario,    
        vacantesController.formEditarVacante);
    //Guardar edicion
    router.post('/vacantes/editar/:url', 
        autenticarController.verificarUsuario,
        vacantesController.validarVacante,
        vacantesController.editarVacante);
    //eliminar vacante
    router.delete('/vacantes/eliminar/:id',
        vacantesController.eliminarVacante
    )

    //Crear cuenta
    router.get('/crear-cuenta', usuarioController.formCrearCuenta);    
    //Guardar cuenta
    router.post('/crear-cuenta', 
        usuarioController.validarRegistro,
        usuarioController.crearCuenta);
    
    //Autenticar usuario
    router.get('/iniciar-sesion', usuarioController.formIniciarSesion);
    router.post('/iniciar-sesion', autenticarController.autenticarUsuario);
    //Cerrar sesino
    router.get('/cerrar-sesion',
        autenticarController.verificarUsuario,   
        autenticarController.cerrarSesion);
    //Restablecer password 
    router.get('/reestablecer-password', autenticarController.formReestablecerPassword);
    router.post('/reestablecer-password', autenticarController.enviarToken);

    //Validar el token
    router.get('/reestablecer-password/:token', autenticarController.reestablecerPassword);
    router.post('/reestablecer-password/:token', autenticarController.guardarPassword);
    //Panel de administración
    router.get('/administracion', 
        autenticarController.verificarUsuario,
        autenticarController.mostrarPanel);

    //Editar perfil
    router.get('/editar-perfil',
        autenticarController.verificarUsuario,
        usuarioController.formEditarPerfil);
    router.post('/editar-perfil',
        autenticarController.verificarUsuario,
        usuarioController.subirImagen,
        //usuarioController.validarEditarPerfil,
        usuarioController.editarPerfil);
    //Recibir mensajes de candidatos
    router.post('/vacantes/:url',
        vacantesController.subirCV,
        vacantesController.contactar
    );
    //Muestra los candidatos por vacante
    router.get('/candidatos/:id',
        autenticarController.verificarUsuario,
        vacantesController.mostrartCandidatos
    );
    //Buscador
    router.post('/buscador', vacantesController.buscarVacante);
    return router;
}
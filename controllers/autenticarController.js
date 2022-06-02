const mongoose = require('mongoose');
const passport = require('passport');
const Vacante = mongoose.model('Vacante');
const Usuario = mongoose.model('Usuario');
const crypto = require('crypto');
const enviarEmail = require('../handlers/email');
exports.autenticarUsuario = passport.authenticate('local',{
    successRedirect: '/administracion',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos campos son obligatorios'
})
//Revisar si el usuario esta autenticado o no
exports.verificarUsuario = (req, res, next) =>{
    //revisar el usuario
    if(req.isAuthenticated()){
        return next();
    }
    //redireccionar en caso de no estar autenticado
    res.redirect('/iniciar-sesion');
}
exports.mostrarPanel = async (req, res) => {
    const vacantes = await Vacante.find({autor: req.user._id}).lean();
    res.render('administracion', {
        nombrePagina: 'Panel de administración',
        tagline: 'Crea y administra tus vacantes',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen,
        vacantes
    })
}

exports.cerrarSesion = (req, res) => {
    req.logout();
    req.flash('correcto', 'Cerraste sesion correctamente');
    return res.redirect('/iniciar-sesion');
}

exports.formReestablecerPassword = (req, res) =>{
    res.render('reestablecer-password', {
        nombre: 'Reestalbecer password',
        tagline: 'Si ya tienes una cuenta pero olvidaste tu password, coloca tu email'
    })
}
//enviar token en tabla usuario
exports.enviarToken = async (req, res) =>{
    usuario = await Usuario.findOne({email: req.body.email});
    if(!usuario){
        req.flash('error', 'Usuario no existe');
        return res.redirect('/iniciar-sesion');
    }
    //el usuario existe
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 3600000;

    //Guardar el usuario
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;
    
    //Enviar notificaccion por email
    await enviarEmail.enviar({
        usuario,
        subject: 'Passworrd reset',
        resetUrl,
        archivo: 'reset'
    })
    //enviar notificacion
    req.flash('correcto', 'Revisa tu email para las indicaciones');
    res.redirect('/iniciar-sesion');
}

exports.reestablecerPassword = async (req, res) => {
    const usuario = await Usuario.findOne({
        toke: req.params.token,
        expira: {
            $gt: Date.now()
        }
       
    })
    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }
    //Todo bien el nuevo password
    res.render('nueva-password',{
        nombrePagina: 'Nuevo password'
    })
}

//Almacena  
exports.guardarPassword = async (req, res) =>{
    const usuario = await Usuario.findOne({
        toke: req.params.token,
        expira: {
            $gt: Date.now()
        }
       
    })
    //No existe el usuario o toke invalido
    if(!usuario){
        req.flash('error', 'El formulario ya no es valido, intenta de nuevo');
        return res.redirect('/reestablecer-password');
    }
    usuario.password = req.body.password;
    usuario.token = undefined;
    usuario.expira = undefined;
    //Agregar 
    await usuario.save();
    //Redireccionar y aviso
    req.flash('correcto', 'Password modificado correctamente');
    res.redirect('/iniciar-sesion');
}
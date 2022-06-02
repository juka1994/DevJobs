const mongoose = require('mongoose');
const multer = require('multer');
const shortid = require('shortid');
const Usuarios = mongoose.model('Usuario');

exports.subirImagen = (req, res, next) =>{
   upload(req, res, function(error){
    if(error){
        if(error instanceof multer.MulterError){
            if(error.code === 'LIMIT_FILE_SIZE'){
                req.flash('error', 'El archivo es muy grande: Maximo 100kb');
            }else{
                req.flash('error', error.message);
            }
         }else{
             req.flash('error', error.message);
         }
         res.redirect('/administracion');
         return;
    }else{
        return next();
    }
     
   });
   
}
const configuracionMulter = {
    limits : {fileSize : 100000},
    storage: fileStorage = multer.diskStorage({
        destination: (req, file, cb) =>{
            cb(null, __dirname+'../../public/uploads/perfiles');
        },
        filename: (req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            cb(null,`${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb){
        if(file.mimetype === 'image/jpeg' || file.mimetype === 'image/png'){
            //el callback se ejecuta como tru o false : true cuando la imagen se acepta
            cb(null, true);
        }else{
            cb(new Error('Formato no válido'), false);
        }
    }
}

const upload = multer(configuracionMulter).single('imagen');

exports.formCrearCuenta = (req, res) =>{
    res.render('crear-cuenta',{
        nombrePagina: 'Crea tu cuenta',
        tagline: 'Publica gratuitamente vacantes de trabajos'
    })
}

exports.validarRegistro = (req, res, next) =>{
    //sanitizar
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    req.sanitizeBody('password').escape();
    req.sanitizeBody('repetir').escape();
    //validaciones
    req.checkBody('nombre', 'El nombre es obligatorio').notEmpty();
    req.checkBody('email', 'El email debe ser valido').isEmail();
    req.checkBody('password', 'El password es obligatorio').notEmpty();
    req.checkBody('repetir', 'Confirmar password es obligatorio').notEmpty();
    req.checkBody('repetir', 'El password es diferente').equals(req.body.password);
    const errores = req.validationErrors();

    if(errores){
        //si hay errores
        req.flash('error', errores.map(error => error.msg));
        res.render('crear-cuenta',{
            nombrePagina: 'Crea tu cuenta',
            tagline: 'Publica gratuitamente vacantes de trabajos',
            mensajes: req.flash()
        })

        return;
    }

    //Si no hay errores
    next();
}
exports.crearCuenta = async (req, res, next) =>{
    const usuario = new Usuarios(req.body); 
    try {
        await usuario.save();
        res.redirect('/iniciar-sesion');
    } catch (error) {
        req.flash('error', error);
        res.redirect('/crear-cuenta');
    }
}

exports.formIniciarSesion = (req, res) =>{
    res.render('iniciar-sesion',{
        nombrePagina:'Iniciar sesion',
        tagline: 'Inicia sesion en devJobs'
    })
}

exports.formEditarPerfil = (req, res) =>{
    const usuario = req.user;
    res.render('editar-perfil',{
        nombrePagina: 'Edita tu perfil en devJobs',
        usuario: req.user.toObject(),
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.editarPerfil = async (req, res) =>{
    const usuario = await Usuarios.findById(req.user._id);
    
    usuario.nombre = req.body.nombre;
    usuario.email = req.body.email;

    if(req.body.password){
        usuario.password = req.body.password;
    }
    if(req.file){
        usuario.imagen = req.file.filename;
    }
    usuario.save();
    req.flash('correcto', 'Cambios guardados correctamvente');

    res.redirect('/administracion');
    
}
//validar perfil y sanitizar
exports.validarEditarPerfil = (req, res, next) =>{
    //sanitizar
    req.sanitizeBody('nombre').escape();
    req.sanitizeBody('email').escape();
    if(req.body.password){
        req.sanitizeBody('password').escape();
    }

    //validaciones
    req.checkBody('nombre', 'El nombre es obligatorio').notEmpty();
    req.checkBody('email', 'El email no puede ir vacio').notEmpty();

    const errores = req.validationErrors();
    if(errores){
        req.flash('error', errores.map(error => error.msg));
        res.render('editar-perfil',{
            nombrePagina: 'Edita tu perfil en devJobs',
            mensajes: req.flash(),
            usuario: req.user.toObject(),
            cerrarSesion: true,
            nombre: req.user.nombre,
            imagen: req.user.imagen
        })
    }
    next();
}
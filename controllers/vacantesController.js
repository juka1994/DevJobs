const mongoose = require('mongoose');
const Vacante = mongoose.model('Vacante');
const Usuario = mongoose.model('Usuario');
const multer = require('multer');
const shortid = require('shortid');
exports.formularioNuevaVacante = (req, res) => {
    res.render('nueva-vacante',{
        nombrePagina: 'Nueva vacante',
        tagline: 'Llena el formulario y publica tu vacante',
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}
//Agrega las vantes a la base de datos
exports.agregarVacante = async (req, res) => {
    const vacante = new Vacante(req.body);
    //usuario autor de la vacante
    vacante.autor = req.user._id;

    //crear arreglo de habilidades skills
    vacante.skills = req.body.skills.split(',');

    //almacenarlo en la base de datos
    const nuevaVacante = await vacante.save();

    //redireccionar
    res.redirect(`/vacantes/${nuevaVacante.url}`);

}
//Mostrar vacante por url
exports.mostrarVacante = async (req, res, next) =>{
    const url = req.params.url;
    const vacante = await Vacante.findOne({url}).populate('autor').lean();
  
    if(!vacante) return next();
    res.render('vacante',{
        nombrePagina: vacante.titulo,
        vacante,
        barra: true
    })
}

exports.formEditarVacante = async (req, res, next) =>{
    const vacante = await Vacante.findOne({where:{url: req.params.url}}).lean();
    
    if(!vacante) return next();
    res.render('editar-vacante',{
        nombrePagina: `Editar ${vacante.titulo}`,
        tagline: 'Actualiza los datos que requieras',
        vacante,
        cerrarSesion: true,
        nombre: req.user.nombre,
        imagen: req.user.imagen
    })
}

exports.editarVacante = async (req, res, next) =>{
    const vacanteActualizada = req.body;
    vacanteActualizada.skills = req.body.skills.split(',');
    const vacante = await Vacante.findOneAndUpdate({url: req.params.url}, 
        vacanteActualizada, {
            new: true,
            runValidators: true
        });
        res.redirect(`/vacantes/${vacante.url}`);

}
//sanitizar y validar vacante
exports.validarVacante = (req, res, next) =>{
    //sanitizar
    req.sanitizeBody('titulo').escape();
    req.sanitizeBody('empresa').escape();
    req.sanitizeBody('ubicacion').escape();
    req.sanitizeBody('salario').escape();
    req.sanitizeBody('contrato').escape();
    req.sanitizeBody('skills').escape();

    //validar
    req.checkBody('titulo','Agrega un titulo a la vacante').notEmpty();
    req.checkBody('empresa', 'Agrega un empresa a la vacante').notEmpty();
    req.checkBody('ubicacion', 'Agrega una ubicacion a la vacante').notEmpty();
    req.checkBody('contrato', 'Selecciona un tipo de contrato a la vacante').notEmpty();
    req.checkBody('skills', 'Selecciona al menos un habilidad').notEmpty();

    const errores = req.validationErrors();

    if(errores){
        //redirigir con errores
        req.flash('error', errores.map(error => error.msg));
        res.render('nueva-vacante',{
            nombrePagina: 'Nueva vacante',
            tagline: 'Llena el formulario y publica tu vacante',
            cerrarSesion: true,
            nombre: req.user.nombre,
            mensajes: req.flash()
        })
    }

    next(); //siguiente middleware
}

exports.eliminarVacante = async (req, res) => {
   const { id } = req.params;
   const vacante = await Vacante.findById(id);

   if(verificarAutor(vacante, req.user)){
    //todo bien
    vacante.remove();
    res.status(200).send('Vacante eliminada correcta');
   }else{
       //no permitido
       res.status.send('Error');
   }
  
}

const verificarAutor = (vacante = {}, usuario = {}) =>{
    if(!vacante.autor.equals(usuario._id)){
        return false;
    }
    return true;
}
//Subit PDF
exports.subirCV  = (req, res, next) =>{
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
          res.redirect('back');
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
            cb(null, __dirname+'../../public/uploads/cv');
        },
        filename: (req, file, cb) =>{
            const extension = file.mimetype.split('/')[1];
            cb(null,`${shortid.generate()}.${extension}`);
        }
    }),
    fileFilter(req, file, cb){
        if(file.mimetype === 'application/pdf'){
            //el callback se ejecuta como tru o false : true cuando la imagen se acepta
            cb(null, true);
        }else{
            cb(new Error('Formato no válido'), false);
        }
    }
}
const upload = multer(configuracionMulter).single('cv');

exports.contactar = async (req, res, next) =>{
    const vacante = await Vacante.findOne({url: req.params.url});
   
    if(!vacante) return next();
    const nuevoCandidato ={
        nombre: req.body.nombre,
        email: req.body.email,
        cv: req.file.filename
    }
    vacante.candidatos.push(nuevoCandidato);
    await vacante.save();

    //mensaje flash y redirigir
    req.flash('correcto', 'Contacto enviado');
    res.redirect('/');
}
//Mostrar candidatos por vacante
exports.mostrartCandidatos = async (req, res, next) =>{
   const vacante = await Vacante.findOne({
       _id: req.params.id,
       autor: req.user._id
    }).lean();
   
    res.render('candidatos',{
    nombrePagina:'Candidatos vacante',
    vacante,
    cerrarSesion: true,
    nombre: req.user.nombre,
    imagen: req.user.imagen,
    candidatos: vacante.candidatos
});
   
}

//Buscador de vacantes
exports.buscarVacante = async (req, res) =>{
    const vacantes = await Vacante.find({
        $text:{
            $search: req.body.q
        }
    }).lean();
    //Mostrar vacantes
    res.render('home',{
        nombrePagina: `Resultado búsqueda: ${req.body.q}`,
        vacantes,
        barra: true
    })
}
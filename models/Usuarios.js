const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const bcrypt = require('bcrypt')

const usuariosSchema = new mongoose.Schema({
    nombre:{
        type: String,
        required: 'El nombre es obligatorio'
    },
    email:{
        type: String,
        unique: true,
        lowercase: true,
        trim: true,
    },
    password:{
        type: String,
        required: true,
        trim: true
    },
    token: String,
    expira: Date,
    imagen: String
});

//Método para hashear los password
usuariosSchema.pre('save', async function(next){
    //si el password ya esta hasheado
    if(!this.isModified('password')){
        return next();// deten la ejecucion
    }
    //si no esta gasheado
    const hash = await bcrypt.hash(this.password, 12);
    this.password = hash;
    next();
});
//Método para leer errores de mongo el usuaio ya esta registrado
usuariosSchema.post('save', function(error, doc, next){
   if(error.name === 'MongoServerError' && error.code === 11000){
       next('Ese correo ya esta registrado');
   }else{
       next(error);
   }
});
//Método para autenticar
usuariosSchema.methods = {
    compararPassword: function(password){
        return bcrypt.compareSync(password, this.password);
    }
}
module.exports = mongoose.model('Usuario', usuariosSchema);

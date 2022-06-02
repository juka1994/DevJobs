//Requerimientos para bd
const mongoose = require('mongoose');
require('./config/db');

const express = require('express');
const router = require('./routes');
const {engine} = require('express-handlebars');
const path = require('path');
//vaiables 
require('dotenv').config({ path: 'variables.env'});
//Mantener sesiones
const cookieParser = require('cookie-parser');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const createError = require('http-errors');
const res = require('express/lib/response');
const passport = require('./config/passport');
const { resourceLimits } = require('worker_threads');

const app = express();

//Habilitar body-parser
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

//Validacion de campos,
app.use(expressValidator());

//Habilitar handlebars como view
app.engine('handlebars',
  engine({
      defaultLayout: 'layout',
      helpers: require('./helpers/handlebars')
  })  
);
app.set('view engine', 'handlebars');
//static files
app.use(express.static(path.join(__dirname, 'public')));
//Cosas que se necesitan para iniciar la sesion
app.use(session({
  secret: process.env.SECRETO,
  key: process.env.KEY,
  resave: false,//no las va esta guardando otra vez
  saveUninitialized: false,//si no hace nada el usuario no la guarda
  store: MongoStore.create({ mongoUrl: process.env.DATABASE})
}));

//Inicializar passport
app.use(passport.initialize());
app.use(passport.session());
//Alertas y flash messages
app.use(flash());

//Crear nuestro middleware
app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    next();
})

app.use('/', router());

app.use((req, res, next) => {
   next(createError(404, 'No encontrado'));
})

//Administración de los errores
app.use((error, req, res, next)=>{
  res.locals.mensaje = error.message;
  const status = error.status || 500;
  res.locals.status = status;
  res.status(status);
  res.render('error');
})

app.listen(process.env.PUERTO);
//Variables.env
//DATABASE=mongodb+srv://juka94:1234@cluster0.laiax.mongodb.net/devjobs
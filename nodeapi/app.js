var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var helmet = require('helmet');
var cors = require('cors');
var mongoose = require('mongoose');
const iio = require("./models/iio_sgi").IIO;
var moment = require("moment");
moment.locale("es-ve");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

mongoose.connect(`mongodb://mongo:27017/onfalo`, {useNewUrlParser: true, useUnifiedTopology: true}).then(data=>{
    console.log("Base de Datos Conectada");
}).catch(()=>{
    console.log("Error al conectar a la BD")
});

process.on('exit', function(code) {
  console.log('client exit', code);
});

var app = express();

app.use(helmet());
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;

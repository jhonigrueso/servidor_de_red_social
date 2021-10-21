'use strict'

//cargamos la librerias
const mongoose = require('mongoose');
const app = require('./app');
const port = 3800;

//metodo para conectarnos a la base de datos
mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost:27017/red_social_mean")
    .then(() => {
      console.log("conexion al a base de datos establecida con exito!!");
      // Creacion del Servidor Web
      app.listen(port, () => {
        console.log("servidor corriendo correctamente en la url: localhost:3800");
      });
    })
    .catch((err) => {
      console.log(err);
    });
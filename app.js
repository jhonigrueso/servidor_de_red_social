"use strict";
//vamos a relizar la configuracion del servidor web

//cargamos las librerias a utilizar
const express = require("express");
const app = express();

// cargar archivo de rutas
let user_routes = require("./routes/user");
let follow_routes = require("./routes/follow");
let publication_routes = require("./routes/publication");
let message_routes = require("./routes/message");

//middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

//CORS
// Configurar cabeceras y cors
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Authorization, X-API-KEY, Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.header("Allow", "GET, POST, OPTIONS, PUT, DELETE");
  next();
});

//RUTAS
app.use("/api", user_routes);
app.use("/api", follow_routes);
app.use("/api", publication_routes);
app.use("/api", message_routes);


//exportar
module.exports = app;

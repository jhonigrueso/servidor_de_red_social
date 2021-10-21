"use strict";
// ESTE ES EL MODELO QUE UTILIZAREMOS DE MODO GLOBAL PARA PODER UTILIZAR EN CUALQUIER PARTE DE NUESTRO APLICATIVO.

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let UserSchema = Schema({
  name: String,
  surname: String,
  nick: String,
  email: String,
  password: String,
  role: String,
  image: String,
});

module.exports = mongoose.model("User", UserSchema);

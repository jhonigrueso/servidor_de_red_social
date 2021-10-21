"use strict";
// ESTE ES EL MODELO QUE UTILIZAREMOS DE MODO GLOBAL PARA PODER UTILIZAR EN CUALQUIER PARTE DE NUESTRO APLICATIVO.

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let PublicationSchema = Schema({
  text: String,
  file: String,
  created_at: String,
  user: { type: Schema.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Publication", PublicationSchema);

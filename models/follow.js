"use strict";
// ESTE ES EL MODELO QUE UTILIZAREMOS DE MODO GLOBAL PARA PODER UTILIZAR EN CUALQUIER PARTE DE NUESTRO APLICATIVO.

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

let FollowSchema = Schema({
  user: { type: Schema.ObjectId, ref: "User" },
  followed: { type: Schema.ObjectId, ref: "User" },
});

module.exports = mongoose.model("Follow", FollowSchema);

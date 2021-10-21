"use strict";

//cargamos los modulos necesarios
const express = require("express");
const MessageController = require("../controllers/message");

let api = express.Router();
let md_auth = require("../middlewares/authenticated");

//RUTA DE PRUEBA
api.get("/pruebas", md_auth.ensureAuth, MessageController.pruebas);
api.post("/message", md_auth.ensureAuth, MessageController.saveMessage);
api.get("/my-messages/:page?", md_auth.ensureAuth, MessageController.getReceiverMessages);
api.get("/messages/:page?", md_auth.ensureAuth, MessageController.getEmmitMessages);
api.get("/unviewd-messages/", md_auth.ensureAuth, MessageController.getUnviewedMessages);
api.get("/set-viewed-messages/", md_auth.ensureAuth, MessageController.setViewedMessages);

module.exports = api;

"use strict";

//cargamos los modulos necesarios
const express = require("express");
const UserController = require("../controllers/user");
const multipart = require("connect-multiparty");

let api = express.Router();
let md_auth = require("../middlewares/authenticated");
let md_upload = multipart({ uploadDir: "./uploads/users" });

//RUTA DE PRUEBA
api.get("/home", md_auth.ensureAuth, UserController.home);

//RUTAS QUE NOS AYUDA A REGISTRAR UN USUAIO Y LOGUEAR UN USARIO.
api.post("/register", UserController.saveUser);
api.post("/login", UserController.loginUser);

//RUTAS PARA MOSTRAR , PAGINAR Y ACTUALIZAR UN USUARIO.
api.get("/user/:id", md_auth.ensureAuth, UserController.getUser);
api.get("/users/:page?", md_auth.ensureAuth, UserController.getUsers);
api.get("/counters/:id?", md_auth.ensureAuth, UserController.getConters);
api.put("/update-user/:id", md_auth.ensureAuth, UserController.updateUser);

//RUTAS PARA GUADAR Y MOSTRAR LA IMAGEN DE UN USUARIO.
api.post("/upload-image-user/:id",[md_auth.ensureAuth, md_upload],UserController.uploadImage);
api.get("/get-image-user/:imageFile", UserController.getImageFile);

//LINEA QUE NOS AYUDA EXPORTAR ESTE ARCHIVO PARA SER UTILIZADO EN OTRO ARCHIVO DE MI APLICATIVO
module.exports = api;

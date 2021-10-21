"use strict";

//cargamos los modulos necesarios
const express = require("express");
const PublicationController = require("../controllers/publication");
const multipart = require("connect-multiparty");

let api = express.Router();
let md_auth = require("../middlewares/authenticated");
let md_upload = multipart({ uploadDir: "./uploads/publications" });

//RUTA DE PRUEBA
api.get("/probando", md_auth.ensureAuth, PublicationController.probando);
api.post("/publication",md_auth.ensureAuth,PublicationController.savePublication
);
api.get("/publications/:page?", md_auth.ensureAuth, PublicationController.getPublications);
api.get("/publications-user/:user/:page?",md_auth.ensureAuth,PublicationController.getPublicationsUser
);
api.get("/publication/:id", md_auth.ensureAuth, PublicationController.getPublication);
api.delete("/publication/:id", md_auth.ensureAuth, PublicationController.deletePublication);

//RUTAS PARA GUADAR Y MOSTRAR LA IMAGEN DE UNA PUBLICACION.
api.post("/upload-image-pub/:id",[md_auth.ensureAuth, md_upload],PublicationController.uploadImage);
api.get("/get-image-pub/:imageFile", PublicationController.getImageFile);


module.exports = api;

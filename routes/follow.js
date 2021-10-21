"use strict";

//cargamos los modulos necesarios
const express = require("express");
const FollowController = require("../controllers/follow");
const multipart = require("connect-multiparty");

let api = express.Router();
let md_auth = require("../middlewares/authenticated");

//RUTA DE PRUEBA
api.post("/follow", md_auth.ensureAuth, FollowController.saveFollow);
api.delete("/follow/:id", md_auth.ensureAuth, FollowController.deleteFollow);
api.get(
  "/following/:id?/:page?",
  md_auth.ensureAuth,
  FollowController.getFollowUsers
);
api.get(
  "/followed/:id?/:page?",
  md_auth.ensureAuth,
  FollowController.getFollowedUsers
);
api.get(
  "/get-my-follows/:followed?",
  md_auth.ensureAuth,
  FollowController.getMyFollows
);

module.exports = api;

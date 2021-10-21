"use strict";

//cargar los modulos
const jwt = require("jwt-simple");
const moment = require("moment");
let secret = "clave_secreta_curso_desarrollar_red_social_angular";

exports.ensureAuth = function(req, res, next) {
  if (!req.headers.authorization) {
    return res
      .status(403)
      .send({ message: "La peticion no tiene la cabecera de autenticación." });
  }

  let token = req.headers.authorization.replace(/['"]+/g, '');
  try {
    var payload = jwt.decode(token, secret);
    if (payload.exp <= moment().unix()) {
      return res.status(401).send({
        message: "El token ha expirado",
      });
    }
  } catch (ex) {
      return res.status(404).send({
        message: "El token no es válido",
      });
  }

  req.user = payload;

  next();
};

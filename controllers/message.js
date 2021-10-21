"use strict";

const moment = require("moment");
const mongoosePagiante = require("mongoose-pagination");

let User = require("../models/user");
let Message = require("../models/message");
let Follow = require("../models/follow");

//metodos de prueba
function pruebas(req, res) {
  res.status(200).send({
    message: "HOLA DESDE EL SERVIDOR DE NODEJS EN MESSAGE",
  });
}

//* este metodo nos ayuda a enviar un mensaje
function saveMessage(req, res) {
  let params = req.body;

  if (!params.text || !params.receiver)
    return res.status(200).send({ message: " enviar Los Datos Necesarios!!" });

  let message = new Message();
  message.emitter = req.user.sub;
  message.receiver = params.receiver;
  message.text = params.text;
  message.created_at = moment().unix();
  message.viewed = "false";

  message.save((err, messageStored) => {
    if (err)
      return res.status(500).send({ message: "Error al guardar el mensaje" });

    if (!messageStored)
      return res
        .status(404)
        .send({ message: "El mensaje NO se ha podido guardar" });

    return res.status(200).send({ message: messageStored });
  });
}

//* metodo que nos ayuda a listar todos los mensajes que nos han enviado
function getReceiverMessages(req, res) {
  let userId = req.user.sub;

  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  let itemsPerPage = 4;

  Message.find({ receiver: userId })
    .populate("emitter", "name surname nick image _id").sort('-created_at')
    .paginate(page, itemsPerPage, (err, messages, total) => {
      if (err)
        return res.status(500).send({ message: "Error al guardar el mensaje" });

      if (!messages) return res.status(404).send({ message: "No hay mensaje" });

      return res.status(200).send({
        total: total,
        messages,
        pages: Math.ceil(total / itemsPerPage),
        page: page,
      });
    });
}

//* metodo que nos ayuda a listar todos los mensajes que hemos enviado
function getEmmitMessages(req, res) {
  let userId = req.user.sub;

  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  let itemsPerPage = 4;

  Message.find({ emitter: userId })
    .populate("emitter receiver", "name surname nick image _id")
    .sort("-created_at")
    .paginate(page, itemsPerPage, (err, messages, total) => {
      if (err)
        return res.status(500).send({ message: "Error al guardar el mensaje" });

      if (!messages) return res.status(404).send({ message: "No hay mensaje" });

      return res.status(200).send({
        total: total,
        messages,
        pages: Math.ceil(total / itemsPerPage),
        page: page,
      });
    });
}

//* metodo que nos ayuda a saber cuando no hemos visto un mensaje
function getUnviewedMessages(req, res) {
  let useId = req.user.sub;

  Message.count({ receiver: useId, viewed: "false" }).exec((err, count) => {
    if (err) return res.status(500).send({ message: "Error en la petición" });

    return res.status(200).send({
      unviewed: count,
    });
  });
}
//* metodo que nos ayuda a saber cuando hemos visto un mensaje
function setViewedMessages(req, res) {
  let useId = req.user.sub;

  Message.updateMany(
    { receiver: useId, viewed: "false" },
    { viewed: "true" },
    { multi: true }
  ).exec((err, messagesUpdates) => {
    if (err) return res.status(500).send({ message: "Error en la petición" });

    return res.status(200).send({
      messages: messagesUpdates,
    });
  });
}

module.exports = {
  pruebas,
  saveMessage,
  getReceiverMessages,
  getEmmitMessages,
  getUnviewedMessages,
  setViewedMessages,
};

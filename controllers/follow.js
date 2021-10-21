"use strict";

// cargamos el modelos y las librerias que necesitara el controlador
// const fs = require("fs");
// const path = require("path");
const mongoosePagiante = require("mongoose-pagination");

let user = require("../models/user");
let Follow = require("../models/follow");

//metodo que nos ayuda a seguir a un usuario de la plataforma
function saveFollow(req, res) {
  let params = req.body;
  let follow = new Follow();

  follow.user = req.user.sub;
  follow.followed = params.followed;
  follow.save((err, followStored) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Error al guardar el  seguimiento" });

    if (!followStored)
      return res
        .status(404)
        .send({ message: "El seguimiento no se ha guardado" });

    return res.status(200).send({ follow: followStored });
  });
}

//metodo que nos ayuda a dejar de seguir a un usuario de la plataforma
function deleteFollow(req, res) {
  let userId = req.user.sub;
  let followId = req.params.id;

  Follow.find({ user: userId, followed: followId }).deleteOne((err) => {
    if (err)
      return res.status(500).send({ message: "Error al dejar de seguir" });

    return res.status(200).send({ message: "El follow se ha eliminado!!" });
  });
}

//metodo que nos ayuda a sacar una lista para saber que usuarios estamso siguiendo
function getFollowUsers(req, res) {
  let userId = req.user.sub;

  if (req.params.id && req.params.page) {
    userId = req.params.id;
  }

  var page = 1;

  if (req.params.page) {
    page = req.params.page;
  } else {
    page = req.params.id;
  }

  var itemsPerPage = 4;

  Follow.find({ user: userId })
    .populate({ path: "followed" })
    .paginate(page, itemsPerPage, (err, follows, total) => {
      if (err) return res.status(500).send({ message: "Error en el servidor" });

      if (!follows)
        return res
          .status(404)
          .send({ message: "No estas siguiendo a ningun usuario" });

      followUSerIds(userId).then((value) => {
        return res.status(200).send({
          total: total,
          pages: Math.ceil(total / itemsPerPage),
          follows,
          users_following: value.following,
          users_follow_me: value.followed,
        });
      });
    });
}

//metodo que nos ayuda a sacar una lista para saber que usuarios nos siguen.
function getFollowedUsers(req, res) {
  let userId = req.user.sub;

  if (req.params.id && req.params.page) {
    userId = req.params.id;
  }

  var page = 1;

  if (req.params.page) {
    page = req.params.page;
  } else {
    page = req.params.id;
  }

  var itemsPerPage = 4;

  Follow.find({ followed: userId })
    .populate("user")
    .paginate(page, itemsPerPage, (err, follows, total) => {
      if (err) return res.status(500).send({ message: "Error en el servidor" });

      if (!follows)
        return res.status(404).send({ message: "No te sigue ningun usuario" });

      followUSerIds(req.user.sub).then((value) => {
        return res.status(200).send({
          total: total,
          pages: Math.ceil(total / itemsPerPage),
          follows,
          users_following: value.following,
          users_follow_me: value.followed,
        });
      });
    });
}

async function followUSerIds(user_id) {
  var following = await Follow.find({ user: user_id })
    .select({ _id: 0, __v: 0, user: 0 })
    .then((follows) => {
      const following_clean = [];
      follows.forEach((follow) => {
        following_clean.push(follow.followed);
      });
      return following_clean;
    })
    .catch((e) => {
      return e;
    });

  var followed = await Follow.find({ followed: user_id })
    .select({ _id: 0, __v: 0, followed: 0 })
    .then((follows) => {
      const followed_clean = [];
      follows.forEach((follow) => {
        followed_clean.push(follow.user);
      });
      return followed_clean;
    })
    .catch((e) => {
      return e;
    });

  return {
    following: following,
    followed: followed,
  };
}
// metodo que nos ayudara de manera clara a sacar una lista de los usuario que yo estoy siguiendo
function getMyFollows(req, res) {
  let userId = req.user.sub;

  let find = Follow.find({ followed: userId });

  if (req.params.followed) {
    find = Follow.find({ followed: userId });
  }

  find.populate("user followed").exec((err, follows) => {
    if (err) return res.status(500).send({ message: "Error en el servidor" });

    if (!follows)
      return res.status(404).send({ message: "No sigue a ningun usuario" });

    return res.status(200).send({
      follows,
    });
  });
}

module.exports = {
  saveFollow,
  deleteFollow,
  getFollowUsers,
  getFollowedUsers,
  getMyFollows,
};

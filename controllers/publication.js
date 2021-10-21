"use strict";
const path = require("path");
const fs = require("fs");
const moment = require("moment");
const mongoosePagiante = require("mongoose-pagination");

let Publication = require("../models/publication");
let User = require("../models/user");
let Follow = require("../models/follow");

//metodos de prueba
function probando(req, res) {
  res.status(200).send({
    message: "HOLA DESDE EL SERVIDOR DE NODEJS EN PUBLICACIONES",
  });
}

function savePublication(req, res) {
  let params = req.body;

  if (!params.text)
    return res.status(200).send({ message: "Debes enviar un texto!!" });

  let publication = new Publication();
  publication.text = params.text;
  publication.file = "null";
  publication.user = req.user.sub;
  publication.created_at = moment().unix();

  publication.save((err, publicationStored) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Error al guardar la publicacion" });

    if (!publicationStored)
      return res
        .status(404)
        .send({ message: "la publicacion NO se ha podido guardar" });

    return res.status(200).send({ publication: publicationStored });
  });
}

//* APROBADO 100%
function getPublications(req, res) {
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  let itemsPerPage = 4;

  Follow.find({ user: req.user.sub })
    .populate("followed")
    .exec((err, follows) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al devolver el seguimiento" });

      var follows_clean = [];
      follows.forEach((follow) => {
        follows_clean.push(follow.followed);
      });
      follows_clean.push(req.user.sub);
      Publication.find({ user: { $in: follows_clean } })
        .sort("-created_at")
        .populate(["user"])
        .paginate(page, itemsPerPage, (err, publications, total) => {
          if (err)
            return res
              .status(500)
              .send({ message: "Error al devolver publicaciones" });

          if (!publications)
            return res.status(404).send({
              message: "No hay publicaciones",
            });

          return res.status(200).send({
            total_items: total,
            publications,
            pages: Math.ceil(total / itemsPerPage),
            page: page,
            items_per_page: itemsPerPage,
          });
        });
    });
}

function getPublicationsUser(req, res) {
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  let user = req.user.sub;
  if (req.params.user) {
    user = req.params.user;
  }

  let itemsPerPage = 4;

  Publication.find({ user: user })
    .sort("-created_at")
    .populate(["user"])
    .paginate(page, itemsPerPage, (err, publications, total) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error al devolver publicaciones" });

      if (!publications)
        return res.status(404).send({
          message: "No hay publicaciones",
        });

      return res.status(200).send({
        total_items: total,
        publications,
        pages: Math.ceil(total / itemsPerPage),
        page: page,
        items_per_page: itemsPerPage,
      });
    });
}

//* METODO PROBADO Y ACEPTADO 100%
// ESTE METODO NOS AYUDA A SACAR UNA SOLA PUBLICACION POR SU ID
function getPublication(req, res) {
  let publicationId = req.params.id;

  Publication.findById(publicationId, (err, publication) => {
    if (err)
      return res
        .status(500)
        .send({ message: "Error al devolver publicaciones" });

    if (!publication)
      return res.status(404).send({
        message: "No existe la publicación",
      });

    return res.status(200).send({
      publication,
    });
  });
}

//METODO QUE NOS AYUDARA A ELIMINAR UNA PUBLICACION
function deletePublication(req, res) {
  let publicationId = req.params.id;

  Publication.find({ user: req.user.sub, _id: publicationId }).deleteOne(
    (err) => {
      if (err)
        return res.status(500).send({ message: "Error borrar publicaciones" });

      // if (!publicationRemoved)
      //   return res.status(404).send({
      //     message: "No se ha podido borrar la publicacion",
      //   });

      return res
        .status(200)
        .send({ message: "Publicacion eliminada con exitó!!" });
    }
  );
}
//Subir archivos de imagen/avatar de usuario
function uploadImage(req, res) {
  let publicationId = req.params.id;

  if (req.files) {
    let file_path = req.files.image.path;
    let file_split = file_path.split("\\");
    let file_name = file_split[2];
    let ext_split = file_name.split(".");
    let file_ext = ext_split[1];

    if (
      file_ext == "png" ||
      file_ext == "jpg" ||
      file_ext == "jpeg" ||
      file_ext == "gif"
    ) {
      Publication.findOne({ user: req.user.sub, _id: publicationId }).exec(
        (err, publication) => {
          if (publication) {
            //ACTUALIZAR DOCUMENTO DE PUBLICACION
            Publication.findByIdAndUpdate(
              publicationId,
              { file: file_name },
              { new: true },
              (err, publicationUpdated) => {
                if (err)
                  return res
                    .status(500)
                    .send({ message: "No se ha podidio subir la imagen" });
                if (!publicationUpdated)
                  return res.status(404).send({
                    message: "No se ha podido actualizar la imagen del usuario",
                  });

                return res.status(200).send({
                  publication: publicationUpdated,
                });
              }
            );
          } else {
            return removeFileOfUploads(
              res,
              file_path,
              "No tienes Permiso para actualizar esta publicación"
            );
          }
        }
      );
    } else {
      return removeFileOfUploads(res, file_path, "La extesión no es válida");
    }
  } else {
    if (err)
      return res.status(200).send({ message: "No se han subido Archivo" });
  }
}

// metodo que nos ayuda a eliminar un archivo si no es correcto y no dejarnos avanzar
function removeFileOfUploads(res, file_path, message) {
  fs.unlink(file_path, (err) => {
    return res.status(200).send({ message: message });
  });
}

//metodo para devolver la imagen de un usuario que igualmente va estar protegida
function getImageFile(req, res) {
  let image_file = req.params.imageFile;
  let path_file = "./uploads/publications/" + image_file;

  fs.exists(path_file, (exists) => {
    if (exists) {
      return res.sendFile(path.resolve(path_file));
    } else {
      return res.status(200).send({
        message: "No existe la imagen...",
      });
    }
  });
}
module.exports = {
  probando,
  savePublication,
  getPublications,
  getPublication,
  deletePublication,
  uploadImage,
  getImageFile,
  getPublicationsUser,
};

"use strict";
// cargamos el modelos que necesitara el controlador
const bcrypt = require("bcrypt-nodejs");
const User = require("../models/user");
const Follow = require("../models/follow");
const Publicacion = require("../models/publication");
const jwt = require("../services/jwt");
const fs = require("fs");
const path = require("path");
const mongoosePagiante = require("mongoose-pagination");

//metodos de prueba
function home(req, res) {
  res.status(200).send({
    message: "HOLA DESDE EL SERVIDOR DE NODEJS EN USUARIO",
  });
}

//METODO QUE NOS AYUDARA A GUADAR UN USUARIO
function saveUser(req, res) {
  let params = req.body;
  let user = new User();

  if (
    params.name &&
    params.surname &&
    params.nick &&
    params.email &&
    params.password
  ) {
    user.name = params.name;
    user.surname = params.surname;
    user.nick = params.nick;
    user.email = params.email;
    user.role = "ROLE_USER";
    user.image = null;

    //controlar usuario dublicados
    User.find({
      $or: [
        { email: user.email.toLowerCase() },
        { nick: user.nick.toLowerCase() },
      ],
    }).exec((err, users) => {
      if (err)
        return res
          .status(500)
          .send({ message: "Error en la peticion de usuario" });

      if (users && users.length >= 1) {
        return res
          .status(200)
          .send({ message: "El usuario que intentas registrar ya existe" });
      } else {
        //metodo que nos ayuda para encryptar la contraseña y guardar el usuario.
        bcrypt.hash(params.password, null, null, (err, hash) => {
          user.password = hash;
          user.save((err, userStored) => {
            if (err)
              return res
                .status(500)
                .send({ message: "Error al guardar el usuario" });

            if (userStored) {
              res.status(200).send({ user: userStored });
            } else {
              res
                .status(404)
                .send({ message: "No se ha registrado el usuario" });
            }
          });
        });
      }
    });
  } else {
    res.status(200).send({
      message: "envia todos los datos porque son necesarios!!",
    });
  }
}

//metodo que nos ayuda para loguear a un usuario y comprobar que todo este correcto
function loginUser(req, res) {
  let params = req.body;
  let email = params.email;
  let password = params.password;

  User.findOne({ email: email }, (err, user) => {
    if (err) return res.status(500).send({ message: "Error en la petición" });

    if (user) {
      bcrypt.compare(password, user.password, (err, check) => {
        if (check) {
          if (params.gettoken) {
            //generar y devolver token.
            return res.status(200).send({
              token: jwt.createToken(user),
            });
          } else {
            //devolver datos de usuario
            user.password = undefined;
            return res.status(200).send({ user });
          }
        } else {
          return res
            .status(404)
            .send({ message: "El usuario no se ha podido identificar" });
        }
      });
    } else {
      return res
        .status(404)
        .send({ message: "El usuario no se ha podido identificar!!" });
    }
  });
}

//conseguir datos de un usuario
function getUser(req, res) {
  let userId = req.params.id;

  User.findById(userId, (err, user) => {
    if (err) return res.status(500).send({ message: "Error en la petición" });

    if (!user) return res.status(404).send({ message: "El usuario no existe" });

    followThisUser(req.user.sub, userId).then((value) => {
      user.password = undefined;
      return res.status(200).send({
        user,
        following: value.following,
        followed: value.followed,
      });
    });
  });
}

async function followThisUser(identity_user_id, user_id) {
  const following = await Follow.findOne({
    user: identity_user_id,
    followed: user_id,
  }).then((err, follow) => {
    if (err) return err;
    return follow;
  });

  const followed = await Follow.findOne({
    user: user_id,
    followed: identity_user_id,
  }).then((err, follow) => {
    if (err) return err;
    return follow;
  });

  return {
    following: following,
    followed: followed,
  };
}

//Devolver un listado de usuario paginado
function getUsers(req, res) {
  let identity_user_id = req.user.sub;
  let page = 1;
  if (req.params.page) {
    page = req.params.page;
  }

  let itemsPerPage = 5;
  User.find()
    .sort("_id")
    .paginate(page, itemsPerPage, (err, users, total) => {
      if (err) return res.status(500).send({ message: "Error en la petición" });

      if (!users)
        return res.status(404).send({ message: "No hay usuarios disponibles" });

      followUSerIds(identity_user_id).then((value) => {
        return res.status(200).send({
          users,
          users_following: value.following,
          users_follow_me: value.followed,
          total,
          page: Math.ceil(total / itemsPerPage),
        });
      });
    });
}

//* YA SOLUCIONE EL PROBLEMA QUE TENIA LO QUE PASABA ERA QUE ESTABA MEZCLANDO CALLBACKS CON PROMESA Y ESE ES UN GRAN ERROR
// ESTA FUNCION NOS AYUDA A SACAR LOS ID DE LOS USUARIOS QUE ESTAMOS SIGUIENDO AL IGUAL QUE LOS USUARIOS QUE ESTAMOS SIGUIENDO
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

// * esta funcion nos ayudara a contar los seguidores,los que seguimos al igual que las publicaciones que hemos subido
function getConters(req, res) {
  var userId = req.user.sub;

  if (req.params.id) {
    userId = req.params.id;
  }
  getCountFollow(userId)
    .then((value) => {
      return res.status(200).send(value);
    })
    .catch((e) => {
      return e;
    });
}

async function getCountFollow(user_id) {
  const following = await Follow.count({ user: user_id })
    .then((count) => {
      return count;
    })
    .catch((e) => {
      return e;
    });

  const followed = await Follow.count({ followed: user_id })
    .then((count) => {
      return count;
    })
    .catch((e) => {
      return e;
    });

  const publications = await Publicacion.count({ user: user_id })
    .then((count) => {
      return count;
    })
    .catch((e) => {
      return e;
    });

  return {
    following: following,
    followed: followed,
    publications: publications,
  };
}
//* FIN DE LA FUNCION DE CONTAR FOLLOW

//Edición de datos de usuario
function updateUser(req, res) {
  let userId = req.params.id;
  let update = req.body;

  //borrar la propiedad password
  delete update.password;

  if (userId != req.user.sub) {
    return res.status(500).send({
      message: "No tienes Permiso Para Actualizar los datos del usuario",
    });
  }

  //controlar usuario dublicados
  User.find({
    $or: [
      { email: update.email.toLowerCase() },
      { nick: update.nick.toLowerCase() },
    ],
  }).exec((err, users) => {
    let user_isset = false;
    users.forEach((user) => {
      if (user && user._id != userId) user_isset = true;
    });

    if (user_isset)
      return res.status(404).send({
        message: "Los datos ya estan en uso",
      });

    User.findByIdAndUpdate(
      userId,
      update,
      { new: true },
      (err, userUpdated) => {
        if (err)
          return res.status(500).send({ message: "Error en la petición" });

        if (!userUpdated)
          return res
            .status(404)
            .send({ message: "No se ha podido actualizar el usuario" });

        return res.status(200).send({ user: userUpdated });
      }
    );
  });
}

//Subir archivos de imagen/avatar de usuario
function uploadImage(req, res) {
  let userId = req.params.id;

  if (req.files) {
    let file_path = req.files.image.path;
    let file_split = file_path.split("\\");
    let file_name = file_split[2];
    let ext_split = file_name.split(".");
    let file_ext = ext_split[1];

    if (userId != req.user.sub) {
      return removeFileOfUploads(
        res,
        file_path,
        "No tienes Permiso Para Actualizar los datos del usuario"
      );
    }

    if (
      file_ext == "png" ||
      file_ext == "jpg" ||
      file_ext == "jpeg" ||
      file_ext == "gif"
    ) {
      //ACTUALIZAR DOCUMENTO DEL USUARIO LOGUEADO
      User.findByIdAndUpdate(
        userId,
        { image: file_name },
        { new: true },
        (err, userUpdated) => {
          if (err)
            return res
              .status(500)
              .send({ message: "No se ha podidio subir la imagen" });
          if (!userUpdated)
            return res.status(404).send({
              message: "No se ha podido actualizar la imagen del usuario",
            });

          return res.status(200).send({
            proyect: userUpdated,
          });
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
  let path_file = "./uploads/users/" + image_file;

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
  home,
  saveUser,
  loginUser,
  getUser,
  getUsers,
  getConters,
  updateUser,
  uploadImage,
  getImageFile,
};

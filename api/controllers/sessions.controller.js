const Session = require("../models/session.model");
const User = require("../models/user.model");
const createError = require("http-errors");

module.exports.create = (req, res, next) => {
  const { email, password } = req.body;

  User.findOne({ email })
    .then((user) => {
      if (!user) {
        return next(createError(401, "Bad credentials (user not found)"));
      }

      user.checkPassword(password)
        .then((match) => {
          if (!match) {
            return next(createError(401, "Bad credentials (wrong password)"));
          }

          Session.create({ user: user.id })
            .then((session) => {
              res.setHeader(
                "Set-Cookie",
                `session=${session.id}; HttpOnly; ${process.env.NODE_ENV === "production" ? "Secure;" : ""}`
              );

              res.json(user);
            })
            .catch(next);
        })
        .catch(next);
    })
    .catch(next);
};

module.exports.destroy = (req, res, next) => {
  if (!req.session || !req.session.id) {
    return next(createError(400, "No active session found"));
  }

  Session.findByIdAndDelete(req.session.id)
    .then(() => {
      res.setHeader("Set-Cookie", "session=; HttpOnly; Max-Age=0"); // Expira la cookie
      res.status(204).send();
    })
    .catch(next);
};

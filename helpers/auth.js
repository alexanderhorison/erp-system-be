const jwt = require("jsonwebtoken");
const { User } = require("../models");
const { responses, throwValidation } = require("./responses");

class Auth {
  static async Authentication(req, res, next) {
    try {
      const { authorization } = req.headers;
      if (!authorization) {
        throw new Error("Token not provided");
      }

      const [bearer, token] = authorization.split(" ");
      if (!token || !bearer.toLowerCase().includes("bearer")) {
        throw new Error("Token invalid");
      }

      let data = jwt.verify(token, process.env.TOKEN_KEY);
      let user = await User.findOne({
        where: { email: data.email },
      });

      if (!user) {
        throw new Error("Token invalid");
      }

      req.UserData = data;
      next();
    } catch (error) {
      let isJWTError = [
        "token",
        "jwt",
        "expired",
        "invalid",
        "signature",
      ].reduce((prev, cur) => {
        if (prev) return prev;
        return error.message.toLowerCase().includes(cur);
      }, false);
      let errCode = isJWTError ? 401 : error.code ? error.code : 500;
      res.status(errCode).json(responses(false, error.message, error));
    }
  }
  static async Admin(req, res, next) {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        throw throwValidation(401, "Token not provided");
      }

      const [bearer, token] = authorization.split(" ");
      if (!token || !bearer.toLowerCase().includes("bearer")) {
        throw throwValidation(403, "Token invalid");
      }

      let data = jwt.verify(token, process.env.TOKEN_KEY);

      let user = await User.findOne({
        where: { email: data.email },
      });

      if (user.RoleId != 1) {
        throw throwValidation(403, "Fitur ini hanya bisa diakses oleh admin");
      }

      next();
    } catch (error) {
      res.status(500).json(responses(false, error.message, error));
    }
  }

  static async KepalaGudang(req, res, next) {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        throw throwValidation(401, "Token not provided");
      }

      const [bearer, token] = authorization.split(" ");
      if (!token || !bearer.toLowerCase().includes("bearer")) {
        throw throwValidation(403, "Token invalid");
      }

      let data = jwt.verify(token, process.env.TOKEN_KEY);

      let user = await User.findOne({
        where: { email: data.email },
      });

      if (user.RoleId != 2) {
        throw throwValidation(
          403,
          "Fitur ini hanya bisa diakses oleh kepala gudang"
        );
      }

      next();
    } catch (error) {
      res.status(500).json(responses(false, error.message, error));
    }
  }

  static async AuthenticationRoleSuratJalan(req, res, next) {
    try {
      const { authorization } = req.headers;

      if (!authorization) {
        throw throwValidation(401, "Token not provided");
      }

      const [bearer, token] = authorization.split(" ");
      if (!token || !bearer.toLowerCase().includes("bearer")) {
        throw throwValidation(403, "Token invalid");
      }

      let data = jwt.verify(token, process.env.TOKEN_KEY);

      let user = await User.findOne({
        where: { email: data.email },
      });

      // Jika user adalah admin dan kepala gudang authorized
      if ([1, 2].includes(user.RoleId)) {
        next();
      } else {
        // User role bukan admin dan kepala gudang
        throw throwValidation(
          403,
          "Fitur ini hanya bisa diakses oleh admin dan kepala gudang"
        );
      }
    } catch (error) {
      res.status(500).json(responses(false, error.message, error));
    }
  }

  static async AuthenticationRoleSuratJalanReceive(req, res, next) {
    try {
      const user = req.UserData;
      
      // Jika user adalah admin dan kepala gudang authorized
      if ([3].includes(user.RoleId)) {
        next();
      } else {
        // User role bukan Admin Gudang
        throw throwValidation(
          403,
          "Fitur ini hanya bisa diakses oleh Admin Gudang"
        );
      }
    } catch (error) {
      res.status(500).json(responses(false, error.message, error));
    }
  }
}

module.exports = Auth;

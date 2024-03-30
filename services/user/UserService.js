const { Op } = require("sequelize");
const { User, Role } = require("../../models");
const { responses, throwValidation } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

class UserService {
  static async createUser(req, res) {
    try {
      const schema = yup.object().shape({
        name: yup.string().required("Nama User harus diisi"),
        email: yup
          .string()
          .email("Email tidak valid")
          .required("Email harus diisi"),
        description: yup.string().optional(),
        user_name: yup.string().required("Username harus diisi"),
        RoleId: yup.number().required("Otoritas harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, email, user_name, RoleId } = body;

      // validation input
      await UserService.validationRole(body);

      // validation check user email and username
      await UserService.checkUser({ email, user_name });

      const newUser = await User.create({
        name,
        description,
        email,
        user_name,
        password: process.env.DEFAULT_PASSWORD || "qwerty",
        RoleId,
      });

      res.status(201).json(
        responses(true, "User berhasil dibuat", {
          name: newUser.name,
          email: newUser.email,
          username: newUser.user_name,
        })
      );
    } catch (error) {
      return res
        .status(error?.code || 500)
        .json(responses(false, error?.message || error));
    }
  }
  static async updateUser(req, res) {
    try {
      const userId = req.params.userId;
      const schema = yup.object().shape({
        name: yup.string().required("Nama User harus diisi"),
        email: yup
          .string()
          .email("Email tidak valid")
          .required("Email harus diisi"),
        description: yup.string().optional(),
        user_name: yup.string().required("Username harus diisi"),
        RoleId: yup.number().required("Otoritas harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, email, user_name, RoleId } = body;

      // validation input
      await UserService.validationRole(body);

      const user = await User.findByPk(userId);

      if (!user) {
        throw throwValidation(400, "User Tidak ditemukan");
      }
      // find user that not with the userId
      const findExistUser = await User.findOne({
        where: { [Op.or]: [{ user_name }, { email }], id: { [Op.ne]: userId } },
      });

      if (findExistUser) {
        throw throwValidation(400, "Username atau Email sudah terdaftar");
      }

      await user.update({
        name,
        description,
        email,
        user_name,
        RoleId,
      });

      res.status(200).json(responses(true, "User berhasil diupdate"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteUser(req, res) {
    try {
      const userId = req.params.userId;
      const user = await User.findByPk(userId);

      if (!user) {
        throw throwValidation(404, "User tidak ditemukan");
      }

      if (user.RoleId === 1) {
        throw throwValidation(400, "User administrator tidak bisa dihapus");
      }

      await user.destroy({
        where: { id: user.id },
      });

      res.status(200).json(responses(true, "User berhasil dihapus"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async getAllUser(req, res) {
    try {
      const getAllUser = await User.findAll({
        attributes: [
          "id",
          "name",
          "description",
          "email",
          "user_name",
          "RoleId",
          "deletedAt",
        ],
        include: [{ model: Role, attributes: ["name", "description"] }],
        paranoid: false,
      });
      res.status(200).json(responses(true, "Berhasil", getAllUser));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async getUser(req, res) {
    try {
      const getUser = await User.findOne({
        where: { id: req.params.userId },
        attributes: ["name", "email", "user_name", "RoleId"],
      });

      if (!getUser) {
        throw throwValidation(400, "User tidak ditemukan");
      }

      res.status(200).json(responses(true, "Berhasil", getUser));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // validation check user email and username
  static async checkUser(payload) {
    const { user_name, email } = payload;

    const findUser = await User.findOne({
      where: { [Op.or]: [{ user_name }, { email }] },
    });

    if (findUser) {
      throw throwValidation(400, "Username atau Email sudah terdaftar");
    }

    return findUser;
  }

  // validation input
  static async validationRole(payload) {
    const { RoleId } = payload;
    const findRole = await Role.findByPk(RoleId);
    if (!findRole) {
      throw throwValidation(400, "Role tidak ditemukan");
    }
    return true;
  }
}

module.exports = UserService;

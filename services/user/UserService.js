const { Op } = require("sequelize");
const { User, Role, Audit_Trail, Warehouse } = require("../../models");
const { responses, throwValidation } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { compare } = require("../../helpers/bcrypt");
const jwt = require("jsonwebtoken");
const { auditTrailLog } = require("../../helpers/logger");
const decrypt = require("../../helpers/decrypt");
const { generateFilter } = require("../../helpers/queryGenerator");

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
        WarehouseId: yup.string().when("RoleId", (RoleId, schema) => {
          if (RoleId[0] == 3) {
            return schema.required(
              "Gudang harus diisi jika otoritas adalah admin gudang"
            );
          }
          return schema;
        }),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, email, user_name, RoleId, WarehouseId } = body;

      // validation input
      await UserService.validationRole(body);

      // validation check user email and username
      await UserService.checkUser({ email, user_name });

      // Validation if Role id admin gudang
      if (RoleId == 3 && WarehouseId) {
        const checkWarehouse = await Warehouse.findByPk(WarehouseId);
        if (!checkWarehouse)
          throw throwValidation(400, "Gudang Tidak ditemukan");
      }

      const newUser = await User.create({
        name,
        description,
        email,
        user_name,
        password: process.env.DEFAULT_PASSWORD || "qwerty",
        RoleId,
        WarehouseId: WarehouseId || null,
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
        WarehouseId: yup.string().nullable().when("RoleId", (RoleId, schema) => {
          if (RoleId[0] == 3) {
            return schema.required(
              "Gudang harus diisi jika otoritas adalah admin gudang"
            );
          }
          return schema;
        }),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, email, user_name, RoleId, WarehouseId } = body;

      // validation input
      await UserService.validationRole(body);

      const user = await User.findByPk(userId);

      // Validation if Role id admin gudang
      if (RoleId == 3 && WarehouseId) {
        const checkWarehouse = await Warehouse.findByPk(WarehouseId);
        if (!checkWarehouse)
          throw throwValidation(400, "Gudang Tidak ditemukan");
      }

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
        WarehouseId: RoleId  == 3 ? WarehouseId : null,
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
      const { RoleId, status } = req.query;

      let queryFilter = {};
      if (req.query != {}) {
        const filters = [
          { column: "RoleId", operator: "=", value: RoleId },
          { column: "deletedAt", operator: status, value: status },
        ];
        queryFilter = generateFilter(filters);
      }
      const getAllUser = await User.findAll({
        attributes: [
          "id",
          "name",
          "description",
          "email",
          "user_name",
          "RoleId",
          "deletedAt",
          "WarehouseId",
        ],
        include: [{ model: Role, attributes: ["name", "description"] }],
        paranoid: false,
        where: queryFilter,
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
        attributes: ["name", "email", "user_name", "RoleId", "WarehouseId"],
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

  // Login Service
  static async login(req, res) {
    try {
      const schema = yup.object().shape({
        auth: yup.string().required("Auth harus diisi"),
      });
      let request = await yupSchemaValidation(req.body, schema);
      let body = {};

      let decryptAuth = decrypt(request.auth);
      body = JSON.parse(decryptAuth);
      const user = await User.findOne({
        where: {
          email: body.email,
        },
        attributes: [
          "id",
          "name",
          "description",
          "email",
          "password",
          "user_name",
          "RoleId",
          "WarehouseId",
        ],
        include: [{ model: Role, attributes: ["name", "MenuId"] }],
      });

      if (!user) {
        throw throwValidation(400, "Email atau Password tidak valid");
      }

      const checkValidPassword = await compare(body.password, user.password);

      if (!checkValidPassword) {
        throw throwValidation(400, "Email atau Password tidak valid");
      }

      const token = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          user_name: user.user_name,
          RoleId: Number(user.RoleId),
          MenuId: user.Role.MenuId,
          WarehouseId: user.WarehouseId,
          Role: user.Role, // Di FE bagian menu ternyata looping menunya pake role
        },
        process.env.TOKEN_KEY,
        {
          expiresIn: "20h",
        }
      );

      const refreshToken = jwt.sign(
        {
          id: user.id,
          name: user.name,
          email: user.email,
          user_name: user.user_name,
          RoleId: Number(user.RoleId),
          MenuId: user.Role.MenuId,
          WarehouseId: user.WarehouseId,
          Role: user.Role, // Di FE bagian menu ternyata looping menunya pake role
        },
        process.env.REFRESH_TOKEN_KEY,
        { expiresIn: "7d" }
      );

      // await Audit_Trail.create(auditTrailLog("login", user.name, "success"));
      delete user.password;
      const userLogin = {
        id: user.id,
        Role: user.Role,
        name: user.name,
        email: user.email,
        user_name: user.user_name,
        MenuId: user.Role.MenuId,
        RoleId: Number(user.RoleId),
        WarehouseId: user.WarehouseId,
      };
      res.status(200).json(
        responses(true, "Berhasil", {
          type: "bearer",
          token: token,
          refreshToken: refreshToken,
          user_info: userLogin,
        })
      );
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Auth Me Token
  static async authMe(req, res) {
    try {
      const token = req.headers.authorization;
      jwt.verify(token, process.env.TOKEN_KEY, async (err, decoded) => {
        if (err) {
          if ("refreshToken" === "logout") {
            res.status(401).json(responses(false, "Invalid User"));
          } else {
            const oldToken = jwt.decode(token, { complete: true });
            const { id } = oldToken.payload;

            const user = await User.findOne({
              where: {
                id,
              },
              attributes: [
                "id",
                "name",
                "description",
                "email",
                "password",
                "user_name",
                "RoleId",
                "WarehouseId",
              ],
              include: [{ model: Role, attributes: ["name", "MenuId"] }],
            });

            const accessToken = jwt.sign({ id }, process.env.TOKEN_KEY, {
              expiresIn: "20h",
            });
            const refreshToken = jwt.sign(
              {
                id,
              },
              process.env.REFRESH_TOKEN_KEY,
              { expiresIn: "7d" }
            );

            const userLogin = {
              id: user.id,
              Role: user.Role,
              name: user.name,
              email: user.email,
              user_name: user.user_name,
              MenuId: user.Role.MenuId,
              RoleId: Number(user.RoleId),
              WarehouseId: user.WarehouseId,
            };

            res.status(200).json(
              responses(true, "Berhasil", {
                type: "bearer",
                token: accessToken,
                refreshToken: refreshToken,
                user_info: userLogin,
              })
            );
          }
        }
        res
          .status(200)
          .json(responses(true, "berhasil", { user_info: decoded })); // sementara biar sama kaya yang di login, kurang token dll..
      });
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = UserService;

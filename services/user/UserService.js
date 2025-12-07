const { Op } = require("sequelize");
const { Master_User, Master_Role, Audit_Trail, Master_Warehouse, Master_Action } = require("../../models");
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
        password: yup.string().required("Password harus diisi"),
        userName: yup.string().required("Username harus diisi"),
        roleId: yup.number().required("Otoritas harus diisi"),
        warehouseId: yup.string().when("roleId", (roleId, schema) => {
          if (roleId[0] == 3) {
            return schema.required(
              "Gudang harus diisi jika otoritas adalah admin gudang"
            );
          }
          return schema;
        }),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const {
        name,
        description,
        email,
        password,
        userName,
        roleId,
        warehouseId,
      } = body;

      // Sanitize email: trim and convert to lowercase
      const sanitizedEmail = email.trim().toLowerCase();

      let decryptPassword = decrypt(password);
      // validation input
      await UserService.validationRole(body);

      // validation check user email and username
      await UserService.checkUser({ email: sanitizedEmail, userName });

      // Validation if Role id admin gudang
      if (roleId == 3 && warehouseId) {
        const checkWarehouse = await Master_Warehouse.findByPk(warehouseId);
        if (!checkWarehouse)
          throw throwValidation(400, "Gudang Tidak ditemukan");
      }

      const newUser = await Master_User.create({
        name,
        description,
        email: sanitizedEmail,
        userName,
        password: decryptPassword,
        roleId,
        warehouseId: warehouseId || null,
      });

      res.status(201).json(
        responses(true, "User berhasil dibuat", {
          name: newUser.name,
          email: newUser.email,
          username: newUser.userName,
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
        userName: yup.string().required("Username harus diisi"),
        roleId: yup.number().required("Otoritas harus diisi"),
        warehouseId: yup
          .string()
          .nullable()
          .when("roleId", (roleId, schema) => {
            if (roleId[0] == 3) {
              return schema.required(
                "Gudang harus diisi jika otoritas adalah admin gudang"
              );
            }
            return schema;
          }),
        password: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const {
        name,
        description,
        email,
        userName,
        roleId,
        warehouseId,
        password,
      } = body;

      // Sanitize email: trim and convert to lowercase
      const sanitizedEmail = email.trim().toLowerCase();

      // validation input
      await UserService.validationRole(body);

      const user = await Master_User.findByPk(userId);

      // Validation if Role id admin gudang
      if (roleId == 3 && warehouseId) {
        const checkWarehouse = await Master_Warehouse.findByPk(warehouseId);
        if (!checkWarehouse)
          throw throwValidation(400, "Gudang Tidak ditemukan");
      }

      if (!user) {
        throw throwValidation(400, "User Tidak ditemukan");
      }
      // find user that not with the userId
      const findExistUser = await Master_User.findOne({
        where: { [Op.or]: [{ userName }, { email: sanitizedEmail }], id: { [Op.ne]: userId } },
      });

      if (findExistUser) {
        throw throwValidation(400, "Username atau Email sudah terdaftar");
      }

      if (password) {
        let decryptPassword = decrypt(password);
        await user.update({
          name,
          description,
          email: sanitizedEmail,
          password: decryptPassword,
          userName,
          roleId,
          warehouseId: roleId == 3 ? warehouseId : null,
        });
      } else {
        await user.update({
          name,
          description,
          email: sanitizedEmail,
          userName,
          roleId,
          warehouseId: roleId == 3 ? warehouseId : null,
        });
      }

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
      const user = await Master_User.findByPk(userId);

      if (!user) {
        throw throwValidation(404, "User tidak ditemukan");
      }

      if (user.roleId === 1) {
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
      const { roleId, status } = req.query;

      let queryFilter = {};
      if (req.query != {}) {
        const filters = [
          { column: "roleId", operator: "=", value: roleId, model: "Master_User" },
          { column: "deletedAt", operator: status, value: status, model: "Master_User" },
        ];
        queryFilter = generateFilter(filters);
      }
      const getAllUser = await Master_User.findAll({
        attributes: [
          "id",
          "name",
          "description",
          "email",
          "userName",
          "roleId",
          "deletedAt",
          "warehouseId",
        ],
        include: [{ model: Master_Role, attributes: ["name", "description"] }],
        paranoid: false,
        where: queryFilter.Master_User,
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
      const getUser = await Master_User.findOne({
        where: { id: req.params.userId },
        attributes: ["name", "email", "userName", "roleId", "warehouseId"],
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
    const { userName, email } = payload;

    const findUser = await Master_User.findOne({
      where: { [Op.or]: [{ userName }, { email }] },
    });

    if (findUser) {
      throw throwValidation(400, "Username atau Email sudah terdaftar");
    }

    return findUser;
  }

  // validation input
  static async validationRole(payload) {
    const { roleId } = payload;
    const findRole = await Master_Role.findByPk(roleId);
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

      // Safer decryption with error handling
      try {
        let decryptAuth = decrypt(request.auth);
        body = JSON.parse(decryptAuth);
      } catch (decryptError) {
        console.error("Decrypt error:", decryptError);
        throw throwValidation(400, "Invalid authentication data");
      }

      // Validate decrypted body
      if (!body.email || !body.password) {
        throw throwValidation(400, "Email dan password harus diisi");
      }

      // Sanitize email: trim and convert to lowercase
      const sanitizedEmail = body.email.trim().toLowerCase();

      const user = await Master_User.findOne({
        where: {
          email: sanitizedEmail,
        },
        attributes: [
          "id",
          "name",
          "description",
          "email",
          "password",
          "userName",
          "roleId",
          "warehouseId",
        ],
        include: [
          { model: Master_Role, attributes: ["name", "menuId"] },
          { model: Master_Warehouse, attributes: ["name"], required: false },
        ],
      });

      if (!user) {
        throw throwValidation(400, "Email atau Password tidak valid");
      }

      // Safer bcrypt compare with error handling
      let checkValidPassword = false;
      try {
        checkValidPassword = await compare(body.password, user.password);
      } catch (bcryptError) {
        console.error("Bcrypt compare error:", bcryptError);
        throw throwValidation(500, "Authentication service error");
      }

      if (!checkValidPassword) {
        throw throwValidation(400, "Email atau Password tidak valid");
      }
      // Get Master Action
      const masterActions = await Master_Action.findAll({
        where: {
          menuId: {
            [Op.in]: user.Master_Role.menuId, // array of menu IDs
          },
          roleId: user.roleId
        },
        attributes: ["id", "name",],
      });

      const listAction = masterActions.map((action) => action.name);

      // Safer JWT signing with error handling
      let token, refreshToken;
      try {
        const payload = {
          id: user.id,
          name: user.name,
          email: user.email,
          userName: user.userName,
          roleId: Number(user.roleId),
          menuId: user.Master_Role.menuId,
          warehouseId: user.warehouseId,
          warehouseName: user?.Master_Warehouse?.name,
          role: user.Master_Role, // Di FE bagian menu ternyata looping menunya pake role
          actions: listAction
        };

        token = jwt.sign(payload, process.env.TOKEN_KEY, { expiresIn: "20h" });
        refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_KEY, { expiresIn: "7d" });
      } catch (jwtError) {
        console.error("JWT signing error:", jwtError);
        throw throwValidation(500, "Token generation error");
      }

      // await Audit_Trail.create(auditTrailLog("login", user.name, "success"));
      delete user.password;
      const userLogin = {
        id: user.id,
        role: user.Master_Role,
        name: user.name,
        email: user.email,
        userName: user.userName,
        menuId: user.Master_Role.menuId,
        roleId: Number(user.roleId),
        warehouseId: user.warehouseId,
        warehouseName: user?.Master_Warehouse?.name,
        actions: listAction
      };
      res.status(200).json(
        responses(true, "Berhasil", {
          type: "bearer",
          token: token,
          refreshToken: refreshToken,
          userInfo: userLogin,
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
          res.status(500).json(responses(false, err.message));
        } else {
          const { id } = decoded;
          const user = await Master_User.findOne({
            where: {
              id,
            },
            attributes: [
              "id",
              "name",
              "description",
              "email",
              "password",
              "userName",
              "roleId",
              "warehouseId",
            ],
            include: [
              { model: Master_Role, attributes: ["name", "menuId"] },
              { model: Master_Warehouse, attributes: ["name"], required: false },
            ],
          });

          if (user) {
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
            // Get Master Action
            const masterActions = await Master_Action.findAll({
              where: {
                menuId: {
                  [Op.in]: user.Master_Role.menuId, // array of menu IDs
                },
                roleId: user.roleId
              },
              attributes: ["id", "name", "menuId"],
            });

            const listAction = masterActions.map((action) => action.name);

            const userLogin = {
              id: user.id,
              role: user.Master_Role,
              name: user.name,
              email: user.email,
              userName: user.userName,
              menuId: user.Master_Role.menuId,
              roleId: Number(user.roleId),
              warehouseId: user.warehouseId,
              warehouseName: user?.Master_Warehouse?.name,
              actions: listAction
            };
            res.status(200).json(
              responses(true, "Berhasil", {
                type: "bearer",
                token: accessToken,
                refreshToken: refreshToken,
                userInfo: userLogin,
              })
            );
          } else {
            res.status(404).json(responses(false, "Pengguna Tidak Ditemukan"));
          }
        }
      });
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = UserService;

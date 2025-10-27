const { Master_Role, Master_Menu, Master_User, Master_Action } = require("../../models");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses, throwValidation } = require("../../helpers/responses");
const { Op } = require("sequelize");

class RoleService {
  static async createRole(req, res) {
    try {
      const schema = yup.object().shape({
        name: yup.string().required("Nama Otoritas harus diisi"),
        description: yup.string().optional(),
        menuId: yup
          .array()
          .of(yup.number())
          .min(1, "Masukkan salah satu menu untuk membuat role"),
      });
      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, menuId } = body;

      // Find existing role
      const existingRole = await Master_Role.findOne({
        where: { name },
      });

      if (existingRole) {
        throw throwValidation(400, "Nama Role sudah ada");
      }

      // Check menu exist
      let menus = await Master_Menu.findAll({ attributes: ["id", "menuId"] });
      menus = menus.map((menu) => menu.menuId);
      menuId.forEach((id) => {
        if (!menus.includes(id)) {
          throw throwValidation(404, "Salah satu menu tidak ditemukan");
        }
      });

      const newRole = await Master_Role.create({
        name: name,
        description: description,
        menuId: menuId,
      });

      return res.status(201).json(responses(true, "Role berhasil dibuat", newRole));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async updateRole(req, res) {
    try {
      const roleId = req.params.roleId;

      const schema = yup.object().shape({
        name: yup.string().required("Nama Otoritas harus diisi"),
        description: yup.string().optional(),
        menuId: yup
          .array()
          .of(yup.number())
          .min(1, "Masukkan salah satu menu untuk membuat otoritas"),
        actions: yup.array().of(yup.object().shape({
          name: yup.string().required(),
          menuId: yup.number().required(),
        })).optional(),
      });
      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, menuId, actions } = body;

      const role = await Master_Role.findByPk(roleId);

      // Check menu exist
      let menus = await Master_Menu.findAll({ attributes: ["id", "menuId"] });
      menus = menus.map((menu) => menu.menuId);
      menuId.forEach((id) => {
        if (!menus.includes(id)) {
          throw throwValidation(404, "Salah satu menu tidak ditemukan");
        }
      });

      if (!role) {
        throw throwValidation(404, "Role tidak ditemukan");
      }

      const updatedMenu = await role.update({
        name: name,
        description: description,
        menuId: menuId,
      });

      // Update or Remove Master Actions
      // 🔹 Update or Remove Master Actions
      if (Array.isArray(actions)) {
        const existingActions = await Master_Action.findAll({
          where: { roleId },
          attributes: ["id", "name", "menuId"],
          raw: true,
        });

        // Extract comparison sets
        const existingKeys = existingActions.map(a => `${a.menuId}_${a.name}`);
        const newKeys = actions.map(a => `${a.menuId}_${a.name}`);

        // Find what to add
        const toAdd = actions.filter(a => !existingKeys.includes(`${a.menuId}_${a.name}`));

        // Find what to remove
        const toRemove = existingActions.filter(a => !newKeys.includes(`${a.menuId}_${a.name}`));

        // Perform DB changes efficiently
        if (toAdd.length) {
          await Master_Action.bulkCreate(
            toAdd.map(a => ({
              roleId,
              menuId: a.menuId,
              name: a.name,
            }))
          );
        }

        if (toRemove.length) {
          const idsToDelete = existingActions
            .filter(a => toRemove.some(r => r.menuId === a.menuId && r.name === a.name))
            .map(a => a.id);

          await Master_Action.destroy({ where: { id: idsToDelete } });
        }
      }

      return res
        .status(200)
        .json(responses(true, "Role berhasil diupdate", updatedMenu));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteRole(req, res) {
    try {
      const roleId = req.params.roleId;
      const role = await Master_Role.findByPk(roleId);

      if (!role) {
        throw throwValidation(404, "Role tidak ditemukan");
      }

      if (role.name === "Admin") {
        throw throwValidation(400, "Role ini tidak boleh dihapus");
      }

      const findUser = await Master_User.findOne({
        where: { roleId: roleId },
      });

      if (findUser) {
        throw throwValidation(
          400,
          "Tidak bisa menghapus role, role ini digunakan pada user"
        );
      }

      await role.destroy({
        where: { id: role.id },
      });

      return res.status(200).json(responses(true, "role berhasil dihapus"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllRole(req, res) {
    try {
      const getRoles = await Master_Role.findAll({
        attributes: ["id", "name", "description", "menuId", "createdAt"],
      });

      return res.status(200).json(responses(true, "berhasil", getRoles));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getRole(req, res) {
    try {
      const roleId = req.params.roleId;

      const role = await Master_Role.findByPk(roleId);

      if (!role) {
        throw throwValidation(404, "Role tidak ditemukan");
      }

      // Find Actions based on role's menuId
      const actions = await Master_Action.findAll({
        where: {
          menuId: {
            [Op.in]: role.menuId, // array of menu IDs
          },
          roleId: roleId
        },
        attributes: ["id", "name", "menuId"],
      })

      const roleData = {
        ...role.dataValues,
        actions
      }

      return res.status(200).json(responses(true, "berhasil", roleData));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = RoleService;

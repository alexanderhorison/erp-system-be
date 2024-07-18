const { Master_Role, Master_Menu, Master_User } = require("../../models");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses, throwValidation } = require("../../helpers/responses");

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
      });
      const body = await yupSchemaValidation(req.body, schema);

      const { name, description, menuId } = body;

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

      return res.status(200).json(responses(true, "berhasil", role));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = RoleService;

const { responses } = require("../../helpers/responses");
const { Role, Menu, User } = require("../../models");

class RoleController {
  static async createRole(req, res) {
    try {
      if (req.body.menuId.length == 0) {
        throw {
          code: 400,
          message: "Masukkan salah satu menu untuk membuat role",
        };
      }
      const { name, description, menuId } = req.body;

      // Find existing role
      const existingRole = await Role.findOne({
        where: { name },
      });

      if (existingRole) {
        throw {
          code: 400,
          message: "Nama Role sudah ada dalam database",
        };
      }

      const newRole = await Role.create({
        name: name,
        description: description,
        MenuId: menuId,
      });

      res.status(201).json(responses(true, "Role berhasil dibuat", newRole));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async updateRole(req, res) {
    try {
      const roleId = req.params.roleId;
      const { name, description, menuId } = req.body;

      const role = await Role.findByPk(roleId);

      // Check menu exist
      let menus = await Menu.findAll({ attributes: ["id"] });
      menus = menus.map((menu) => menu.id);
      menuId.forEach((id) => {
        if (!menus.includes(id)) {
          throw {
            code: 404,
            message: "Salah satu menu tidak ditemukan",
          };
        }
      });

      if (!role) {
        throw {
          code: 404,
          message: "Role tidak ditemukan",
        };
      }
      if (menuId.length == 0) {
        throw {
          code: 400,
          message: "Masukkan salah satu menu untuk update role",
        };
      }

      const updatedMenu = await role.update({
        name: name,
        description: description,
        MenuId: menuId,
      });

      res
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
      const role = await Role.findByPk(roleId);

      if (!role) {
        throw {
          code: 404,
          message: "Role tidak ditemukan",
        };
      }

      const findUser = await User.findOne({
        where: { RoleId: roleId },
      });

      if (findUser) {
        throw {
          code: 400,
          message: "Tidak bisa menghapus role, role ini digunakan pada user",
        };
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
      const getRoles = await Role.findAll({
        attributes: ["id", "name", "description", "MenuId"],
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

      const role = await Role.findByPk(roleId);

      if (!role) {
        throw {
          code: 404,
          message: "Role tidak ditemukan",
        };
      }

      return res.status(200).json(responses(true, "berhasil", role));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = RoleController;

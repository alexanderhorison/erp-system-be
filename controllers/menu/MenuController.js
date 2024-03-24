const { responses } = require("../../helpers/responses");
const { Menu } = require("../../models");

class MenuController {
  static async createMenu(req, res) {
    try {
      if (req.body.length === 0) {
        throw {
          code: 400,
          message: "Request body tidak valid",
        };
      }

      for (const item of req.body) {
        await Menu.create({
          name: item.name,
          description: item.description,
        });
      }
      res.status(201).json(responses(true, "Menu berhasil dibuat"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateMenu(req, res) {
    try {
      const menuId = req.params.menuId;
      const { name, description } = req.body;

      const menu = await Menu.findByPk(menuId);

      if (!menu) {
        throw {
          code: 404,
          message: "Menu tidak ditemukan",
        };
      }

      const updatedMenu = await menu.update({
        name: name,
        description: description,
      });

      return res
        .status(200)
        .json(responses(true, "Menu berhasil diupdate", updatedMenu));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteMenu(req, res) {
    try {
      const menuId = req.params.menuId;
      const menu = await Menu.findByPk(menuId);

      if (!menu) {
        throw {
          code: 404,
          message: "Menu tidak ditemukan",
        };
      }

      await menu.destroy({
        where: { id: menu.id },
      });

      return res.status(200).json(responses(true, "Menu berhasil dihapus"));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllMenu(req, res) {
    try {
      const getMenus = await Menu.findAll({
        attributes: ["id", "name", "description"],
      });

      return res.status(200).json(responses(true, "berhasil", getMenus));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getMenu(req, res) {
    try {
      const menuId = req.params.menuId;

      const menu = await Menu.findByPk(menuId);

      if (!menu) {
        throw {
          code: 404,
          message: "Menu tidak ditemukan",
        };
      }

      return res.status(200).json(responses(true, "berhasil", menu));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MenuController;

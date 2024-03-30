const { responses, throwValidation } = require("../../helpers/responses");
const { Menu } = require("../../models");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

class MenuService {
  static async createMenu(req, res) {
    try {
      const schema = yup
        .array()
        .of(
          yup.object().shape({
            name: yup.string().required("Nama Menu harus diisi"),
            description: yup.string().optional(),
          })
        )
        .min(1, "Data tidak valid");

      const body = await yupSchemaValidation(req.body, schema);

      for (const item of body) {
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

      const schema = yup.object().shape({
        name: yup.string().required("Nama Menu harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const { name, description } = body;

      const menu = await Menu.findByPk(menuId);

      if (!menu) {
        throw throwValidation(404, "Menu tidak ditemukan");
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
        throw throwValidation(404, "Menu tidak ditemukan");
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
        throw throwValidation(404, "Menu tidak ditemukan");
      }

      return res.status(200).json(responses(true, "berhasil", menu));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MenuService;

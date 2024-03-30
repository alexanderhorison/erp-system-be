const MenuService = require("../../services/menu/MenuService");

class MenuController {
  static async createMenu(req, res) {
    return MenuService.createMenu(req, res);
  }

  static async updateMenu(req, res) {
    return MenuService.updateMenu(req, res);
  }

  static async deleteMenu(req, res) {
    return MenuService.deleteMenu(req, res);
  }

  static async getAllMenu(req, res) {
    return MenuService.getAllMenu(req, res);
  }

  static async getMenu(req, res) {
    return MenuService.getMenu(req, res);
  }
}

module.exports = MenuController;

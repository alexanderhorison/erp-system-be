const RoleService = require("../../services/role/RoleService");

class RoleController {
  static async createRole(req, res) {
    return RoleService.createRole(req, res);
  }
  static async updateRole(req, res) {
    return RoleService.updateRole(req, res);
  }

  static async deleteRole(req, res) {
    return RoleService.deleteRole(req, res);
  }

  static async getAllRole(req, res) {
    return RoleService.getAllRole(req, res);
  }

  static async getRole(req, res) {
    return RoleService.getRole(req, res);
  }
}

module.exports = RoleController;

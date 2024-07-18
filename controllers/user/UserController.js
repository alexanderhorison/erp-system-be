const UserService = require("../../services/user/UserService");

class UserController {

  static async createUser(req, res) {
    return UserService.createUser(req, res);
  }

  static async updateUser(req, res) {
    return UserService.updateUser(req, res);
  }

  static async deleteUser(req, res) {
    return UserService.deleteUser(req, res);
  }

  static async getAllUser(req, res) {
    return UserService.getAllUser(req, res);
  }

  static async getUser(req, res) {
    return UserService.getUser(req, res);
  }

  static async login(req, res) {
    return UserService.login(req, res);
  }

  static async authMe(req, res) {
    return UserService.authMe(req, res);
  }

}

module.exports = UserController;

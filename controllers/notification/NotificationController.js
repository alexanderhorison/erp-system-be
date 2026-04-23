const { responses } = require("../../helpers/responses");
const NotificationService = require("../../services/notification/NotificationService");

class NotificationController {
  static async getPendingCount(req, res) {
    try {
      const user = req.userData;
      const data = await NotificationService.getPendingCounts({ user });
      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = NotificationController;

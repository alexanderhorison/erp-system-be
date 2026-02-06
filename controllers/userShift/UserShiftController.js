const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const UserShiftService = require("../../services/userShift/UserShiftService");
const { responses } = require("../../helpers/responses");

class UserShiftController {
  static async startShift(req, res) {
    try {
      const schema = yup.object({
        masterShiftId: yup.number().required("Master shift ID harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;

      const newUserShift = await UserShiftService.startShift(body, user);

      res
        .status(201)
        .json(responses(true, "Shift berhasil dimulai", newUserShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getCurrentShift(req, res) {
    try {
      const user = req.userData;

      const currentShift = await UserShiftService.getCurrentShift(user);

      res
        .status(200)
        .json(responses(true, "Success get current shift", currentShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async endShift(req, res) {
    try {
      const user = req.userData;

      const endedShift = await UserShiftService.endShift(user);

      res
        .status(200)
        .json(responses(true, "Shift berhasil diakhiri", endedShift));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getShiftHistory(req, res) {
    try {
      const schemaQuery = yup.object({
        page: yup.number().min(1).optional().default(1),
        limit: yup.number().min(1).max(100).optional().default(10),
      });

      const query = await yupSchemaValidation(req.query, schemaQuery);
      const user = req.userData;

      const shiftHistory = await UserShiftService.getShiftHistory(
        user,
        query.page,
        query.limit
      );

      res
        .status(200)
        .json(responses(true, "Success get shift history", shiftHistory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = UserShiftController;
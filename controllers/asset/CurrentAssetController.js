const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses } = require("../../helpers/responses");
class CurrentAssetController {
  static async getAll(req, res) {
    try {
      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan semua data Asset"));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));
    }
  }
}

module.exports = CurrentAssetController;

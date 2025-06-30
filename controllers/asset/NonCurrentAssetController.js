const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses } = require("../../helpers/responses");
const NonCurrentAssetService = require("../../services/asset/NonCurrentAssetService");
class NonCurrentAssetController {
  static async getAll(req, res) {
    try {
      const data = await NonCurrentAssetService.getAll();
      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan semua data Asset", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async generateNonCurrentAsset(req, res) {
    try {
      const schema = yup.object({
        date: yup.string().required("Waktu harus diisi"),
        notes: yup.string().nullable(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const data = await NonCurrentAssetService.generateNonCurrentAsset({
        date: body.date,
        notes: body.notes || "",
      });

      res
        .status(200)
        .json(responses(true, "Berhasil membuat Asset Non-Keuangan", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = NonCurrentAssetController;

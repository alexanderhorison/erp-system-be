const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const MasterNonCurrentAssetService = require("../../services/asset/MasterNonCurrentAssetService");
const { responses } = require("../../helpers/responses");
const {
  NON_CURENT_ASSETS_TYPE_LIST,
} = require("../../const/NonCurrentAssetType");

class MasterNonCurrentAssetController {
  static async getAll(req, res) {
    try {
      const data = await MasterNonCurrentAssetService.getAll();
      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil mendapatkan semua master data aset tidak lancar",
            data
          )
        );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // DONE
  static async create(req, res) {
    try {
      const schemaBody = yup.object({
        name: yup.string().required(),
        assetValue: yup.number().required(),
        assetType: yup.string().required().oneOf(NON_CURENT_ASSETS_TYPE_LIST),
        acquisitionDate: yup.date().required(),
        depreciationMonths: yup.number().optional().nullable(),
        notes: yup.string().optional().nullable(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      const data = await MasterNonCurrentAssetService.create(body);

      res.status(201).json(
        responses(
          true,
          "Berhasil membuat master data aset tidak lancar",
          data
        )
      );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getById(req, res) {
    try {
      const schemaParams = yup.number().required("ID tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterNonCurrentAssetService.getById(id);

      res.status(200).json(responses(true, "Success get detail Asset", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async update(req, res) {
    try {
      const schemaParams = yup.number().required("ID tidak boleh kosong");
      const schemaBody = yup.object({
        name: yup.string().required(),
        assetValue: yup.number().required(),
        assetType: yup.string().required(),
        acquisitionDate: yup.date().required(),
        depreciationMonths: yup.number().optional().nullable(),
        notes: yup.string().optional().nullable(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      await MasterNonCurrentAssetService.update(id, body);

      res.status(200).json({ message: `Aset berhasil di update` });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MasterNonCurrentAssetController;

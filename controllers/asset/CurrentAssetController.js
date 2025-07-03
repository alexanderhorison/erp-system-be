const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const { responses } = require("../../helpers/responses");
const CurrentAssetService = require("../../services/asset/CurrentAssetService");

class CurrentAssetController {
  static async getAll(req, res) {
    try {
      const data = await CurrentAssetService.findAllAsset(req);
      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan semua data Asset", data));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));
    }
  }

  static async createAsset(req, res) {
    try {
      const schema = yup.object().shape({
        period: yup.string().required("Tanggal harus diisi"),
        cashAndBank: yup.number().required("Kas dan Bank harus diisi"),
        accountsReceivable: yup.number().required("Piutang Usaha harus diisi"),
        thirdPartyReceivable: yup.number().required("Pihak Ketiga harus diisi"),
        otherReceivables: yup.number().required("Piutang Lain harus diisi"),
        inventory: yup.number().required("Persediaan harus diisi"),
        advancePayments: yup.number().required("Uang Muka harus diisi"),
        tax: yup.number().required("Pajak harus diisi"),
        grandTotal: yup.number().required("Grand Total harus diisi"),
        notes: yup.string().optional(), // Optional notes field
      });
      const body = await yupSchemaValidation(req.body, schema);

      const data = await CurrentAssetService.createAsset(body);

      res
        .status(201)
        .json(responses(true, "Berhasil membuat data Asset", data));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));
    }
  }

  static async updateAsset(req, res) {
    try {
      const schemaParams = yup.number().required("Id Asset tidak boleh kosong");
      const schema = yup.object({
        period: yup.string().required("Periode harus diisi"),
        cashAndBank: yup.number().required("Kas dan Bank harus diisi"),
        accountsReceivable: yup.number().required("Piutang Usaha harus diisi"),
        thirdPartyReceivable: yup.number().required("Pihak Ketiga harus diisi"),
        otherReceivables: yup.number().required("Piutang Lain harus diisi"),
        inventory: yup.number().required("Persediaan harus diisi"),
        advancePayments: yup.number().required("Uang Muka harus diisi"),
        tax: yup.number().required("Pajak harus diisi"),
        grandTotal: yup.number().required("Grand Total harus diisi"),
        notes: yup.string().optional(), // Optional notes field
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const data = await CurrentAssetService.updateAsset(id, body);

      res.status(200).json(responses(true, "Asset berhasil diubah", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailAsset(req, res) {
    try {
      const schemaParams = yup.number().required("Id Asset harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await CurrentAssetService.getDetailAsset(id);

      res.status(200).json(responses(true, "Success get detail Asset", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getPiutangSo(req, res) {
    try {
      const data = await CurrentAssetService.getPiutangSo(req.query.period);

      res.status(200).json(responses(true, "Success get piutang so", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCurrentAsset(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.string().required("ID harus diisi"),
      });
      const params = await yupSchemaValidation(req.params, schemaParams);

      await CurrentAssetService.deleteCurrentAsset(
        params.id
      );

      res
        .status(200)
        .json(responses(true, "Berhasil menghapus Asset Lancar"));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = CurrentAssetController;

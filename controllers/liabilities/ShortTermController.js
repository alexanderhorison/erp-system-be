const yup = require("yup");
const ShortTermLiabilityService = require("../../services/liabilities/ShortTermService");
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const label = "Liabilitas Jangka Pendek";

class ShortTermController {
  static async createShortTermLiability(req, res) {
    try {
      const schema = yup.object().shape({
        date: yup.string().required("Tanggal harus diisi"),
        tradePayables: yup.number().required("Hutang Usaha harus diisi"),
        nonTradePayables: yup.number().required("Hutang Bukan Usaha harus diisi"),
        accruedExpenses: yup.number().required("Biaya Masih Harus Dibayar harus diisi"),
        taxPayables: yup.number().required(`Hutang Pajak harus diisi`),
        totalShortTermLiabilities: yup.number().required(`Jumlah ${label} harus diisi`),
        notes: yup.string().optional(), // Optional notes field
      });
      const body = await yupSchemaValidation(req.body, schema);

      const result = await ShortTermLiabilityService.create(body);
      res.status(201).json(responses(true, `Berhasil membuat data ${label}`, result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));

    }
  }

  static async getAllShortTermLiabilities(req, res) {
    try {
      const result = await ShortTermLiabilityService.getAll(req);
      res.status(200).json(responses(true, `Berhasil mendapatkan semua data ${label}`, result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));

    }
  }

  static async updateShortterm(req, res) {
    try {
      const schemaParams = yup.number().required(`Id ${label} tidak boleh kosong`);
      const schema = yup.object().shape({
        date: yup.string().required("Tanggal harus diisi"),
        tradePayables: yup.number().required("Hutang Usaha harus diisi"),
        nonTradePayables: yup.number().required("Hutang Bukan Usaha harus diisi"),
        accruedExpenses: yup.number().required("Biaya Masih Harus Dibayar harus diisi"),
        taxPayables: yup.number().required(`Hutang Pajak harus diisi`),
        totalShortTermLiabilities: yup.number().required(`Jumlah ${label} harus diisi`),
        notes: yup.string().optional(), // Optional notes field
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const data = await ShortTermLiabilityService.updateShortTerm(id, body);

      res.status(200).json(responses(true, `${label} berhasil diubah`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteShortTerm(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.string().required(`ID ${label} harus diisi`),
      });
      const params = await yupSchemaValidation(req.params, schemaParams);

      await ShortTermLiabilityService.deleteShortTerm(
        params.id
      );

      res
        .status(200)
        .json(responses(true, `Berhasil menghapus ${label}`));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailShortTerm(req, res) {
    try {
      const schemaParams = yup.number().required(`Id ${label} harus diisi`);
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ShortTermLiabilityService.getDetail(id);

      res.status(200).json(responses(true, `Success get detail ${label}`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

    static async getPiutangPo(req, res) {
    try {
      const data = await ShortTermLiabilityService.getPiutangPo(req.query.date);

      res.status(200).json(responses(true, "Success get piutang po", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ShortTermController;
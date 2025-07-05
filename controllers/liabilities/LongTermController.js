const yup = require("yup");
const LongTermLiabilityService = require("../../services/liabilities/LongTermService");
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const label = "Liabilitas Jangka Panjang";

class LongTermController {
  static async createLongTermLiability(req, res) {
    try {
      const schema = yup.object().shape({
        date: yup.string().required("Tanggal harus diisi"),
        shareHolderLoans: yup.number().required("Pinjaman Kepada Pemegang Saham harus diisi"),
        longTermBankLoans: yup.number().required("Hutang Bank Jangka Panjang harus diisi"),
        otherLongtermLiabilities: yup.number().required("Kewajiban Jangka Panjang harus diisi"),
        totalLongtermLiabilities: yup.number().required(`Jumlah ${label} harus diisi`),
        notes: yup.string().optional(), // Optional notes field
      });
      const body = await yupSchemaValidation(req.body, schema);

      const result = await LongTermLiabilityService.create(body);

      res.status(201).json(responses(true, `Berhasil membuat data ${label}`, result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));
    }
  }

  static async getAllLongTermLiabilities(req, res) {
    try {
      const result = await LongTermLiabilityService.getAll(req);

      res.status(200).json(responses(true, `Berhasil mendapatkan semua data ${label}`, result));
    } catch (err) {
      res.status(err.code || 500).json(responses(false, err.message || err));
    }
  }

  static async getDetailLongTerm(req, res) {
    try {
      const schemaParams = yup.number().required(`Id ${label} harus diisi`);
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await LongTermLiabilityService.getDetail(id);

      res.status(200).json(responses(true, `Success get detail ${label}`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateLongterm(req, res) {
    try {
      const schemaParams = yup.number().required(`Id ${label} tidak boleh kosong`);
      const schema = yup.object({
        date: yup.string().required("Tanggal harus diisi"),
        shareHolderLoans: yup.number().required("Pinjaman Kepada Pemegang Saham harus diisi"),
        longTermBankLoans: yup.number().required("Hutang Bank Jangka Panjang harus diisi"),
        otherLongtermLiabilities: yup.number().required("Kewajiban Jangka Panjang harus diisi"),
        totalLongtermLiabilities: yup.number().required(`Jumlah ${label} harus diisi`),
        notes: yup.string().optional(), // Optional notes field
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const data = await LongTermLiabilityService.updateLongTerm(id, body);

      res.status(200).json(responses(true, `${label} berhasil diubah`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteLongTerm(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.string().required(`ID ${label} harus diisi`),
      });
      const params = await yupSchemaValidation(req.params, schemaParams);

      await LongTermLiabilityService.deleteLongTerm(
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

    static async getPiutangPo(req, res) {
    try {
      const data = await LongTermLiabilityService.getPiutangPo(req.query.date);

      res.status(200).json(responses(true, "Success get piutang po", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = LongTermController;
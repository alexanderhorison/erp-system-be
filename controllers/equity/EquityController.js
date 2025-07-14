const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const EquityService = require("../../services/equity/EquityService");
const { responses } = require("../../helpers/responses");

class EquityController {
  static async createEquity(req, res) {
    try {
      const schemaBody = yup.object({
        date: yup.string().required("Tanggal harus diisi"),
        shareCapital: yup.number().required("Modal Saham harus diisi"),
        notes: yup.string().optional().nullable(), // Optional notes field
      });
      const body = await yupSchemaValidation(req.body, schemaBody);

      const result = await EquityService.createEquity(body);

      res.status(201).json(responses(true, "Success create equity", result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllEquities(req, res) {
    try {
      const result = await EquityService.getAll(req);
      res.status(200).json(responses(true, "Success get all equities", result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailEquity(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.number().required("ID harus diisi"),
      });
      const { id } = await yupSchemaValidation(req.params, schemaParams);

      const result = await EquityService.getDetail(id);

      res
        .status(200)
        .json(responses(true, `Success get detail equity`, result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateEquity(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.number().required("ID harus diisi"),
      });
      const schemaBody = yup.object({
        date: yup.string().required("Tanggal harus diisi"),
        shareCapital: yup.number().required("Modal Saham harus diisi"),
        notes: yup.string().optional().nullable(), // Optional notes field
      });
      const { id } = await yupSchemaValidation(req.params, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);
      const result = await EquityService.updateEquity(id, body);

      res.status(200).json(responses(true, `Success update equity`, result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteEquity(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.number().required("ID harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schemaParams);

      const result = await EquityService.deleteEquity(params.id);

      res.status(200).json(responses(true, `Success delete equity`, result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = EquityController;

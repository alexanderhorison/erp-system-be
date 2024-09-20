const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataRankService = require("../../services/masterData/MasterDataRankService");

class MasterDataRankController {
  static async createRank(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama rank harus diisi"),
        description: yup.string().optional(),
        level: yup.number().required("Level rank harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newRank = await MasterDataRankService.create(body);

      res.status(201).json(responses(true, "Rank berhasil dibuat", newRank));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateRank(req, res) {
    try {
      const schemaParams = yup.number().required("Id rank kosong");
      const schemaBody = yup.object({
        name: yup.string().required("Nama rank harus diisi"),
        description: yup.string().optional(),
        level: yup.number().required("Level rank harus diisi"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const updatedRank = await MasterDataRankService.update(id, body);
      res
        .status(200)
        .json(responses(true, "Rank berhasil diupdate", updatedRank));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteRank(req, res) {
    try {
      const schemaParams = yup.number().required("Id rank harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const deletedRank = await MasterDataRankService.delete(id);

      res
        .status(200)
        .json(responses(true, "Rank berhasil dihapus", deletedRank));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllRank(req, res) {
    try {
      const data = await MasterDataRankService.findAll();

      res
        .status(200)
        .json(responses(true, "Success get all master data rank", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailRank(req, res) {
    try {
      const schemaParams = yup.number().required("Id satuan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataRankService.findOne(id);

      res.status(200).json(responses(true, "Success get detail rank", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataRankController;

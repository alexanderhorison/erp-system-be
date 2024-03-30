const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const MasterDataUnitService = require("../../services/masterData/MasterDataUnitService");
const yup = require("yup");

class MasterDataUnitController {
  static async createUnit(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama satuan harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = { id: 1 };

      const newUnit = await MasterDataUnitService.create(body, user);

      res.status(201).json(responses(true, "Satuan berhasil dibuat", newUnit));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateUnit(req, res) {
    try {
      const schemaParams = yup.number().required("Id unit kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id unit harus diisi"),
        name: yup.string().required("Nama unit harus diisi"),
        description: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = {
        id: 1,
      };

      const updatedUnit = await MasterDataUnitService.update(id, body, user);
      res
        .status(200)
        .json(responses(true, "Unit berhasil diupdate", updatedUnit));
    } catch (error) {
      console.log(error);
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteUnit(req, res) {
    try {
      const schemaParams = yup.number().required("Id satuan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = { id: 1 };

      const deletedUnit = await MasterDataUnitService.delete(id, user);

      res
        .status(200)
        .json(responses(true, "Satuan berhasil dihapus", deletedUnit));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllUnit(req, res) {
    try {
      const data = await MasterDataUnitService.findAll();

      res
        .status(200)
        .json(responses(true, "Success get all master data unit", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailUnit(req, res) {
    try {
      const schemaParams = yup.number().required("Id satuan harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataUnitService.findOne(id);

      res.status(200).json(responses(true, "Success get detail unit ", data));
    } catch (error) {
      console.log(error);
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataUnitController;

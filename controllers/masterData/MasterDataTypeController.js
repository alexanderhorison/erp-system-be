const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataTypeService = require("../../services/masterData/MasterDataTypeService");
const { responses } = require("../../helpers/responses");

class MasterDataTypeController {
  static async createType(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama satuan harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const newType = await MasterDataTypeService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Tipe berhasil ditambahkan", newType));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateType(req, res) {
    try {
      const schemaParams = yup.number().required("Id tipe kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id tipe harus diisi"),
        name: yup.string().required("Nama tipe harus diisi"),
        description: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedType = await MasterDataTypeService.update(id, body, user);
      res
        .status(200)
        .json(responses(true, "Tipe berhasil diupdate", updatedType));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteType(req, res) {
    try {
      const schemaParams = yup.number().required("Id tipe harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      const deletedType = await MasterDataTypeService.delete(id, user);

      res.status(200).json(responses(true, "Tipe sukses dihapus", deletedType));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllType(req, res) {
    try {
      const type = await MasterDataTypeService.findAll();
      res.status(200).json(responses(true, "Success get all type", type));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailType(req, res) {
    try {
      const schemaParams = yup.number().required("Id tipe harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataTypeService.findOne(id);

      res.status(200).json(responses(true, "Success get detail type", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataTypeController;

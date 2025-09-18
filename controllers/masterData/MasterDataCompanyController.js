const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataCompanyService = require("../../services/masterData/MasterDataCompanyService");

class MasterDataCompanyController {
  static async createCompany(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama Company harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const newCompany = await MasterDataCompanyService.create(body);

      res
        .status(201)
        .json(responses(true, "Company berhasil ditambahkan", newCompany));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateCompany(req, res) {
    try {
      const schemaParams = yup.number().required("Id company kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id company harus diisi"),
        name: yup.string().required("Nama company harus diisi"),
        description: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const updateCompany = await MasterDataCompanyService.update(id, body);

      res
        .status(200)
        .json(responses(true, "Company berhasil diupdate", updateCompany));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCompany(req, res) {
    try {
      const schemaParams = yup.number().required("Id company harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const deletedCompany = await MasterDataCompanyService.delete(id);

      res
        .status(200)
        .json(responses(true, "Company sukses dihapus", deletedCompany));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCompany(req, res) {
    try {
      const company = await MasterDataCompanyService.findAll(req.query);
      res.status(200).json(responses(true, "Success get all company", company));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailCompany(req, res) {
    try {
      const schemaParams = yup.number().required("Id company harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataCompanyService.findOne(id);

      res.status(200).json(responses(true, "Success get detail company", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataCompanyController;

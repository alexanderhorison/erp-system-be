const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataCategoryService = require("../../services/masterData/MasterDataCategoryService");
const { responses } = require("../../helpers/responses");

class MasterDataCategoryController {
  static async createCategory(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama kategori harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const newCategory = await MasterDataCategoryService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Kategori berhasil ditambahkan", newCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori kosong");
      const schemaBody = yup.object({
        id: yup.number().required("Id kategori harus diisi"),
        name: yup.string().required("Nama kategori harus diisi"),
        description: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedCategory = await MasterDataCategoryService.update(
        id,
        body,
        user
      );
      res
        .status(200)
        .json(responses(true, "Kategori berhasil diubah", updatedCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      const deletedCategory = await MasterDataCategoryService.delete(id, user);

      res
        .status(200)
        .json(responses(true, "Kategori berhasil dihapus", deletedCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCategory(req, res) {
    try {
      const category = await MasterDataCategoryService.findAll();
      res
        .status(200)
        .json(responses(true, "Success get all category", category));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataCategoryService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Success get detail category", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataCategoryController;

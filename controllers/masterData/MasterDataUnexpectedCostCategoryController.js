const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const MasterDataUnexpectedCostCategoryService = require("../../services/masterData/MasterDataUnexpectedCostCategoryService");
const { responses } = require("../../helpers/responses");

class MasterDataUnexpectedCostCategoryController {
  static async createCategory(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama kategori biaya tidak terduga harus diisi"),
        description: yup.string().optional(),
        is_active: yup.boolean().default(true).optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;
      const newCategory = await MasterDataUnexpectedCostCategoryService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Kategori biaya tidak terduga berhasil ditambahkan", newCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori biaya tidak terduga kosong");
      const schemaBody = yup.object({
        name: yup.string().required("Nama kategori biaya tidak terduga harus diisi"),
        description: yup.string().optional(),
        is_active: yup.boolean().required("Status aktif harus diisi"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const updatedCategory = await MasterDataUnexpectedCostCategoryService.update(
        id,
        body,
        user
      );
      res
        .status(200)
        .json(responses(true, "Kategori biaya tidak terduga berhasil diubah", updatedCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori biaya tidak terduga harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      const deletedCategory = await MasterDataUnexpectedCostCategoryService.delete(id, user);

      res
        .status(200)
        .json(responses(true, "Kategori biaya tidak terduga berhasil dihapus", deletedCategory));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllCategories(req, res) {
    try {
      const schemaQuery = yup.object({
        active: yup.boolean().optional(),
      });
      const query = await yupSchemaValidation(req.query, schemaQuery);
      const categories = await MasterDataUnexpectedCostCategoryService.findAll(query);
      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan semua data kategori biaya tidak terduga", categories));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailCategory(req, res) {
    try {
      const schemaParams = yup.number().required("Id kategori biaya tidak terduga harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataUnexpectedCostCategoryService.findOne(id);

      res
        .status(200)
        .json(responses(true, "Berhasil mendapatkan detail kategori biaya tidak terduga", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataUnexpectedCostCategoryController;
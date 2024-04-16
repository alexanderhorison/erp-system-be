const MasterDataProductService = require("../../services/masterData/MasterDataProductService");
const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

class MasterDataProductController {
  static async createProduct(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama produk harus diisi"),
        CategoryId: yup.number().required("Kategori harus diisi"),
        TypeId: yup.number().required("Tipe harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = { id: 1 };

      const data = await MasterDataProductService.create(body, user);

      res
        .status(201)
        .json(responses(true, "Produk berhasil ditambahkan", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json({ success: false, message: error.message });
    }
  }

  static async updateProduct(req, res) {
    try {
      const schemaParams = yup.number().required("Id tipe kosong");
      const schema = yup.object({
        name: yup.string().required("Nama produk harus diisi"),
        CategoryId: yup.number().required("Kategori harus diisi"),
        TypeId: yup.number().required("Tipe harus diisi"),
        description: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const user = { id: 1 };

      const data = await MasterDataProductService.update(id, body, user);

      res.status(200).json(responses(true, "Produk berhasil diubah", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteProduct(req, res) {
    try {
      const schemaParams = yup.number().required("Id tipe harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = { id: 1 };

      const data = await MasterDataProductService.delete(id, user);

      res.status(200).json(responses(true, "Produk berhasil dihapus", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllProduct(req, res) {
    try {
      const data = await MasterDataProductService.findAll();
      res
        .status(200)
        .json(responses(true, "Success get all master produce", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailProduct(req, res) {
    try {
      const schemaParams = yup.number().required("Id produk harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataProductService.findOne(id);

      return res
        .status(200)
        .json(responses(true, "Success get detail master product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataProductController;

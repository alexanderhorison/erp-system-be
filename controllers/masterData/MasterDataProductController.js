const MasterDataProductService = require("../../services/masterData/MasterDataProductService");
const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

class MasterDataProductController {
  static async createProduct(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama produk harus diisi"),
        categoryId: yup.number().required("Kategori harus diisi"),
        typeId: yup.number().required("Tipe harus diisi"),
        description: yup.string().optional(),
        companyId: yup.number().required("Company harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

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
        categoryId: yup.number().required("Kategori harus diisi"),
        typeId: yup.number().required("Tipe harus diisi"),
        description: yup.string().optional(),
        companyId: yup.number().required("Company harus diisi"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

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

      const user = req.userData;

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
      const data = await MasterDataProductService.findAll(req);
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

      res
        .status(200)
        .json(responses(true, "Success get detail master product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createProductTransformation(req, res) {
    try {
      const schema = yup.object({
        masterProductId: yup.number().required("Master Produk harus ada"),
        unitFromId: yup.number().required("Asal satuan produk harus ada"),
        amountFrom: yup.number().required("Jumlah asal konversi produk harus ada"),
        unitToId: yup.number().required("Tujuan satuan produk harus ada"),
        amountTo: yup.number().required("Jumlah tujuan konversi produk harus ada"),
        info1: yup.string().optional(),
        info2: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      await MasterDataProductService.createProductTransformasi(body, user.id);

      res
        .status(200)
        .json(responses(true, `Berhasil membuat rumus transformasi`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Get All rumus transformasi
  static async getAllProductTransformation(req, res) {
    try {
      const schemaParams = yup.number().required("Id produk harus diisi");
      const productId = await yupSchemaValidation(
        req.params.productId,
        schemaParams
      );

      const getAllTransformation =
        await MasterDataProductService.getAllProductTransformasi(productId);

      res.status(200).json(responses(true, `Berhasil`, getAllTransformation));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateProductTransformation(req, res) {
    try {
      const schemaParams = yup.number().required("Id transformasi kosong");
      const schema = yup.object({
        masterProductId: yup.number().required("Master Produk harus ada"),
        unitFromId: yup.number().required("Asal satuan produk harus ada"),
        amountFrom: yup
          .number()
          .required("Jumlah asal konversi produk harus ada"),
        unitToId: yup.number().required("Tujuan satuan produk harus ada"),
        amountTo: yup
          .number()
          .required("Jumlah tujuan konversi produk harus ada"),
        code: yup
          .string()
          .required("code harus ada"),
        info1: yup.string().optional(),
        info2: yup.string().optional(),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      await MasterDataProductService.updateProductTransformasi(id, body);

      res
        .status(200)
        .json(responses(true, `Berhasil memperbarui rumus transformasi`));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteProductTransformation(req, res) {
    try {
      const schemaParams = yup.number().required("Id transformasi kosong");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      await MasterDataProductService.deleteProductTransformasi(id)

      res
        .status(200)
        .json(
          responses(
            true,
            `Berhasil menghapus rumus transformasi`,
          )
        );
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailProductTransformation(req, res) {
    try {
      const schemaParams = yup.number().required("Id produk harus diisi");
      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await MasterDataProductService.getDetailTransformasi(id);

      return res
        .status(200)
        .json(responses(true, "Success get detail produk transformasi", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataProductController;

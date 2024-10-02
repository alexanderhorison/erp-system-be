const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataProductPriceService = require("../../services/masterData/MasterDataProductPriceService");

class MasterDataProductPriceController {
  static async createOrUpdate(req, res) {
    try {
      const schema = yup.object({
        name: yup.string().required("Nama satuan harus diisi"),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const newType = await MasterDataProductPriceService.createOrUpdate(
        body,
        user
      );

      res
        .status(201)
        .json(responses(true, "Tipe berhasil ditambahkan", newType));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAll(req, res) {
    try {
      const schema = yup.object({
        productId: yup.string().required("Product Id harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const productPrice = await MasterDataProductPriceService.findAll({
        productId: body.productId,
      });
      res
        .status(200)
        .json(responses(true, "Success get Product Price", productPrice));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataProductPriceController;

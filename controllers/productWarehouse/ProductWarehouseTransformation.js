const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");

const ProductWarehouseTransformationService = require("../../services/productWarehouse/ProductWarehouseTransformationService");

class ProductWarehouseTransformation {
  static async getList(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseTransformationService.getAllListTransformationByProductWarehouseId(id)

      res.status(200).json(responses(true, "Success get rumus transformasi produk", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async transformProduct(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const schemaBody = yup.object({
        masterTransformationId: yup.number().required("Id Transformasi harus di isi"),
        productWarehouseId: yup.number().required("Id produk harus di isi"),
        qtyTransformation: yup.number().required("Jumlah harus di isi"),
      })

      const body = await yupSchemaValidation(req.body, schemaBody);

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const user = req.userData;

      ProductWarehouseTransformationService.transformProduct({ id: id, data: body, user })

      res
        .status(200)
        .json(
          responses(true, "Produk berhasil ditransformasi", [])
        );

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ProductWarehouseTransformation
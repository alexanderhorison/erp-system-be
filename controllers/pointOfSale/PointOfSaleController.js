const PointOfSaleService = require("../../services/pointOfSale/PointOfSaleService");
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");

class PointOfSaleController {
  static async addOrRemoveFavorite(req, res) {
    try {
      const schema = yup.object({
        productId: yup.number().required("ProductId harus ada"),
        warehouseId: yup.number().required("WarehouseId harus ada"),
        isFavorite: yup.boolean().required("Is Favorit harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      await PointOfSaleService.addOrRemoveFavorite(body);

      const message = body.isFavorite ? "Ditambahkan" : "Dihilangkan";

      res
        .status(200)
        .json(responses(true, `Produk Berhasil ${message} ke favorite`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async getProductByWarehouseId(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup
          .number()
          .required("Id gudang tidak boleh kosong")
          .typeError("Id gudang harus berupa angka"), // Additional type validation
      });

      const query = await yupSchemaValidation(req.query, schemaParams);

      const data = await PointOfSaleService.getPointOfSaleProductByWarehouse({
        warehouseId: query.id,
      });

      res.status(200).json(responses(true, `Success get product`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = PointOfSaleController;

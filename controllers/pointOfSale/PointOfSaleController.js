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
  static async getAllProductByProductId(req, res) {
    try {
      const schemaParams = yup.object({
        warehouseId: yup.number().required("Id gudang tidak boleh kosong"),
        productId: yup.number().required("Id produk tidak boleh kosong"),
      });

      const query = await yupSchemaValidation(req.query, schemaParams);

      const data = await PointOfSaleService.getAllProductByProductId(query);

      res.status(200).json(responses(true, `Success get product detail`, data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createPointOfSale(req, res) {
    try {
      const schema = yup.object({
        customerId: yup.number().required("Customer harus diisi"),
        subTotal: yup.number().required("Sub Total harus ada"),
        totalDiscount: yup.number().required("Total Discount harus ada"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        totalPayment: yup.number().required("Total Payment harus ada"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              warehouseProductId: yup
                .number()
                .nullable() // Allows null
                .transform((value, originalValue) =>
                  originalValue === "" ? null : value
                ) // Treats empty string as null
                .required("Id product warehouse harus diisi"),
              price: yup.number().required("Price product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
              notes: yup.string().optional(),
              title: yup.string().when("warehouseProductId", {
                is: (value) => !value, // Checks if warehouseProductId is null or undefined
                then: yup
                  .string()
                  .required("Title harus diisi jika warehouseProductId kosong"),
                otherwise: yup.string().optional(),
              }),
            })
          )
          .required("List point of sale produk harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      await PointOfSaleService.createPointOfSale({
        data: body,
        user,
      });

      res.status(200).json(responses(true, `Berhasil Membuat Sale`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = PointOfSaleController;

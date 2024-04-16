const MasterDataWarehouseService = require("../../services/masterData/MasterDataWarehouseService");
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

const yup = require("yup");
const ProductWarehouseService = require("../../services/productWarehouse/ProductWarehouseService");

class ProductWarehouseController {
  // Get All List Warehouse
  static async getAllWarehouse(req, res) {
    try {
      const data = await MasterDataWarehouseService.findAll();

      res
        .status(201)
        .json(responses(true, "Success get data all warehouse", data));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Get all product based on warehouseId
  static async getProductByWarehouse(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id gudang tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseService.findProductByWarehouseId({
        id,
      });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Insert product into warehouse (initiate product)
  static async create(req, res) {
    try {
      const object = yup.object({
        MasterProductId: yup.number().required("Id produk tidak boleh kosong"),
        quantity: yup.number().required("Kuantiti tidak boleh kosong"),
        UnitId: yup.number().required("Unit id tidak boleh kosong"),
        minimum_stock: yup.number().required("Stok minimum tidak boleh kosong"),
      });
      const schema = yup.array().of(object);
      const body = await yupSchemaValidation(req.body, schema);
      const user = req.UserData;

      const newProductWarehouse = await ProductWarehouseService.create(
        body,
        user
      );

      res
        .status(201)
        .json(
          responses(true, "Produk berhasil ditambahkan", newProductWarehouse)
        );
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Adjust Product (PLUS or MINUS or MINIMUM_STOCK) stock product
  static async adjustProduct(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk gudang tidak boleh kosong");

      const schemaBody = yup.object({
        quantity: yup.number().when("adjustment_type", {
          is: (val) => val !== "MINIMUM_STOCK",
          then: () => yup.number().required("Kuantiti tidak boleh kosong"),
          otherwise: () => yup.number(),
        }),
        quantityAdjustment: yup.number().when("adjustment_type", {
          is: (val) => val !== "MINIMUM_STOCK",
          then: () =>
            yup.number().required("Jumlah adjustment tidak boleh kosong"),
          otherwise: () => yup.number(),
        }),
        minimum_stock: yup.number().when("adjustment_type", {
          is: (val) => val === "MINIMUM_STOCK",
          then: () => yup.number().required("Stok minimum tidak boleh kosong"),
          otherwise: () => yup.number().notRequired(),
        }),
        adjustment_type: yup
          .string()
          .oneOf(["PLUS", "MINUS", "MINIMUM_STOCK"])
          .required("Tipe adjustment tidak boleh kosong"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.UserData;

      const adjustProductWarehouse =
        await ProductWarehouseService.adjustProduct({
          id,
          data: body,
          user,
        });

      res
        .status(200)
        .json(
          responses(true, `Produk berhasil di ubah`, adjustProductWarehouse)
        );
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // Get detail product_warehouse
  static async getProductWarehouse(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseService.findOne({ id: id });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getListProduct(req, res) {
    try {
      const user = req.UserData;

      const data = await ProductWarehouseService.findProductByWarehouseId({
        id: user.WarehouseId,
      });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ProductWarehouseController;

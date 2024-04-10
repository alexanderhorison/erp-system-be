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
      const schema = yup.object({
        ProductId: yup.number().required("Id produk tidak boleh kosong"),
        WarehouseId: yup.number().required("Id gudang tidak boleh kosong"),
        quantity: yup.number().required("Kuantiti tidak boleh kosong"),
        UnitId: yup.number().required("Unit id tidak boleh kosong"),
        minimum_stock: yup.number().required("Stok minimum tidak boleh kosong"),
        description: yup.string().optional(),
        info: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = { id: 1 };

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
  // Adjust Product (PLUS or MINUS) stock product
  static async adjustProduct(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk gudang tidak boleh kosong");

      const schemaBody = yup.object({
        quantity: yup.number().required("Kuantiti tidak boleh kosong"),
        minimum_stock: yup.number().required("Stok minimum tidak boleh kosong"),
        adjustment_type: yup
          .string()
          .required("Tipe adjustment tidak boleh kosong"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = { id: 1 };

      const adjustProductWarehouse = await ProductWarehouseService.adjustProduct({
        id,
        body,
        user,
      });

      res
        .status(200)
        .json(
          responses(true, "Produk berhasil diadjust", adjustProductWarehouse)
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
}

module.exports = ProductWarehouseController;

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
      res
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
        query: req.query
      });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // Insert product into warehouse (initiate product)
  static async create(req, res) {
    try {
      const object = yup.object({
        masterProductId: yup.number().required("Id produk tidak boleh kosong"),
        quantity: yup.number().required("Kuantiti tidak boleh kosong"),
        unitId: yup.number().required("Unit id tidak boleh kosong"),
        minimumStock: yup.number().required("Stok minimum tidak boleh kosong"),
        warehouseRackId: yup.number().required("Rak produk tidak boleh kosong")
      });

      const schemaParams = yup.object({
        warehouseId: yup.number().required("Id gudang tidak boleh kosong")
      })

      const schema = yup.array().of(object);
      const body = await yupSchemaValidation(req.body, schema);
      const params = await yupSchemaValidation(req.params, schemaParams)
      const user = req.userData;
      const warehouseId = params.warehouseId

      const newProductWarehouse = await ProductWarehouseService.create(
        body,
        user,
        warehouseId,
      );

      res
        .status(201)
        .json(
          responses(true, "Produk berhasil ditambahkan", newProductWarehouse)
        );
    } catch (error) {
      res
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
        quantity: yup.number().when("adjustmentType", {
          is: (val) => val !== "MINIMUM_STOCK",
          then: () => yup.number().required("Kuantiti tidak boleh kosong"),
          otherwise: () => yup.number(),
        }),
        quantityAdjustment: yup.number().when("adjustmentType", {
          is: (val) => val !== "MINIMUM_STOCK",
          then: () =>
            yup.number().required("Jumlah adjustment tidak boleh kosong"),
          otherwise: () => yup.number(),
        }),
        minimumStock: yup.number().when("adjustmentType", {
          is: (val) => val === "MINIMUM_STOCK",
          then: () => yup.number().required("Stok minimum tidak boleh kosong"),
          otherwise: () => yup.number().notRequired(),
        }),
        adjustmentType: yup
          .string()
          .oneOf(["PLUS", "MINUS", "MINIMUM_STOCK"])
          .required("Tipe adjustment tidak boleh kosong"),
      });

      const id = await yupSchemaValidation(req.params.id, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

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
      res
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
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // Soft delete product warehouse
  static async deleteProductWarehouse(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseService.delete({
        id: id,
        user: req.userData,
      });

      res.status(200).json(responses(true, "Success delete product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getListProduct(req, res) {
    try {
      const user = req.userData;
      const data = await ProductWarehouseService.findProductByWarehouseId({
        id: user.warehouseId,
      });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getHistoryProductWarehouse(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseService.getHistoryProductWarehouse({
        id: id,
      });

      res.status(200).json(responses(true, "Success get product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getProductWarehouseInternalTransfer(req, res) {
    try {
      const schemaParams = yup
        .number()
        .required("Id produk warehouse tidak boleh kosong");

      const id = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await ProductWarehouseService.getProductInternalTransfer({
        id: id,
      });

      res.status(200).json(responses(true, "Success get product internal transfer", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // GET DELETED PRODUCT
  static async getDeletedProduct(req, res) {
    try {
      const query = req?.query;

      const data = await ProductWarehouseService.getDeletedProduct({ query });

      res.status(200).json(responses(true, "Success get deleted product", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // RESTORE DELETED PRODUCT
  static async restoreProduct(req, res) {
    try {
      const id = req.params.id;

      const data = await ProductWarehouseService.restoreProduct({ id, user: req.userData });

      res.status(200).json(responses(true, "Success restore product", data));
    } catch (error) {
      res.status(error.code || 500).json(responses(false, error.message || error));
    }
  }
}

module.exports = ProductWarehouseController;

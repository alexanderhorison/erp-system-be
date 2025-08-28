const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const ProductRequestOrderService = require("../../services/productRequestOrder/ProductRequestOrderService");

class ProductRequestOrderController {
  static async createProductRequest(req, res) {
    try {
      // create schema validation yup
      const schema = yup.object().shape({
        data: yup.array().of(
          yup.object().shape({
            productId: yup.number().required("Produk harus diisi"),
            unitId: yup.number().required("Unit harus diisi"),
            quantityRequested: yup.number().typeError("Kuantiti Request harus diisi"),
          })
        ),
        notes: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createOrder = await ProductRequestOrderService.createProductRequest({
        data: body,
        user,
      });

      res
        .status(201)
        .json(responses(true, "Request Produk berhasil dibuat", createOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllProductRequest(req, res) {
    try {
      const getAllProductRequest =
        await ProductRequestOrderService.getAllProductRequest({ query: req.query });

      res.status(200).json(responses(true, "Berhasil", getAllProductRequest));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectProductRequestOrder(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code Product Request harus ada"),
        })
        .required("Code Product Request harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectProductRequestOrder = await ProductRequestOrderService.reject({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(responses(true, "Berhasil reject Product Request Order", rejectProductRequestOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailProductRequestOrder(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code Product Request order harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await ProductRequestOrderService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateProductRequestOrder(req, res) {
    try {
      const schemaParams = yup
        .string()
        .required("Code Product Request order harus diisi");

      const schemaBody = yup.object({
        data: yup.array().of(
          yup.object().shape({
            id: yup.number()
              .required("Product Request Order Detail id harus diisi"),
            productId: yup.number().required("Produk harus diisi"),
            unitId: yup.number().required("Unit harus diisi"),
            quantityRequested: yup.number().typeError("Kuantiti Request harus diisi"),
          })
        ),
        notes: yup.string().optional(),
      });
      const code = await yupSchemaValidation(req.params.code, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      await ProductRequestOrderService.updateProductRequestOrder({
        code,
        data: body,
      });

      res.status(200).json(responses(true, "Berhasil update Product Request Order"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async processProductRequestOrder(req, res) {
    try {
      const schema = yup.object().shape({
        code: yup.string().required("Code Product Request order harus diisi"),
        warehouseDestinationId: yup.number().required("Id gudang tujuan harus diisi"),
        notes: yup.string().optional(),
        data: yup.array().of(
          yup.object().shape({
            productWarehouseId: yup.number().required("Produk warehouse id harus diisi"),
            productId: yup.number().required("Produk harus diisi"),
            warehouseId: yup.number().required("Gudang harus diisi"),
            unitId: yup.number().required("Unit harus diisi"),
            qtyRequest: yup.number().typeError("Kuantiti Request harus diisi"),
            qtyGive: yup.number().typeError("Kuantiti Diberikan harus diisi"),
          })
        ),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;

      await ProductRequestOrderService.processProductRequestOrder({
        data: body,
        user,
      });

      res.status(200).json(responses(true, "Berhasil proses Product Request Order"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getProcessProductRequestOrder(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code Product Request order harus diisi");

      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await ProductRequestOrderService.getProcessProductRequestOrder(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ProductRequestOrderController;

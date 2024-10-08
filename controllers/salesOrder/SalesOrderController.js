const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const SalesOrderService = require("../../services/salesOrder/SalesOrderService");

class SalesOrderController {
  static async getAllSalesOrder(req, res) {
    try {
      const user = req.userData;

      const getAllSalesOrder = await SalesOrderService.getAll({
        user,
      });

      res.status(200).json(responses(true, "Berhasil", getAllSalesOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createSalesOrder(req, res) {
    try {
      const schema = yup.object({
        warehouseId: yup.number().required("Gudang asal harus diisi"),
        customerId: yup.number().required("Customer harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        dueDate: yup.string().required("Tanggal jatuh tempo harus ada"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              warehouseProductId: yup
                .number()
                .required("Id product warehouse harus diisi"),
              price: yup.number().required("Price product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
            })
          )
          .required("List sales order produk harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createSalesOrder = await SalesOrderService.create({
        data: body,
        user,
      });

      res
        .status(201)
        .json(
          responses(true, "Berhasil membuat sales order", createSalesOrder)
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveSalesOrder(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code sales order harus ada"),
        })
        .required("Code sales order harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approveSalesOrder = await SalesOrderService.approve({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(true, "Berhasil approval sales order", approveSalesOrder)
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectSalesOrder(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code sales order harus ada"),
        })
        .required("Code sales order harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectSalesOrder = await SalesOrderService.reject({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil reject sales order",
            rejectSalesOrder
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailSalesOrder(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code sales order harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await SalesOrderService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateSalesOrder(req, res) {
    try {
      const schemaParams = yup
        .string()
        .required("Code sales order harus diisi");

      const schemaBody = yup.object({
        warehouseId: yup.number().required("Gudang asal harus diisi"),
        customerId: yup.number().required("Customer harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        notes: yup.string().optional(),
        dueDate: yup.string().required("Tanggal jatuh tempo harus ada"),
        listProduct: yup
          .array()
          .of(
            yup.object({
              id: yup.number().required("sales order detail id harus diisi"),
              warehouseProductId: yup
                .number()
                .required("Id product warehouse harus diisi"),
              price: yup.number().required("Price product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
            })
          )
          .required("List sales order produk harus ada"),
      });

      const code = await yupSchemaValidation(req.params.code, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      await SalesOrderService.updateSalesOrder({
        data: body,
        code: code,
      });

      res.status(200).json(responses(true, "Berhasil update sales order"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getSalesOrderByCustomerId(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Customer Id harus diisi");

      const customerId = await yupSchemaValidation(params.id, schemaParams);

      const getAllSalesOrder = await SalesOrderService.getSalesOrderByCustomerId({
        customerId,
      });

      res.status(200).json(responses(true, "Berhasil", getAllSalesOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = SalesOrderController;

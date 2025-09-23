const { responses } = require("../../helpers/responses");
const {
  yupSchemaValidation,
  yupSchemaValidationStrict,
} = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const SalesOrderService = require("../../services/salesOrder/SalesOrderService");
const PrintSalesOrderService = require("../../services/salesOrder/PrintSalesOrderService");

class SalesOrderController {
  static async getAllSalesOrder(req, res) {
    try {
      const user = req.userData;

      const schemaQuery = yup.object({
        page: yup.string().default("1"),
        limit: yup.string().default("10"),
        search: yup.string().optional(),
        status: yup.string().optional(),
        orderBy: yup
          .string()
          .default("createdAt")
          .oneOf(["createdAt", "approvedAt", "shippingDate"]),
        orderType: yup.string().default("DESC").oneOf(["ASC", "DESC"]),
        dateFrom: yup.string().optional(),
        dateTo: yup.string().optional(),
        paginate: yup.boolean().default(false),
        date: yup.string().optional(),
      });

      const query = await yupSchemaValidationStrict(req.query, schemaQuery);

      const data = await SalesOrderService.getAll({
        user,
        query,
      });

      res
        .status(200)
        .json(responses(true, "Berhasil", data.data, data.pagination, query));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createSalesOrder(req, res) {
    try {
      const schema = yup.object({
        customerId: yup.number().required("Customer harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        grandTotalCustomer: yup
          .number()
          .required("Total Sales order harus ada"),
        grandTotalBarter: yup.number().required("Total Barter harus ada"),
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
              warehouseId: yup
                .number()
                .required("Gudang asal sales order harus diisi"),
              modal: yup.number().required("Harga Modal harus diisi"),
            })
          )
          .required("List sales order produk harus ada"),
        listBarterProduct: yup.lazy((value) => {
          // If there are items in the barterProduct array, require all fields within the objects
          if (value && value.length > 0) {
            return yup.array().of(
              yup.object({
                warehouseProductId: yup
                  .number()
                  .required("Id product warehouse harus diisi"),
                price: yup.number().required("Harga barter harus diisi"),
                quantity: yup.number().required("Kuantiti barter harus diisi"),
                subTotal: yup.number().required("Sub Total barter harus diisi"),
                warehouseId: yup
                  .number()
                  .required("Gudang asal barter harus diisi"),
                isNewModal: yup.boolean().optional(),
              })
            );
          }
          // If no barter products, make it optional
          return yup
            .array()
            .of(
              yup.object({
                warehouseProductId: yup.number(),
                price: yup.number(),
                quantity: yup.number(),
                subTotal: yup.number(),
                warehouseId: yup.number(),
                isNewModal: yup.boolean(),
              })
            )
            .optional();
        }),
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

      const schemaBody = yup.object({
        fullPayment: yup.boolean().required("Payment status harus diisi"),
      });
      const body = await yupSchemaValidation(req.body, schemaBody);

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approveSalesOrder = await SalesOrderService.approve({
        code: params.code,
        user,
        fullPayment: body.fullPayment,
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
        .json(responses(true, "Berhasil reject sales order", rejectSalesOrder));
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
        customerId: yup.number().required("Customer harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        grandTotalCustomer: yup
          .number()
          .required("Total Sales order harus ada"),
        grandTotalBarter: yup.number().required("Total Barter harus ada"),
        dueDate: yup.string().required("Tanggal jatuh tempo harus ada"),
        notes: yup.string().optional(),
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
              modal: yup.number().required("Modal Product harus diisi"),
              warehouseId: yup
                .number()
                .required("Gudang asal sales order harus diisi"),
            })
          )
          .required("List sales order produk harus ada"),
        listBarterProduct: yup.lazy((value) => {
          // If there are items in the barterProduct array, require all fields within the objects
          if (value && value.length > 0) {
            return yup.array().of(
              yup.object({
                id: yup
                  .number()
                  .required("sales order barter detail id harus diisi"),
                warehouseProductId: yup
                  .number()
                  .required("Id product warehouse harus diisi"),
                price: yup.number().required("Harga barter harus diisi"),
                quantity: yup.number().required("Kuantiti barter harus diisi"),
                subTotal: yup.number().required("Sub Total barter harus diisi"),
                warehouseId: yup
                  .number()
                  .required("Gudang asal barter harus diisi"),
                isNewModal: yup.boolean().optional(),
              })
            );
          }
          // If no barter products, make it optional
          return yup
            .array()
            .of(
              yup.object({
                id: yup.number(),
                warehouseProductId: yup.number(),
                price: yup.number(),
                quantity: yup.number(),
                subTotal: yup.number(),
                warehouseId: yup.number(),
                isNewModal: yup.boolean().optional(),
              })
            )
            .optional();
        }),
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

      const schemaParams = yup.string().required("Customer Id harus diisi");

      const customerId = await yupSchemaValidation(params.id, schemaParams);

      const getAllSalesOrder =
        await SalesOrderService.getSalesOrderByCustomerId({
          customerId,
        });

      res.status(200).json(responses(true, "Berhasil", getAllSalesOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getSalesOrderByDate(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup.string().required("Tanggal harus diisi");

      const date = await yupSchemaValidation(params.date, schemaParams);

      const getAllSalesOrder = await SalesOrderService.getSalesOrderByDate({
        date,
      });

      res.status(200).json(responses(true, "Berhasil", getAllSalesOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async printSalesOrder(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Sales Order code harus diisi");

      const code = await yupSchemaValidation(params.code, schemaParams);

      const salesOrder = await SalesOrderService.getDetailByCode(code);

      if (!salesOrder) {
        throw {
          code: 404,
          message: "Sales Order tidak ditemukan",
        };
      }

      const printService = await PrintSalesOrderService.print(salesOrder);

      res.status(200).json(
        responses(true, "Success Print", {
          buffer: printService.string,
          printerSetting: printService.printerSetting,
        })
      );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = SalesOrderController;

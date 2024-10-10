const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const SalesOrderPaymentService = require("../../services/salesOrder/SalesOrderPaymentService");

class SalesOrderPaymentController {
  static async getAllSalesOrderPayment(req, res) {
    try {
      const params = req.params;
      const schemaParams = yup.string().required("Sales Order id harus diisi");
      const salesOrderId = await yupSchemaValidation(
        params.salesOrderId,
        schemaParams
      );

      const getAllSalesOrderPayment = await SalesOrderPaymentService.getAll({
        salesOrderId,
      });

      res
        .status(200)
        .json(responses(true, "Berhasil", getAllSalesOrderPayment));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createSalesOrderPayment(req, res) {
    try {
      const schema = yup.object({
        amount: yup.number().required("Jumlah pembayaran harus diisi"),
        typePayment: yup.string().required("Tipe Pembayaran harus diisi"),
        notes: yup.string().optional(),
        salesOrderId: yup.number().required("Sales Order Id harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createPayment = await SalesOrderPaymentService.create({
        data: body,
        user,
      });

      res
        .status(201)
        .json(responses(true, "Berhasil membuat pembayaran", createPayment));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = SalesOrderPaymentController;

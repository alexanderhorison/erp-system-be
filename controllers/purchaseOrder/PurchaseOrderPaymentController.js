const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const PurchaseOrderPaymentService = require('../../services/purchaseOrder/PurchaseOrderPaymentService');

class PurchaseOrderPaymentController {
  static async getAllPurchaseOrderPayment(req, res) {
    try {
      const params = req.params;
      const schemaParams = yup.string().required("Purchase Order id harus diisi");
      const purchaseOrderId = await yupSchemaValidation(
        params.purchaseOrderId,
        schemaParams
      );

      const getAllPurchaseOrderPayment = await PurchaseOrderPaymentService.getAll({
        purchaseOrderId,
      });

      res
        .status(200)
        .json(responses(true, "Berhasil", getAllPurchaseOrderPayment));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createPurchaseOrderPayment(req, res) {
    try {
      const schema = yup.object({
        amount: yup.number().required("Jumlah pembayaran harus diisi"),
        typePayment: yup.string().required("Tipe Pembayaran harus diisi"),
        notes: yup.string().optional(),
        purchaseOrderId: yup.number().required("Purchase Order Id harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createPayment = await PurchaseOrderPaymentService.create({
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

module.exports = PurchaseOrderPaymentController;

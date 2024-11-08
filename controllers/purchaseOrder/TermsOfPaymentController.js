const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const TermsOfPaymentService = require("../../services/purchaseOrder/TermsOfPaymentService");

class TermsOfPaymentCOntroller {

  static async getAllTermsOfPayment(req, res) {
    try {
      const params = req.params;
      const schemaParams = yup.string().required("Purchase Order id harus diisi");

      const purchaseOrderCode = await yupSchemaValidation(
        params.purchaseOrderCode,
        schemaParams
      );

      const data = await TermsOfPaymentService.getAll({ purchaseOrderCode })

      res
        .status(200)
        .json(responses(true, "Berhasil Get All Terms Of Payment", data));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailTermsOfPayment(req, res) {
    try {
      const params = req.params;
      const schemaParams = yup.string().required("Terms of payment id harus diisi");

      const id = await yupSchemaValidation(
        params.id,
        schemaParams
      );

      const data = await TermsOfPaymentService.findOne({ id });

      res
        .status(200)
        .json(responses(true, "Berhasil Get Detail Terms Of Payment", data));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createTermsOfPayment(req, res) {
    try {
      const schemaBody = yup.object({
        title: yup.string().required("Title harus diisi"),
        purchaseOrderId: yup.number().required("Purchase Order id harus diisi"),
        dueDate: yup.date().required("Due date harus diisi"),
        reminderDate: yup.number().required("Reminder date harus diisi"),
        isSendEmail: yup.boolean().required("Is send email harus diisi"),
      })

      const body = await yupSchemaValidation(req.body, schemaBody)

      const data = await TermsOfPaymentService.create({ data: body })

      res
        .status(200)
        .json(responses(true, "Berhasil Create Terms Of Payment", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateTermsOfPayment(req, res) {
    try {

      const schemaParams = yup.string().required("Terms of payment id harus diisi");
      const schemaBody = yup.object({
        title: yup.string().required("Title harus diisi"),
        purchaseOrderId: yup.number().required("Purchase Order id harus diisi"),
        dueDate: yup.date().required("Due date harus diisi"),
        reminderDate: yup.number().required("Reminder date harus diisi"),
        isSendEmail: yup.boolean().required("Is send email harus diisi"),
      })

      const params = await yupSchemaValidation(req.params.id, schemaParams);

      const body = await yupSchemaValidation(req.body, schemaBody);

      const data = await TermsOfPaymentService.update({ id: params, data: body });

      res
        .status(200)
        .json(responses(true, "Berhasil Update Terms Of Payment", data));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteTermsOfPayment(req, res) {
    try {
      const schemaParams = yup.string().required("Terms of payment id harus diisi");

      const params = await yupSchemaValidation(req.params.id, schemaParams);

      const data = await TermsOfPaymentService.delete({ id: params });

      res
        .status(200)
        .json(responses(true, "Berhasil Delete Terms Of Payment", data));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = TermsOfPaymentCOntroller;
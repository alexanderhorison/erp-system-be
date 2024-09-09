const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const DeliveryOrderReceiveOutstandingService = require("../../services/deliveryOrderReceiveOutstanding/DeliveryOrderReceiveOutstandingService")
const yup = require("yup");


class DeliveryOrderReceiveOutstandingController {

  static async getAllDeliveryOrderReceiveOutstanding(req, res) {
    try {
      const data = await DeliveryOrderReceiveOutstandingService.getAll()

      res
        .status(200)
        .json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDeliveryOrderReceiveOutstandingByCode(req, res) {
    try {
      const code = req.params.code
      const data = await DeliveryOrderReceiveOutstandingService.getOne(code)

      res
        .status(200)
        .json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async saveToDraftDeliveryOrderReceiveOutstanding(req, res) {
    try {
      const schemaBody = yup.object({
        product: yup.array().optional(),
        notes: yup.string().optional(),
      })

      const schemaParams = yup.object({
        code: yup.string().required("Code Surat Outstanding harus diisi"),
      })

      const body = await yupSchemaValidation(req.body, schemaBody);

      const params = await yupSchemaValidation(req.params, schemaParams);

      const data = await DeliveryOrderReceiveOutstandingService.saveToDraft({
        data: body?.product,
        notes: body?.notes,
        code: params?.code
      })

      res
        .status(200)
        .json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveDeliveryOrderReceiveOutstanding(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code Surat Outstanding harus diisi"),
      }).required("Code Surat Outstanding harus diisi");

      const schemaBody = yup.object({
        notes: yup.string().optional(),
        products: yup.array().optional(),
      })

      const params = await yupSchemaValidation(req.params, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      const user = req.userData;

      const data = await DeliveryOrderReceiveOutstandingService.approve({
        code: params.code,
        notes: body.notes,
        products: body.products,
        user
      })
      res
        .status(200)
        .json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DeliveryOrderReceiveOutstandingController
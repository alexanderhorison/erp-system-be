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
      const schemaBody = yup.array({
      }).of(
        yup.object({
          id: yup.string().required("Code Surat Outstanding harus diisi"),
          status: yup.string().required("Status harus diisi"),
        })
      ).optional();

      const body = await yupSchemaValidation(req.body, schemaBody);

      const data = await DeliveryOrderReceiveOutstandingService.saveToDraft({
        data: req.body,
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

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const data = await DeliveryOrderReceiveOutstandingService.approve({
        code: params.code,
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
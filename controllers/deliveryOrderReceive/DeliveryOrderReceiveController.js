const { responses } = require("../../helpers/responses");
const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const DeliveryOrderReceiveService = require("../../services/deliveryOrderReceive/DeliveryOrderReceiveService");

class DeliveryOrderReceiveController {
  static async updateDeliveryOrder(req, res) {
    try {
      const schemaParams = yup
        .string()
        .required("Nomor Delivery Order tidak boleh kosong");

      const deliveryOrderId = await yupSchemaValidation(
        req.params.deliveryOrderId,
        schemaParams
      );

      const user = req.userData;

      await DeliveryOrderReceiveService.updateDeliveryOrder(deliveryOrderId, user);

      res.status(200).json(responses(true, `Berhasil menerima surat jalan`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DeliveryOrderReceiveController;

const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const DeliveryOrderService = require("../../services/deliveryOrder/DeliveryOrderService");

class DeliveryOrderController {
  static async createDeliveryOrder(req, res) {
    try {
      // create schema validation yup
      const schema = yup.object().shape({
        status: yup.string().required("Status surat jalan harus diisi"),
        WarehouseOriginId: yup.number().required("Gudang asal harus diisi"),
        WarehouseDestinationId: yup
          .number()
          .required("Gudang tujuan harus diisi"),
        userId: yup.number().required("User pembuat harus diisi"),
        notes: yup.string().optional(),
      });
      const body = await yupSchemaValidation(req.body, schema);

      const createOrder = await DeliveryOrderService.createDeliveryOrder(body);

      res
        .status(201)
        .json(responses(true, "Surat Jalan berhasil dibuat", createOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async getAllDeliveryOrder(req, res) {
    try {
      const getAllDeliveryOrder =
        await DeliveryOrderService.getAllDeliveryOrder(req.body);

      res.status(200).json(responses(true, "Berhasil", getAllDeliveryOrder));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailDeliveryOrder(req, res) {
    try {
      const getDetailDeliveryOrder =
        await DeliveryOrderService.getDetailDeliveryOrder(req);

      res.status(200).json(responses(true, "Berhasil", getDetailDeliveryOrder));
    } catch (error) {
      return res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DeliveryOrderController;

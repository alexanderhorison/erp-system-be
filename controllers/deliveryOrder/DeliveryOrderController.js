const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const DeliveryOrderService = require("../../services/deliveryOrder/DeliveryOrderService");
const yup = require("yup");

class DeliveryOrderController {
  // ADD DELIVERY ORDER
  static async createDeliveryOrder(req, res) {
    try {
      // create schema validation yup
      const schema = yup.object().shape({
        warehouseOriginId: yup.number().required("Gudang asal harus diisi"),
        warehouseDestinationId: yup
          .number()
          .required("Gudang tujuan harus diisi"),
        data: yup.array().of(
          yup.object().shape({
            productWarehouseId: yup.number().typeError("Produk harus dipilih"),
            qty: yup.number().typeError("Kuantiti harus diisi"),
          })
        ),
        notes: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createOrder = await DeliveryOrderService.createDeliveryOrder({
        data: body,
        user,
      });

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
      const user = req.userData;
      const getAllDeliveryOrder =
        await DeliveryOrderService.getAllDeliveryOrder({ user });

      res.status(200).json(responses(true, "Berhasil", getAllDeliveryOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // FOR ADD PRODUCT AT DELIVERY ORDER
  static async getInvoiceListProduct(req, res) {
    try {
      const warehouseId = req.body.warehouseId;

      const data = await DeliveryOrderService.getInvoiceListProduct(
        warehouseId
      );

      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailDeliveryOrder(req, res) {
    try {
      const deliveryOrderId = req.params.id
      const getDetailDeliveryOrder =
        await DeliveryOrderService.getDetailDeliveryOrder(deliveryOrderId);

      res.status(200).json(responses(true, "Berhasil", getDetailDeliveryOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DeliveryOrderController;

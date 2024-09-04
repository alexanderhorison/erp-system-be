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

      await DeliveryOrderReceiveService.updateDeliveryOrder(
        deliveryOrderId,
        user
      );

      res.status(200).json(responses(true, `Berhasil menerima surat jalan`));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAllDeliveryOrderReceive(req, res) {
    try {
      const user = req.userData;
      const getAllDeliveryOrderReceive =
        await DeliveryOrderReceiveService.getAllDeliveryOrderReceive({ user });

      res
        .status(200)
        .json(responses(true, "Berhasil", getAllDeliveryOrderReceive));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createDeliveryOrderReceive(req, res) {
    try {
      // create schema validation yup
      const schema = yup.object().shape({
        data: yup.array().of(
          yup.object().shape({
            deliveryOrderProductId: yup.number().required("Produk harus ada"),
            quantity: yup.number().required("Kuantiti stok harus ada"),
            receiveQuantity: yup
              .number()
              .required("Jumlah kuantiti diterima harus ada")
              .test(
                "max",
                "Kuantiti diterima tidak boleh lebih besar dari kuantiti asal",
                function (value) {
                  const { quantity } = this.parent;
                  return value <= quantity;
                }
              ),
          })
        ),
        deliveryOrderId: yup.number().required("Delivery order id harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);
      const user = req.userData;

      await DeliveryOrderReceiveService.createDeliveryOrderReceive({
        data: body,
        user,
      });

      res
        .status(201)
        .json(responses(true, "Penerimaan Surat Jalan berhasil dibuat"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailDeliveryOrderReceive(req, res) {
    try {
      const deliveryOrderReceiveId = req.params.id;
      const schemaParams = yup
        .string()
        .required("Kode Penerimaan surat jalan harus ada");
      const code = await yupSchemaValidation(deliveryOrderReceiveId, schemaParams);

      const getDetail = await DeliveryOrderReceiveService.getDetailDeliveryOrderReceive(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DeliveryOrderReceiveController;

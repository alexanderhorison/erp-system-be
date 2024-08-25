const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const InternalTransferService = require("../../services/internalTransfer/InternalTransferService");

class InternalTransferController {
  static async getAllInternalTransfer(req, res) {
    try {
      const user = req.userData;

      const getAllInternalTransfer = await InternalTransferService.getAll({
        user,
      });

      res.status(200).json(responses(true, "Berhasil", getAllInternalTransfer));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createInternalTransfer(req, res) {
    try {
      const schema = yup.object({
        warehouseId: yup.number().required("Gudang asal harus diisi"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              warehouseProductId: yup
                .number()
                .required("Id product warehouse harus diisi"),
              warehouseRackFromId: yup
                .number()
                .required("Rak asal harus diisi"),
              warehouseRackToId: yup
                .number()
                .required("Rak tujuan harus diisi"),
            })
          )
          .required("list internal transfer produk harus ada"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createInternalTransfer = await InternalTransferService.create({
        data: body,
        user,
      });

      res
        .status(201)
        .json(
          responses(
            true,
            "Berhasil membuat internal transfer rak",
            createInternalTransfer
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveInternalTransfer(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code internal transfer harus ada"),
        })
        .required("Code internal transfer harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approveInternalTransfer = await InternalTransferService.approve({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil approval internal transfer rak",
            approveInternalTransfer
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectInternalTransfer(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code internal transfer harus ada"),
        })
        .required("Code internal transfer harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectInternalTransfer = await InternalTransferService.reject({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil reject internal transfer",
            rejectInternalTransfer
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailInternalTransfer(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code internal transfer harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await InternalTransferService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = InternalTransferController;

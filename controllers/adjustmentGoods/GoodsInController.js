const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const GoodsInService = require("../../services/adjustmentGoods/GoodsInService");

class GoodsInController {

  static async getAllGoodsIn(req, res) {
    try {
      const user = req.userData;

      const getAllGoodsIn =
        await GoodsInService.getAll({ user });

      res.status(200).json(responses(true, "Berhasil", getAllGoodsIn));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createGoodsIn(req, res) {
    try {
      const schema = yup.object({
        warehouseDestination: yup.number().required("Gudang asal harus diisi"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              masterProductId: yup.number().required("Id goods harus diisi"),
              quantity: yup.number().required("Kuantiti harus diisi"),
              unitId: yup.number().required("Satuan harus diisi"),
            })
          )
          .required("Goods harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createGoodsIn = await GoodsInService.create({
        data: body,
        user,
      });

      res.status(201).json(responses(true, "Berhasil membuat goods in", createGoodsIn));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveGoodsIn(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code goods in harus diisi"),
      }).required("Code goods in harus diisi");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approveGoodsIn = await GoodsInService.approve({
        code: params.code,
        user,
      });

      res.status(200).json(responses(true, "Berhasil approval goods in", approveGoodsIn));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectGoodsIn(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code goods in harus diisi"),
      }).required("Code goods in harus diisi");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectGoodsIn = await GoodsInService.reject({
        code: params.code,
        user,
      });

      res.status(200).json(responses(true, "Berhasil reject goods in", rejectGoodsIn));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DONE NOT TESTED
  static async getDetailGoodsIn(req, res) {
    try {
      const params = req.params

      const schemaParams = yup.string().required("Code goods in harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getAllGoodsIn = await GoodsInService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getAllGoodsIn));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = GoodsInController
const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const GoodsOutService = require("../../services/adjustmentGoods/GoodsOutService");





class GoodsOutController {
  // DONE TESTED
  static async getAllGoodsOut(req, res) {
    try {
      const user = req.userData;

      const getAllGoodsOut =
        await GoodsOutService.getAll({ user });

      res.status(200).json(responses(true, "Berhasil", getAllGoodsOut));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DONE TESTED
  static async createGoodsOut(req, res) {
    try {
      const schema = yup.object({
        warehouseOrigin: yup.number().required("Gudang asal harus diisi"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              warehouseProductId: yup.number().required("Id goods harus diisi"),
              quantity: yup.number().required("Kuantiti harus diisi"),
            })
          )
          .required("Goods harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createGoodsOut = await GoodsOutService.create({
        data: body,
        user,
      });

      res.status(201).json(responses(true, "Berhasil membuat goods out", createGoodsOut));

    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DONE NOT TESTED
  static async approveGoodsOut(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code goods out harus diisi"),
      }).required("Code goods out harus diisi");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approveGoodsOut = await GoodsOutService.approve({
        code: params.code,
        user,
      });

      res.status(200).json(responses(true, "Berhasil approval goods out", approveGoodsOut));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DONE TESTED
  static async rejectGoodsOut(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code goods out harus diisi"),
      }).required("Code goods out harus diisi");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectGoodsOut = await GoodsOutService.reject({
        code: params.code,
        user,
      });

      res.status(200).json(responses(true, "Berhasil reject goods out", rejectGoodsOut));
    } catch (error) {
      console.log('error', error);

      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DONE NOT TESTED
  static async getDetailGoodsOut(req, res) {
    try {
      const params = req.params

      const schemaParams = yup.string().required("Code goods out harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getAllGoodsOut = await GoodsOutService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getAllGoodsOut));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = GoodsOutController
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataModalService = require("../../services/masterData/MasterDataModalService");

class MasterDataModalControler {
  static async getOnePriceModal(req, res) {
    try {
      const schemaParams = yup.object({
        productId: yup.number().required("Product id harus diisi"),
        unitId: yup.number().required("Unit id harus diisi"),
      });
      const body = await yupSchemaValidation(req.params, schemaParams);
      
      const productPrice = await MasterDataModalService.getOnePriceModal({
        productId: body.productId,
        unitId: body.unitId,
      });
      res
        .status(200)
        .json(responses(true, "Success get Modal Price", productPrice));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataModalControler;

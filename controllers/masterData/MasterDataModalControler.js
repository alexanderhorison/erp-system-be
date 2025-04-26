const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataModalService = require("../../services/masterData/MasterDataModalService");
const { formatStartDateDatabase, formatEndDateDatabase } = require("../../helpers/formatDate");

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

      res.status(200).json(responses(true, "Success get Modal Price", productPrice));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async migratePriceModal(req, res) {
    try {
      const schemaBody = yup.object({
        date_from: yup.date().required("Date from harus diisi"),
        date_to: yup.date().required("Date to harus diisi"),
      })

      const body = await yupSchemaValidation(req.body, schemaBody)

      // const data = await MasterDataModalService.migratePriceModal({
      //   date_from: formatStartDateDatabase(body.date_from),
      //   date_to: formatEndDateDatabase(body.date_to),
      // })

      const updateSo = await MasterDataModalService.insertModalToSO({
        date_from: formatStartDateDatabase(body.date_from),
        date_to: formatEndDateDatabase(body.date_to),
      })

      const updateMasterModal = await MasterDataModalService.updateMasterModal({
        date_from: formatStartDateDatabase(body.date_from),
        date_to: formatEndDateDatabase(body.date_to),
      })

      res.status(200).json(responses(true, "Success migrate SO and Master Modal", {}));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = MasterDataModalControler;

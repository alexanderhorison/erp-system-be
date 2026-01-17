const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const { responses } = require("../../helpers/responses");
const MasterDataProductPriceService = require("../../services/masterData/MasterDataProductPriceService");

class MasterDataProductPriceController {
  static async createOrUpdate(req, res) {
    try {
      const schema = yup.object({
        productId: yup.number().required("productId harus diisi"),
        unitId: yup.number().required("productId harus diisi"),
        basePrice: yup.number().required("base price harus diisi"),
        basePricePos: yup.number().required("base price harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schema);

      await MasterDataProductPriceService.createOrUpdate(body);

      res
        .status(200)
        .json(responses(true, "Product Price berhasil ditambahkan"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getAll(req, res) {
    try {
      const schemaParams = yup.number().required("Product id harus diisi");

      const id = await yupSchemaValidation(req.params.productId, schemaParams);

      const productPrice = await MasterDataProductPriceService.findAll({
        productId: id,
      });
      res
        .status(200)
        .json(responses(true, "Success get Product Price", productPrice));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async getOne(req, res) {
    try {
      const schemaParams = yup.object({
        productId: yup.number().required("Product id harus diisi"),
        unitId: yup.number().required("Unit id harus diisi"),
      });
      const body = await yupSchemaValidation(req.params, schemaParams);

      const productPrice = await MasterDataProductPriceService.findOne({
        productId: body.productId,
        unitId: body.unitId,
      });
      res
        .status(200)
        .json(responses(true, "Success get Product Price", productPrice));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async downloadTemplate(req, res) {
    try {
      const { sheetName, file } = await MasterDataProductPriceService.downloadTemplate();

      // Send Excel as response
      res.set({
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${sheetName}"`,
        "Access-Control-Expose-Headers": "Content-Disposition",
      });

      res.end(file);
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async importTemplate(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json(responses(false, "File Excel harus diupload"));
      }

      const result = await MasterDataProductPriceService.importTemplate(req.file.buffer, req.user);
      res
        .status(200)
        .json(responses(true, "Import template berhasil diproses", result));
    } catch (error) {
      console.log("masuk error", error)
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  
}

module.exports = MasterDataProductPriceController;

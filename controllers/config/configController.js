const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const ConfigService = require("../../services/config/configService");

class ConfigController {
  static async createConfig(req, res) {
    try {
      const schemaBody = yup.object({
        key: yup.string().required("Key harus diisi"),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      await ConfigService.create({
        payload: body,
      });

      res
        .status(200)
        .json(responses(true, "Success create config", body));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getConfig(req, res) {
    try {
      const schemaBody = yup.object({
        key: yup.string().required("Key harus diisi"),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      const data = await ConfigService.get({
        key: body.key,
      });

      res
        .status(200)
        .json(responses(true, "Success Get Config", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateConfig(req, res) {
    try {
      const schemaBody = yup.object({
        key: yup.string().required("Key harus diisi"),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      await ConfigService.update({
        payload: body,
      });

      res
        .status(200)
        .json(responses(true, "Success Update Config", body));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = ConfigController;

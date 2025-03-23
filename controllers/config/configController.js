const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const ConfigService = require("../../services/config/configService");

class ConfigController {
  // ALL CONFIG
  static async getAllConfig(req, res) {
    try {
      const schemaBody = yup.object({
        key: yup.string().optional(),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      const result = await ConfigService.getAllConfig({ query: body });

      res
        .status(200)
        .json(responses(true, "Success", result));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // ADD CONFIG
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
        .json(responses(true, "Success", body));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DETAIL CONFIG
  static async getConfig(req, res) {
    try {
      const schemaBody = yup.object({
        id: yup.number().optional(),
        key: yup.string().optional(),
        value: yup.string().optional(),
        category: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      const data = await ConfigService.get({
        query: body,
      });

      res
        .status(200)
        .json(responses(true, "Success", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // UPDATE CONFIG
  static async updateConfig(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.number().required("Id harus diisi"),
      })

      const schemaBody = yup.object({
        key: yup.string().optional(),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);
      const params = await yupSchemaValidation(req.params, schemaParams);

      await ConfigService.update({
        id: params.id,
        payload: body,
      });

      res
        .status(200)
        .json(responses(true, "Success", body));
    } catch (error) {
      console.log(error);

      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // DELETE CONFIG
  static async deleteConfig(req, res) {
    try {
      const schemaBody = yup.object({
        id: yup.number().required("Id harus diisi"),
      })

      const body = await yupSchemaValidation(req.body, schemaBody);

      await ConfigService.delete({
        query: body,
      });

      res.status(200).json(responses(true, "Success", {}));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = ConfigController;

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

      res.status(200).json(responses(true, "Success", result));
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

      res.status(200).json(responses(true, "Success", body));
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

      res.status(200).json(responses(true, "Config Berhasil Ditambah", data));
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
      });

      console.log("Request body:", req.body);
      console.log("Uploaded file:", req.file);

      const schemaBody = yup.object({
        key: yup.string().optional(),
        value: yup.string().optional(),
        category: yup.string().optional(),
        value_json: yup.mixed().optional(),
        description: yup.string().optional(),
        logo: yup.string().optional(), // For handling logo field from form data
      }).noUnknown(false); // Allow unknown fields for value_json.* properties

      const body = await yupSchemaValidation(req.body, schemaBody);
      const params = await yupSchemaValidation(req.params, schemaParams);

      // Handle logo file upload if present
      let logoData = null;
      if (req.file) {
        logoData = {
          filename: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
          buffer: req.file.buffer, // File data as buffer for future processing
        };
        console.log("Logo file uploaded:", logoData.filename);
      }

      // Handle COMPANY_INFO special case - reconstruct nested value_json
      let processedPayload = { ...body };
      
      if (body.key === 'COMPANY_INFO') {
        // Extract value_json properties from flattened structure
        const valueJson = {};
        const bodyKeys = Object.keys(req.body);
        
        bodyKeys.forEach(key => {
          if (key.startsWith('value_json.')) {
            const nestedKey = key.replace('value_json.', '');
            valueJson[nestedKey] = req.body[key];
          }
        });

        // Only set value_json if we found nested properties
        if (Object.keys(valueJson).length > 0) {
          processedPayload.value_json = valueJson;
        }

        // Remove the flattened properties from the processed payload
        Object.keys(processedPayload).forEach(key => {
          if (key.startsWith('value_json.')) {
            delete processedPayload[key];
          }
        });
      }

      // Prepare final payload with logo data if available
      const payload = {
        ...processedPayload,
        ...(logoData && { logoData }) // Add logoData to payload if file was uploaded
      };

      console.log("Final payload:", payload);

      await ConfigService.update({
        id: params.id,
        payload: payload,
      });

      res.status(200).json(responses(true, "Config Berhasil Diubah", {
        ...body,
        logoUploaded: !!req.file,
        logoFilename: logoData?.filename || null
      }));
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
      });

      const body = await yupSchemaValidation(req.body, schemaBody);

      await ConfigService.delete({
        query: body,
      });

      res.status(200).json(responses(true, "Config Berhasil Dihapus", {}));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // BULK UPDATE CONFIG BY CATEGORY
  static async bulkUpdateConfig(req, res) {
    try {
      const schemaBody = yup.array().of(
        yup.object({
          key: yup.string().required("Key harus diisi"),
          value: yup.string().optional(),
          category: yup.string().optional(),
          value_json: yup.mixed().optional(),
          description: yup.string().optional(),
        })
      );

      const body = await yupSchemaValidation(req.body, schemaBody);

      await ConfigService.bulkUpdate({
        payload: body,
      });

      res.status(200).json(responses(true, "Config Berhasil Diubah", body));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = ConfigController;

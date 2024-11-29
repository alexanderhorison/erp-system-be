const { responses } = require("../../helpers/responses");

const yup = require("yup");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");

const StockOpnameService = require("../../services/stockOpname/StockOpnameService");

class StockOpnameController {
  static async getAllStockOpname(req, res) {
    try {
      const { query } = req;
      const data = await StockOpnameService.findAll(query);
      res.status(200).json(responses(true, "Success get data all stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createStockOpname(req, res) {
    try {
      const schema = yup.object({
        warehouseId: yup.number().required("Warehouse harus diisi"),
        opnameDate: yup.date().required("Tgl stock opname harus diisi"),
        data: yup.array().required("Data harus diisi"),
        status: yup.string().required("Status harus diisi"),
        notes: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;
      const data = await StockOpnameService.create(body, user);

      res.status(200).json(responses(true, "Success menambahkan stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailStockOpnameByCode(req, res) {
    try {
      const params = req.params

      const schemaParams = yup.string().required("Code goods out harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const data = await StockOpnameService.getDetailByCode(code);

      res.status(200).json(responses(true, "Success get data detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateDetailStockOpnameByCode(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code stock opname harus diisi"),
      });

      const schemaBody = yup.object({
        data: yup.array().required("Data harus diisi"),
        notes: yup.string().optional(),
        status: yup.string().required("Status harus diisi"),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);
      const params = await yupSchemaValidation(req.params, schemaParams);
      const user = req.userData;

      const data = await StockOpnameService.update(params.code, body, user);

      res.status(200).json(responses(true, "Success update detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteStockOpnameByCode(req, res) {
    try {
      const schema = yup.object({
        code: yup.string().required("Code stock opname harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schema);

      const user = req.userData;
      const data = await StockOpnameService.delete(params.code, user);
      res.status(200).json(responses(true, "Success delete detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveStockOpnameByCode(req, res) {
    try {
      const schema = yup.object({
        code: yup.string().required("Code stock opname harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schema);

      const user = req.userData;
      const data = await StockOpnameService.approve(params.code, user);
      res.status(200).json(responses(true, "Success approve detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectStockOpnameByCode(req, res) {
    try {
      const params = req.params

      const schemaParams = yup.string().required("Code goods out harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const user = req.userData;
      const data = await StockOpnameService.reject(code, user);
      res.status(200).json(responses(true, "Success reject detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async confirmStockOpnameByCode(req, res) {
    try {
      const schemaParams = yup.object({
        code: yup.string().required("Code stock opname harus diisi"),
      })

      const schema = yup.array();

      const params = await yupSchemaValidation(req.params, schemaParams);
      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;
      const data = await StockOpnameService.confirm({ code: params.code, data: body, user });
      res.status(200).json(responses(true, "Success confirm detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async checkStockOpnameWarehouse(req, res) {
    try {
      const schemaParams = yup.object({
        warehouseId: yup.number().required("Warehouse harus diisi"),
      });
      const params = await yupSchemaValidation(req.params, schemaParams);
      const data = await StockOpnameService.checkStockOpnameWarehouse(
        params.warehouseId
      );
      res.status(200).json(responses(true, "Success check stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = StockOpnameController
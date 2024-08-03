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

  static async getDetailStockOpnameById(req, res) {
    try {
      const schema = yup.object({
        id: yup.number().required("Id stock opname harus diisi"),
      });

      const body = await yupSchemaValidation(req.params, schema);

      const data = await StockOpnameService.getDetailById(body.id);

      res.status(200).json(responses(true, "Success get data detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updateDetailStockOpnameById(req, res) {
    try {
      const schemaParams = yup.object({
        id: yup.number().required("Id stock opname harus diisi"),
      });

      const schemaBody = yup.object({
        data: yup.array().required("Data harus diisi"),
        notes: yup.string().optional(),
      });

      const body = await yupSchemaValidation(req.body, schemaBody);
      const params = await yupSchemaValidation(req.params, schemaParams);
      const user = req.userData;

      const data = await StockOpnameService.update(params.id, body, user);

      res.status(200).json(responses(true, "Success update detail stock opname", data));
    } catch (error) {
      console.log(error);
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async deleteStockOpnameById(req, res) {
    try {
      const schema = yup.object({
        id: yup.number().required("Id stock opname harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schema);

      const user = req.userData;
      const data = await StockOpnameService.delete(params.id, user);
      res.status(200).json(responses(true, "Success delete detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approveStockOpnameById(req, res) {
    try {
      const schema = yup.object({
        id: yup.number().required("Id stock opname harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schema);

      const user = req.userData;
      const data = await StockOpnameService.approve(params.id, user);
      res.status(200).json(responses(true, "Success approve detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectStockOpnameById(req, res) {
    try {
      const schema = yup.object({
        id: yup.number().required("Id stock opname harus diisi"),
      });

      const params = await yupSchemaValidation(req.params, schema);

      const user = req.userData;
      const data = await StockOpnameService.reject(params.id, user);
      res.status(200).json(responses(true, "Success reject detail stock opname", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

}

module.exports = StockOpnameController
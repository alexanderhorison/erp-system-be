const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardService = require("../../services/dashboard/DashboardService");

class DashboardController {
  // 1
  static async minimumStock(req, res) {
    try {
      const { query } = req;
      const getMiminumWarehouseProduct = await DashboardService.minimumStock({
        query,
      });
      res
        .status(200)
        .json(responses(true, "Berhasil", getMiminumWarehouseProduct));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 2
  static async slowStock(req, res) {
    try {
      const getSlowStock = await DashboardService.slowStock({
        query: req.query,
      });
      res.status(200).json(responses(true, "Berhasil", getSlowStock));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 3
  static async fastStock(req, res) {
    try {
      const { query } = req;
      const getFastStock = await DashboardService.fastStock({
        query
      });
      res.status(200).json(responses(true, "Berhasil", getFastStock));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 4
  static async maxQuantityByUnit(req, res) {
    try {
      const { query } = req;
      const getMaxQuantityByUnit = await DashboardService.maxQuantityByUnit({
        query,
      });
      res.status(200).json(responses(true, "Berhasil", getMaxQuantityByUnit));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 5
  static async totalProductInWarehouse(req, res) {
    try {
      const { query } = req;
      const getTotalProductInWarehouse =
        await DashboardService.totalQuantityInWarehouse({
          query
        });
      res
        .status(200)
        .json(responses(true, "Berhasil", getTotalProductInWarehouse));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 6 
  static async totalSurat(req, res) {
    try {
      const { query } = req;
      const getTotalSurat = await DashboardService.totalSurat({
        query
      });
      res.status(200).json(responses(true, "Berhasil", getTotalSurat));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 7 PENDING DULU
  static async totalSuratPending(req, res) {
    try {
      const { query } = req;
      const getTotalSuratPending = await DashboardService.totalSuratPending({ query });
      res.status(200).json(responses(true, "Berhasil", getTotalSuratPending));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 8. List product paling banyak hilang dari OUTSTANDING
  static async listMostLostProductAtOutstanding(req, res) {
    try {
      const { query } = req;
      const data = await DashboardService.listMostLostProductAtOutstanding({
        query
      });
      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  // 9. List product paling banyak quantity hilang dari OUTSTANDING
  static async listMostLostProductAtOutstandingByQuantity(req, res) {
    try {
      const { query } = req;
      const data = await DashboardService.listMostLostProductAtOutstandingByQuantity({
        query
      });
      res.status(200).json(responses(true, "Berhasil", data));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DashboardController;

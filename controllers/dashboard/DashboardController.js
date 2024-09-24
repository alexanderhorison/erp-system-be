const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const DashboardService = require("../../services/dashboard/DashboardService");

class DashboardController {
  static async minimumStock(req, res) {
    try {
      const getMiminumWarehouseProduct = await DashboardService.minimumStock();
      res
        .status(200)
        .json(responses(true, "Berhasil", getMiminumWarehouseProduct));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
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
  static async fastStock(req, res) {
    try {
      const getFastStock = await DashboardService.fastStock({
        query: req.query,
      });
      res.status(200).json(responses(true, "Berhasil", getFastStock));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async maxQuantityByUnit(req, res) {
    try {
      const getMaxQuantityByUnit = await DashboardService.maxQuantityByUnit();
      res.status(200).json(responses(true, "Berhasil", getMaxQuantityByUnit));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async totalProductInWarehouse(req, res) {
    try {
      const getTotalProductInWarehouse =
        await DashboardService.totalProductInWarehouse();
      res
        .status(200)
        .json(responses(true, "Berhasil", getTotalProductInWarehouse));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async totalQuantityByUnitInWarehouse(req, res) {
    try {
      const getTotalQuantityByUnitInWarehouse =
        await DashboardService.totalQuantityByUnitInWarehouse();
      res
        .status(200)
        .json(responses(true, "Berhasil", getTotalQuantityByUnitInWarehouse));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async totalSurat(req, res) {
    try {
      const getTotalSurat = await DashboardService.totalSurat();
      res.status(200).json(responses(true, "Berhasil", getTotalSurat));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
  static async totalSuratPending(req, res) {
    try {
      const getTotalSuratPending = await DashboardService.totalSuratPending();
      res.status(200).json(responses(true, "Berhasil", getTotalSuratPending));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }
}

module.exports = DashboardController;

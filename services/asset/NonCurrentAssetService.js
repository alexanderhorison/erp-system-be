const {
  calculateCurrentYearDepreciation,
} = require("../../helpers/monthlyNonCurrentAsset.js/calculateCurrentYearDepreciation");
const {
  calculateLastYearDepreciation,
} = require("../../helpers/monthlyNonCurrentAsset.js/calculateLastYearDepreciation");
const {
  sumNonCurrentAsset,
} = require("../../helpers/monthlyNonCurrentAsset.js/sumNonCurrentAsset");
const { sequelize: sq, Monthly_Non_Current_Assets } = require("../../models");
const MasterNonCurrentAssetService = require("./MasterNonCurrentAssetService");

class NonCurrentAssetService {
  static async getAll() {
    try {
      const nonCurrentAssets = await Monthly_Non_Current_Assets.findAll({
        order: [["date", "DESC"]],
      });
      return nonCurrentAssets;
    } catch (error) {
      throw error;
    }
  }

  static async generateNonCurrentAsset({ date, notes }) {
    const transaction = await sq.transaction();
    try {
      // Validate that date cannot exceed last month
      const currentDate = new Date();
      const inputDate = new Date(date);
      const lastMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1
      );

      // Set to last day of last month for comparison
      lastMonth.setDate(
        new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate()
      );

      if (inputDate > lastMonth) {
        throw {
          code: 400,
          message:
            "Bulan belum berakhir, tidak dapat membuat data Asset Tidak Lancar",
        };
      }

      const exsistingData = await Monthly_Non_Current_Assets.findOne({
        where: {
          date: date,
        },
      });

      if (exsistingData) {
        throw {
          code: 400,
          message: "Data Asset Non-Keuangan untuk bulan ini sudah ada",
        };
      }

      const masterNonCurrentAssets =
        await MasterNonCurrentAssetService.getAll();

      const vehicleValue = sumNonCurrentAsset(
        masterNonCurrentAssets.filter((asset) => asset.assetType === "VEHICLE"),
        date
      );

      const buildingValue = sumNonCurrentAsset(
        masterNonCurrentAssets.filter(
          (asset) => asset.assetType === "BUILDING"
        ),
        date
      );

      const landValue = sumNonCurrentAsset(
        masterNonCurrentAssets.filter((asset) => asset.assetType === "LAND"),
        date
      );

      const longTermInvestment = sumNonCurrentAsset(
        masterNonCurrentAssets.filter(
          (asset) => asset.assetType === "LONG_TERM_INVESTMENT"
        ),
        date
      );

      const othersValue = sumNonCurrentAsset(
        masterNonCurrentAssets.filter((asset) => asset.assetType === "OTHERS"),
        date
      );

      const currentYearDepreciation = calculateCurrentYearDepreciation(
        masterNonCurrentAssets.filter((asset) => asset.isDepreciable),
        date
      );

      const lastYearDepreciation = calculateLastYearDepreciation(
        masterNonCurrentAssets.filter((asset) => asset.isDepreciable),
        date
      );

      function calculateTotalValue() {
        return (
          vehicleValue +
          buildingValue +
          landValue +
          longTermInvestment +
          othersValue
        );
      }

      const newAsset = {
        date: date,
        vehicleValue: vehicleValue,
        buildingValue: buildingValue,
        landValue: landValue,
        longTermInvestment: longTermInvestment,
        othersValue: othersValue,
        previousYearDepreciation: lastYearDepreciation,
        currentYearDepreciation: currentYearDepreciation,
        totalValue: calculateTotalValue(),
        notes: notes || "",
      };

      const newNonCurrentAsset = await Monthly_Non_Current_Assets.create(
        newAsset,
        { transaction }
      );

      // Update master non current aset jika sudah selesai terdepresiasi
      await MasterNonCurrentAssetService.checkDepreciationActive(
        date,
        transaction
      );

      await transaction.commit();

      return newAsset;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = NonCurrentAssetService;

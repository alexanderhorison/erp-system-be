const { NON_CURENT_ASSETS_TYPE } = require("../../const/NonCurrentAssetType.js");
const { Tm_Non_Current_Assets } = require("../../models");

class MasterNonCurrentAssetService {
  static async getAll(query) {
    try {
      const assets = await Tm_Non_Current_Assets.findAll({
        order: [["name", "ASC"]],
      });
      return assets;
    } catch (error) {
      throw error;
    }
  }

  static async create(data) {
    try {
      const {
        name,
        assetValue,
        assetType,
        acquisitionDate,
        depreciationMonths,
        notes = null,
      } = data;

      const depreciationValue =
        NON_CURENT_ASSETS_TYPE.VEHICLE === assetType ||
        NON_CURENT_ASSETS_TYPE.BUILDING === assetType
          ? assetValue / depreciationMonths
          : 0;

      const asset = await Tm_Non_Current_Assets.create({
        name,
        assetValue,
        assetType,
        acquisitionDate,
        depreciationMonths,
        notes,
        isDepreciable:
          assetType === NON_CURENT_ASSETS_TYPE.VEHICLE ||
          assetType === NON_CURENT_ASSETS_TYPE.BUILDING, // Only vehicles and buildings are depreciable
        depreciationValue: Math.ceil(depreciationValue), // Calculate depreciation value if applicable
        notes,
        depreciationActive: assetType === NON_CURENT_ASSETS_TYPE.VEHICLE ||
          assetType === NON_CURENT_ASSETS_TYPE.BUILDING, // Only vehicles and buildings are depreciable
      });

      return asset;
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const asset = await Tm_Non_Current_Assets.findByPk(id);
      if (!asset) {
        throw {
          code: 404,
          message: "Asset not found",
        };
      }
      return asset;
    } catch (error) {
      throw error;
    }
  }

  static async update(id, data) {
    try {
      const asset = await Tm_Non_Current_Assets.findByPk(id);
      if (!asset) {
        throw new Error("Asset not found");
      }
      const {
        name,
        assetValue,
        assetType,
        acquisitionDate,
        depreciationMonths,
        notes = null,
      } = data;

      const depreciationValue =
        NON_CURENT_ASSETS_TYPE.VEHICLE === assetType ||
        NON_CURENT_ASSETS_TYPE.BUILDING === assetType
          ? assetValue / depreciationMonths
          : 0;

      const updatedData = {
        name,
        assetValue,
        assetType,
        acquisitionDate,
        depreciationMonths,
        notes,
        isDepreciable:
          assetType === NON_CURENT_ASSETS_TYPE.VEHICLE ||
          assetType === NON_CURENT_ASSETS_TYPE.BUILDING,
        depreciationValue: Math.ceil(depreciationValue), // Calculate depreciation value if applicable
      };

      await asset.update(updatedData);
      return asset;
    } catch (error) {
      throw error;
    }
  }

  static async checkDepreciationActive(date = null, transaction) {
    try {
      const assets = await Tm_Non_Current_Assets.findAll({
        where: {
          isDepreciable: true,
          depreciationActive: true,
        },
      });

      // Use provided date or current date
      const checkDate = date ? new Date(date) : new Date();
      const assetsShouldBeInactive = [];

      assets.forEach((asset) => {
        const acquisitionDate = new Date(asset.acquisitionDate);

        // Calculate months passed based on year and month difference only
        const acquisitionYear = acquisitionDate.getFullYear();
        const acquisitionMonth = acquisitionDate.getMonth();
        const checkYear = checkDate.getFullYear();
        const checkMonth = checkDate.getMonth();

        // Calculate total months passed (ignoring specific dates)
        // From 2025-01-01 to 2025-02-01 = 1 month passed
        const monthsPassed =
          (checkYear - acquisitionYear) * 12 + (checkMonth - acquisitionMonth);

        // Check if depreciation period has ended
        // If monthsPassed + 1 >= depreciationMonths, then depreciation should be inactive
        // Example: asset bought Jan 2025 with 2 months depreciation
        // - In Jan 2025: monthsPassed = 0, monthsPassed + 1 = 1 < 2 (still active)
        // - In Feb 2025: monthsPassed = 1, monthsPassed + 1 = 2 >= 2 (should be inactive, last month)
        // - In Mar 2025: monthsPassed = 2, monthsPassed + 1 = 3 >= 2 (should be inactive)
        const shouldBeInactive = monthsPassed + 1 >= asset.depreciationMonths;

        if (shouldBeInactive) {
          assetsShouldBeInactive.push({
            id: asset.id,
            name: asset.name,
            assetValue: asset.assetValue,
            assetType: asset.assetType,
            isDepreciable: asset.isDepreciable,
            depreciationActive: asset.depreciationActive, // Current status (still active)
            shouldBeActive: false, // Should be inactive
            acquisitionDate: asset.acquisitionDate,
            depreciationMonths: asset.depreciationMonths,
            depreciationValue: asset.depreciationValue,
            monthsPassed: monthsPassed,
            notes: asset.notes,
          });
        }
      });

      await Tm_Non_Current_Assets.update(
        { depreciationActive: false },
        {
          where: {
            id: assetsShouldBeInactive.map((asset) => asset.id),
          },
          transaction: transaction,
        }
      );

      return {
        totalAssetsChecked: assets.length,
        assetsShouldBeInactive: assetsShouldBeInactive,
        totalAssetsShouldBeInactive: assetsShouldBeInactive.length,
      };
    } catch (error) {
      throw error;
    }
  }

}

module.exports = MasterNonCurrentAssetService;

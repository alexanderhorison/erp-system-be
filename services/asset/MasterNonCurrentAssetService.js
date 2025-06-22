const { NON_CURENT_ASSETS_TYPE } = require("../../const/NonCurrentAssetType");
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
}

module.exports = MasterNonCurrentAssetService;

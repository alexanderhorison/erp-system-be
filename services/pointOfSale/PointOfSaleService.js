const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Warehouse_Product,
  Master_Product,
  Master_Company,
  Master_Unit,
  Master_Product_Price,
  Master_Warehouse_Rack,
} = require("../../models");
const { Op } = require("sequelize");

class PointOfSaleService {
  static async addOrRemoveFavorite(data) {
    try {
      const { productId, warehouseId, isFavorite } = data;

      const warehouseProduct = await Warehouse_Product.findOne({
        where: {
          productId,
          warehouseId,
        },
      });

      if (!warehouseProduct) {
        throwValidation(400, `Produk tidak ditemukan`);
      }

      // Favorite true add to favorit
      if (isFavorite) {
        await Warehouse_Product.update(
          {
            isFavorite: true,
          },
          {
            where: {
              productId,
              warehouseId,
            },
          }
        );
      } else {
        // remove from favorite
        await Warehouse_Product.update(
          {
            isFavorite: false,
          },
          {
            where: {
              productId,
              warehouseId,
            },
          }
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
  static async getPointOfSaleProductByWarehouse({ warehouseId }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId, // Filter by warehouseId
        },
        attributes: [
          "productId", // Only select productId to make it distinct
          [sq.fn("MIN", sq.col("Warehouse_Product.id")), "productWarehouseId"], // Use MIN(id) to get one record per productId
          "isFavorite",
        ],
        include: [
          {
            model: Master_Product,
            attributes: ["name", "companyId", "categoryId", "typeId"],
            include: [
              {
                model: Master_Company,
                attributes: ["name"],
              },
            ],
          },
        ],
        // order: [['productId', 'ASC']],
        group: [
          "productId", // Group by productId only
          "Master_Product.id", // Include required fields for joins
          "isFavorite",
          "Master_Product->Master_Company.id",
        ],
      });

      const formatData = data.map((item, index) => ({
        id: item.get("productWarehouseId"),
        isFavorite: item.isFavorite,
        productName: item.Master_Product.name,
        companyName: item.Master_Product.Master_Company.name,
        companyId: item.Master_Product.companyId,
        productId: item.productId,
        categoryId: item.Master_Product.categoryId,
        typeId: item.Master_Product.typeId,
      }));

      return formatData;
    } catch (error) {
      throw error;
    }
  }

  static async getAllProductByProductId({ warehouseId, productId }) {
    try {
      const data = await Warehouse_Product.findAll({
        where: {
          warehouseId, // Filter by warehouseId
          productId,
        },
        include: [
          {
            model: Master_Product,
            attributes: ["name", "companyId"],
            include: [
              {
                model: Master_Company,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
          {
            model: Master_Warehouse_Rack,
            attributes: ["name"],
          },
        ],
      });

      // Extract productId and unitId combinations from `data`
      const productUnitPairs = data.map((item) => ({
        productId: item.productId,
        unitId: item.unitId,
      }));

      // Fetch all relevant prices in one query
      const prices = await Master_Product_Price.findAll({
        where: {
          [Op.or]: productUnitPairs, // Sequelize's `Op.or` for array of conditions
        },
      });

      // Build a map for quick price lookup
      const priceMap = {};
      prices.forEach((price) => {
        priceMap[`${price.productId}_${price.unitId}`] = price.basePrice;
      });

      // Format the data using the pre-fetched price map
      const formatData = data.map((item) => {
        const basePrice = priceMap[`${item.productId}_${item.unitId}`] || 0;

        return {
          id: item.id,
          isFavorite: item.isFavorite,
          productName: item.Master_Product.name,
          companyName: item.Master_Product.Master_Company.name,
          companyId: item.Master_Product.companyId,
          productId: item.productId,
          unitName: item.Master_Unit.name,
          rackName: item.Master_Warehouse_Rack.name,
          quantity: item.quantity,
          basePrice,
        };
      });

      return formatData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PointOfSaleService;

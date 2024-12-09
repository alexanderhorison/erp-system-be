const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Warehouse_Product,
  Master_Product,
  Master_Company,
} = require("../../models");

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
          [
            sq.fn("MIN", sq.col("Warehouse_Product.id")),
            "productWarehouseId",
          ], // Use MIN(id) to get one record per productId
          "isFavorite",
        ],
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
        productWarehouseId: item.get("productWarehouseId"),
        isFavorite: item.isFavorite,
        productName: item.Master_Product.name,
        companyName: item.Master_Product.Master_Company.name,
        companyId: item.Master_Product.companyId,
        productId: item.productId,
      }));

      return formatData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PointOfSaleService;

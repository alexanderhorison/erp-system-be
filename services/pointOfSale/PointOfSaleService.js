const { throwValidation } = require("../../helpers/responses");
const { sequelize: sq, Warehouse_Product } = require("../../models");

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
}

module.exports = PointOfSaleService;

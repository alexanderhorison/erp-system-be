const {
  Master_Unit,
  Master_Product,
  Master_Product_Price,
} = require("../../models");

class MasterDataProductPriceService {
  static async createOrUpdate(data, user) {
    try {
      const { name, description } = data;

      const existingType = await Master_Type.findOne({
        where: { name: name },
      });

      if (existingType) {
        throw {
          code: 400,
          message: "Nama Tipe sudah ada dalam database",
        };
      }

      return Master_Type.create({
        name: name,
        description: description,
      });
    } catch (error) {
      throw error;
    }
  }

  static async findAll(payload) {
    try {
      const units = await Master_Unit.findAll();

      const existingPrices = await Master_Product_Price.findAll({
        where: { productId: payload.productId },
        include: [Master_Product, Master_Unit],
      });

      const result = units.map((unit) => {
        // Find if this unit has an existing price for the product
        const existingPrice = existingPrices.find(
          (price) => price.unitId === unit.id
        );

        return {
          productId: payload.productId,
          productName: payload.productName,
          unitId: unit.id,
          unitName: unit.name, // Assuming Master_Unit has a 'name' column
          basePrice: existingPrice ? existingPrice.basePrice : 0,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductPriceService;

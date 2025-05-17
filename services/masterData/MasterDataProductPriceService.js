const {
  Master_Unit,
  Master_Product,
  Master_Product_Price,
  Master_Modal,
} = require("../../models");

class MasterDataProductPriceService {
  static async createOrUpdate(data) {
    try {
      const { productId, unitId, basePrice } = data;

      const existingRecord = await Master_Product_Price.findOne({
        where: {
          productId: productId,
          unitId: unitId,
        },
      });

      if (existingRecord) {
        await existingRecord.update({
          basePrice: basePrice,
        });
        return;
      } else {
        const newRecord = await Master_Product_Price.create({
          productId: productId,
          unitId: unitId,
          basePrice: basePrice,
        });

        return;
      }
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

      const masterModal = await Master_Modal.findAll({
        where: { productId: payload.productId },
        include: [Master_Product, Master_Unit],
      });

      const result = units.map((unit, index) => {
        // Find if this unit has an existing price for the product
        const existingPrice = existingPrices.find(
          (price) => price.unitId === unit.id
        );

        const existingModal = masterModal.find(
          (modal) => modal.unitId === unit.id
        );

        return {
          id: index + 1,
          unitId: unit.id,
          unitName: unit.name, // Assuming Master_Unit has a 'name' column
          basePrice: existingPrice ? existingPrice.basePrice : 0,
          masterModal: existingModal ? existingModal.modal : 0,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
  static async findOne(data) {
    try {
      const { productId, unitId } = data;

      const existingRecord = await Master_Product_Price.findOne({
        where: {
          productId: productId,
          unitId: unitId,
        },
        attributes: ["id", "basePrice"],
      });

      return existingRecord ? existingRecord : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataProductPriceService;

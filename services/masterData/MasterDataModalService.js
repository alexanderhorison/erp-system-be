const { Master_Modal, Master_Product, Master_Unit } = require("../../models");

class MasterDataModalService {
  static async getOnePriceModal(query) {
    try {
      const { productId, unitId } = query;

      const existingModal = await Master_Modal.findOne({
        where: { productId, unitId },
        attributes: ["id", "modal"]
      });
      
      return existingModal ? existingModal : null;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = MasterDataModalService;

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
      const { 
        productId, 
        page = 1, 
        pageSize = 10, 
        search = "",
        sortBy = "unitName",
        sortOrder = "ASC"
      } = payload;

      const units = await Master_Unit.findAll();

      const existingPrices = await Master_Product_Price.findAll({
        where: { productId: productId },
        include: [Master_Product, Master_Unit],
      });

      const masterModal = await Master_Modal.findAll({
        where: { productId: productId },
        include: [Master_Product, Master_Unit],
      });

      let result = units.map((unit, index) => {
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
          unitName: unit.name,
          basePrice: existingPrice ? existingPrice.basePrice : 0,
          masterModal: existingModal ? existingModal.modal : 0,
        };
      });

      // Apply search filter
      if (search) {
        result = result.filter(item => 
          item.unitName.toLowerCase().includes(search.toLowerCase())
        );
      }

      // Define valid sort fields
      const validSortFields = ['unitName', 'basePrice', 'masterModal'];
      const orderField = validSortFields.includes(sortBy) ? sortBy : 'unitName';
      const orderDirection = sortOrder.toUpperCase() === 'ASC' ? 1 : -1;

      // Apply sorting
      result.sort((a, b) => {
        if (orderField === 'unitName') {
          return orderDirection * a[orderField].localeCompare(b[orderField]);
        }
        return orderDirection * (a[orderField] - b[orderField]);
      });

      // Apply pagination
      const total = result.length;
      const startIndex = (parseInt(page) - 1) * parseInt(pageSize);
      const endIndex = startIndex + parseInt(pageSize);
      const paginatedResult = result.slice(startIndex, endIndex);

      return {
        data: paginatedResult,
        pagination: {
          total: total,
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          totalPages: Math.ceil(total / parseInt(pageSize)),
        },
      };
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

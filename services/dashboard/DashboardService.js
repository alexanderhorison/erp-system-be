const { throwValidation } = require("../../helpers/responses");
const {
  Master_Product,
  Master_Category,
  Master_Unit,
  Master_Warehouse,
  Warehouse_Product,
  Master_Warehouse_Rack,
  Master_Type,
  Master_Company,
  sequelize: sq,
} = require("../../models");
const { Op } = require("sequelize");

class DashboardService {
  static async minimumStock() {
    try {
      // get product from all warehouse that close to minimum stock
      const getWarehouseProduct = await Warehouse_Product.findAll({
        where: {
          quantity: {
            [Op.lte]: sq.col("minimumStock"),
          },
        },
        attributes: ["id", "quantity", "minimumStock"],
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
            include: [
              { model: Master_Category, attributes: ["name"] },
              { model: Master_Type, attributes: ["name"] },
              { model: Master_Company, attributes: ["name"] },
            ],
          },
          { model: Master_Unit, attributes: ["name"] },
          { model: Master_Warehouse, attributes: ["name"] },
          { model: Master_Warehouse_Rack, attributes: ["name"] },
        ],
        limit: 10,
      });

      let result = [];
      if (getWarehouseProduct.length > 0) {
        result = getWarehouseProduct.map((item) => {
          return {
            productWarehouseId: item.id,
            productName: item.Master_Product.name,
            categoryName: item.Master_Product.Master_Category.name,
            typeName: item.Master_Product.Master_Type.name,
            unitName: item.Master_Unit.name,
            warehouseName: item.Master_Warehouse.name,
            rackName: item?.Master_Warehouse_Rack?.name,
            quantity: item.quantity,
            minimumStock: item.minimumStock,
            companyName: item?.Master_Product?.Master_Company?.name,
          };
        });
      }

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DashboardService;

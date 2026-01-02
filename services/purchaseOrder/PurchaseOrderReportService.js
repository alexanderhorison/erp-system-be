const {
  Master_Product,
  Master_Unit,
  Master_Company,
  Master_Warehouse,
  Warehouse_Product,
  Purchase_Order,
  Purchase_Order_Detail,
  Master_Vendor,
  Purchase_Order_Barter_Detail,
} = require("../../models");
const { Op } = require("sequelize");

class PurchaseOrderReportService {
  static async getDataReportPo({ query }) {
    try {
      const allData = await Purchase_Order.findAll({
        where: {
          status: "APPROVED",
          approvedAt: {
            [Op.between]: [query.startDate, query.endDate],
          },
        },
        include: [
          {
            model: Master_Vendor,
            attributes: ["name"],
          },
          {
            model: Purchase_Order_Detail,
            include: [
              {
                model: Warehouse_Product,
                paranoid: false, // Include deleted records if needed
                attributes: ["id"],
                include: [
                  {
                    model: Master_Product,
                    attributes: ["id", "name", "companyId"], // Fetch product details
                    include: [
                      {
                        model: Master_Company,
                        attributes: ["id", "name"], // Fetch company details
                      },
                    ],
                  },
                  { model: Master_Unit, attributes: ["id", "name"] }, // Fetch unit details
                  {
                    model: Master_Warehouse,
                    attributes: ["id", "name"],
                  }, // Fetch warehouse details
                ],
              },
            ],
          },
          {
            model: Purchase_Order_Barter_Detail,
            include: [
              {
                model: Warehouse_Product,
                paranoid: false,
                include: [
                  {
                    model: Master_Product,
                    paranoid: false,
                    attributes: ["id", "name"],
                  },
                ],
              },
            ],
          },
        ],
        order: [["approvedAt", "ASC"]],
      });

      return allData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = PurchaseOrderReportService;

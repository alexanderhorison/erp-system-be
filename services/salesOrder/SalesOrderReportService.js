const {
  Master_Product,
  Master_Unit,
  Master_Company,
  Master_Warehouse,
  Warehouse_Product,
  Sales_Order,
  Sales_Order_Detail,
  Master_Customer,
} = require("../../models");
const { Op } = require("sequelize");

class SalesOrderReportService {
  static async getDataReportSo({ query }) {
    try {
      const allData = await Sales_Order.findAll({
        where: {
          status: "APPROVED",
          approvedAt: {
            [Op.between]: [query.startDate, query.endDate],
          },
        },
        include: [
          {
            model: Master_Customer,
            attributes: ["name", "alias"],
          },
          {
            model: Sales_Order_Detail,
            include: [
              {
                model: Warehouse_Product,
                paranoid: false, // Include deleted records if needed
                attributes: ["id"],
                include: [
                  {
                    model: Master_Product,
                    attributes: ["id", "name"], // Fetch product details
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
        ],
        order: [["approvedAt", "ASC"]],
      });

      return allData;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = SalesOrderReportService;

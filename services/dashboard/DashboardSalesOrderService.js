const { throwValidation } = require("../../helpers/responses");
const {
  Dashboard_Summary_Customer,
  Master_Customer,
  Sales_Order,
  Sales_Order_Barter_Details,
  Master_User,
  Master_Role,
  sequelize: sq,
} = require("../../models");
const { Op } = require("sequelize");
const moment = require("moment");

// 1. DashboardSo1: Top 5 Customer yang total nominal SO nya paling bnyk
// 2. DashboardSo2: Top 5 Customer yang total surat SO nya paling bnyk
// 3. DashboardSo3: Top 5 Customer yang total hutang SO nya paling bnyk
// 4. DashboardSo4: Top 5 Customer yang total barter SO nya paling bnyk

// 5. DashboardSo5: Grafik x = date , y = nominal SO per gudang

// 6. DashboardSo6: List 10 SO yang sudah lewat due date nya → pagination

class DashboardSalesOrderService {
  // 1. DashboardSo1: Top 5 Customer yang total nominal SO nya paling bnyk
  static async getDashboardSo1() {
    try {
      const data = await Dashboard_Summary_Customer.findAll({
        limit: 5,
        order: [["totalAmountSalesOrder", "DESC"]],
        include: [
          {
            model: Master_Customer,
            attributes: ["name"],
          },
        ],
      });
      const result = data.map((item) => {
        return {
          customerName: item.Master_Customer.name,
          totalNominal: item.totalAmountSalesOrder,
        };
      });
      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 2. DashboardSo2: Top 5 Customer yang total surat SO nya paling bnyk
  static async getDashboardSo2() {
    try {
      const data = await Sales_Order.findAll({
        attributes: [
          ["customerId", "id"],
          [sq.fn("COUNT", "id"), "totalSo"],
        ],
        group: ["customerId", "Master_Customer.id"],
        include: [
          {
            model: Master_Customer,
            attributes: ["name"],
          },
        ],
        order: [["totalSo", "DESC"]],
        limit: 5,
      });

      const result = data.map((item) => {
        return {
          customerName: item?.Master_Customer?.name,
          totalSo: item?.dataValues?.totalSo,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 3. DashboardSo3: Top 5 Customer yang total hutang SO nya paling bnyk
  static async getDashboardSo3() {
    try {
      const data = await Dashboard_Summary_Customer.findAll({
        limit: 5,
        order: [["totalAmountDebtSalesOrder", "DESC"]],
        include: [
          {
            model: Master_Customer,
            attributes: ["name"],
          },
        ],
      });
      const result = data.map((item) => {
        return {
          customerName: item.Master_Customer.name,
          totalNominalDebt: item.totalAmountDebtSalesOrder,
        };
      });
      return result;
    } catch (error) {
      console.log(error);
      throwValidation(error.code, error.message);
    }
  }
  // 4. DashboardSo4: Top 5 Customer yang total barter SO nya paling bnyk
  static async getDashboardSo4() {
    try {
      const data = await Master_Customer.findAll({
        attributes: ["name"],
        include: [
          {
            model: Sales_Order,
            attributes: ["id"],
            required: true,
            include: [
              {
                model: Sales_Order_Barter_Details,
                attributes: ["id"],
                required: true,
              },
            ],
          },
        ],
        limit: 5,
      });

      let result = data?.map((item) => {
        return {
          customerName: item.name,
          totalSoBarter: item.Sales_Orders.length,
        };
      });

      result = result?.sort((a, b) => b.totalSoBarter - a.totalSoBarter) || [];

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 6. DashboardSo6: List 10 SO yang sudah lewat due date nya → pagination
  static async getDashboardSo6({ query }) {
    try {
      const defaultQuery = {
        limit: query?.limit || 10,
        offset: (query?.page || 1 - 1) * 10,
      };
      const dateNow = moment(new Date()).format("DD/MM/yyyy");
      const data = await Sales_Order.findAndCountAll({
        where: { status: "PENDING" },
        include: [
          {
            model: Master_Customer,
            attributes: ["name"],
          },
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
          },
        ],
        limit: defaultQuery.limit,
        offset: defaultQuery.offset,
        order: [["dueDate", "ASC"]],
      });

      let result = [];
      data?.rows?.forEach((item) => {
        const tempDate = item?.dueDate?.split("/");
        const dueDate = `${tempDate[1]}/${tempDate[0]}/${tempDate[2]}`;
        if (dueDate > dateNow) {
          result.push({
            id: item.id,
            code: item.code,
            dueDate: dueDate,
            creatorName: item?.creator?.name,
            creatorRole: item?.creator?.Master_Role?.name,
            createdAt: item?.createdAt,
          });
        }
      });
      result = result?.sort((a, b) => new Date(a.dueDate) - new Date()) || [];
      const totalPages = Math.ceil(data?.count / defaultQuery.limit);
      return {
        totalPage: totalPages,
        totalData: data?.count,
        data: result,
      };
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDashboardMenuSalesOrder() {
    try {
      const countPaid = await Sales_Order.count({
        where: {
          status: "APPROVED",
          amountDebt: 0,
        },
      });

      const countDebt = await Sales_Order.count({
        where: {
          status: "APPROVED",
          amountDebt: {
            [Op.ne]: 0,
          },
        },
      });

      return {
        countPaid,
        countDebt,
      };
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
}

module.exports = DashboardSalesOrderService;

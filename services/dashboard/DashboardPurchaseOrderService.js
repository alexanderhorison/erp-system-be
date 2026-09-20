const { throwValidation } = require("../../helpers/responses");
const {
  Dashboard_Summary_Vendor,
  Master_Vendor,
  Purchase_Order,
  Purchase_Order_Barter_Detail,
  Master_User,
  Master_Role,
  sequelize: sq,
} = require("../../models");
const { Op } = require("sequelize");
const { formatDateFromString } = require("../../helpers/formatDate");

// 1. DashboardPo1: Top 5 Vendor yang total nominal PO nya paling bnyk
// 2. DashboardPo2: Top 5 Vendor yang total surat PO nya paling bnyk
// 3. DashboardPo3: Top 5 Vendor yang total hutang PO nya paling bnyk
// 4. DashboardPo4: Top 5 Vendor yang total barter PO nya paling bnyk

// 5. DashboardPo5: Grafik x = date , y = nominal PO per gudang

// 6. DashboardPo6: List 10 PO yang sudah lewat due date nya → pagination

class DashboardPurchaseOrderService {
  // 1. DashboardPo1: Top 5 Vendor yang total nominal PO nya paling bnyk
  static async getDashboardPo1() {
    try {
      const data = await Dashboard_Summary_Vendor.findAll({
        limit: 5,
        order: [["totalAmountPurchaseOrder", "DESC"]],
        include: [
          {
            model: Master_Vendor,
            attributes: ["name"],
          },
        ],
      });
      const result = data.map((item) => {
        return {
          vendorName: item.Master_Vendor.name,
          totalNominal: item.totalAmountPurchaseOrder,
        };
      });
      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 2. DashboardPo2: Top 5 Vendor yang total surat PO nya paling bnyk
  static async getDashboardPo2() {
    try {
      const data = await Purchase_Order.findAll({
        attributes: [
          ["vendorId", "id"],
          [sq.fn("COUNT", "id"), "totalPo"],
        ],
        group: ["vendorId", "Master_Vendor.id"],
        include: [
          {
            model: Master_Vendor,
            attributes: ["name"],
          },
        ],
        order: [["totalPo", "DESC"]],
        limit: 5,
      });

      const result = data.map((item) => {
        return {
          vendorName: item?.Master_Vendor?.name,
          totalPo: item?.dataValues?.totalPo,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 3. DashboardPo3: Top 5 Vendor yang total hutang PO nya paling bnyk
  static async getDashboardPo3() {
    try {
      const data = await Dashboard_Summary_Vendor.findAll({
        limit: 5,
        order: [["totalAmountDebtPurchaseOrder", "DESC"]],
        include: [
          {
            model: Master_Vendor,
            attributes: ["name"],
          },
        ],
      });
      const result = data.map((item) => {
        return {
          vendorName: item.Master_Vendor.name,
          totalNominalDebt: item.totalAmountDebtPurchaseOrder,
        };
      });
      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 4. DashboardPo4: Top 5 Vendor yang total barter PO nya paling bnyk
  static async getDashboardPo4() {
    try {
      const data = await Master_Vendor.findAll({
        attributes: ["name"],
        include: [
          {
            model: Purchase_Order,
            attributes: ["id"],
            required: true,
            include: [
              {
                model: Purchase_Order_Barter_Detail,
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
          vendorName: item.name,
          totalPoBarter: item.Purchase_Orders.length,
        };
      });

      result = result?.sort((a, b) => b.totalPoBarter - a.totalPoBarter) || [];

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }
  // 6. DashboardPo6: List 10 PO yang sudah lewat due date nya → pagination
  static async getDashboardPo6({ query }) {
    try {
      const limit = query?.limit || 10;
      const page = query?.page || 1;

      // `dueDate` is a plain "DD/MM/YYYY" string column, so "already overdue"
      // can't be expressed as a SQL where-clause (this is why SQL-level
      // limit/offset were disabled below) — every PENDING order (matching
      // the search) is fetched, filtered/sorted in JS, and THEN paginated in
      // JS, so totalData/totalPage always match the rows actually returned
      // for a page.
      const data = await Purchase_Order.findAll({
        where: {
          status: "PENDING",
          ...(query?.search && { code: { [Op.iLike]: `%${query.search}%` } }),
        },
        include: [
          {
            model: Master_Vendor,
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
        //! Disable karena datenya masih string
        // limit: defaultQuery.limit,
        // offset: defaultQuery.offset,
      });

      let result = [];
      data?.forEach((item) => {
        const dueDate = formatDateFromString(item?.dueDate);
        if (new Date(dueDate) < new Date()) {
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

      result = result.sort((a, b) => {
        const dateA = new Date(a.dueDate); // Parses MM/DD/YYYY correctly
        const dateB = new Date(b.dueDate); // Parses MM/DD/YYYY correctly
        return dateA - dateB; // Ascending order
      });

      const totalData = result.length;
      const totalPages = Math.ceil(totalData / limit);
      const pagedResult = result.slice((page - 1) * limit, (page - 1) * limit + limit);

      return {
        totalPage: totalPages,
        totalData,
        data: pagedResult,
      };
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async getDashboardMenuPurchaseOrder() {
    try {
      const countPaid = await Purchase_Order.count({
        where: {
          status: "APPROVED",
          amountDebt: 0,
        },
      });

      const countDebt = await Purchase_Order.count({
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

module.exports = DashboardPurchaseOrderService;

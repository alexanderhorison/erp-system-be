const { formatDate } = require("../../helpers/formatDate");
const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Master_User,
  Sales_Order,
  Sales_Order_Payment,
  Dashboard_Summary_Customer,
} = require("../../models");

class SalesOrderPaymentService {
  static async getAll({ salesOrderId }) {
    try {
      const allData = await Sales_Order_Payment.findAll({
        where: {
          salesOrderId,
        },
        include: [
          {
            model: Master_User,
            as: "creator",
            attributes: ["name"],
          },
        ],
        order: [["createdAt", "ASC"]],
      });

      const sendData = allData.map((item) => {
        return {
          id: item.id,
          typePayment: item.typePayment,
          amount: item.amount,
          notes: item?.notes,
          createdBy: {
            name: item?.creator?.name,
          },
          createdAt: item?.createdAt,
          dateCreated: formatDate(item?.createdAt),
        };
      });

      return sendData;
    } catch (error) {
      throw error;
    }
  }

  static async create({ data, user }) {
    const transaction = await sq.transaction();
    try {
      /**
       * 1. find sales order
       *    - Cek apakah sales order sudah selesai untuk dilakukan payment dan statusnya approved
       * 2. cek amountDebt sales order
       *    - Jika ada amount debt bandingkan dengan jumlah pembayaran
       *    - Jika tidak ada amount debt maka tidak bisa lakukan pembayaran
       * 3. Jika ada pembayaran dilakukan update amountDebt dan amountPaid sales order
       */

      const salesOrder = await Sales_Order.findOne({
        where: {
          id: data.salesOrderId,
        },
      });

      if (!salesOrder) {
        throwValidation(404, "Data tidak ditemukan");
      } else if (salesOrder?.status !== "APPROVED") {
        throwValidation(
          400,
          "Tidak bisa melakukan pembayaran karna status sales order tidak approved"
        );
      } else if (salesOrder?.amountDebt === 0) {
        throwValidation(
          400,
          "Tidak bisa melakukan pembayaran karna sales order ini sudah lunas"
        );
      } else if (salesOrder?.amountDebt < data.amount) {
        throwValidation(
          400,
          `Mohon masukkan jumlah pembayaran sesuai sisa yang harus dibayar`
        );
      }

      const createdPayment = await Sales_Order_Payment.create(
        {
          typePayment: data.typePayment,
          amount: data.amount,
          notes: data.notes,
          salesOrderId: data.salesOrderId,
          createdBy: user.id,
        },
        { transaction }
      );

      let amountPaid = Number(salesOrder.amountPaid) + Number(data.amount);
      let amountDebt = Number(salesOrder.amountDebt) - Number(data.amount);

      await Sales_Order.update(
        {
          amountPaid,
          amountDebt,
        },
        {
          where: {
            id: salesOrder.id,
          },
          transaction,
        }
      );

      // UPDATE DASHBOARD CUSTOMER SUMMARY
      const findCustomerSummary = await Dashboard_Summary_Customer.findOne({
        where: {
          customerId: salesOrder?.customerId,
        },
      });

      if (!findCustomerSummary) {
        throwValidation(404, `Customer Summary tidak ditemukan`);
      }

      /**
       * 1. reduce total amount debt from payment
       * 2. sum total amount paid from payment
       */
      await Dashboard_Summary_Customer.update(
        {
          totalAmountDebtSalesOrder: Number(findCustomerSummary.totalAmountDebtSalesOrder) - Number(data.amount),
          totalAmountPaidSalesOrder: Number(findCustomerSummary.totalAmountPaidSalesOrder) + Number(data.amount)
        },
        {
          where: {
            id: findCustomerSummary?.id,
          },
          transaction,
        }
      );

      await transaction.commit();
      return createdPayment;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = SalesOrderPaymentService;

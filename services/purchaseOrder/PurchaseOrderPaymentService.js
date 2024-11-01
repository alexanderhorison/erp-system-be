const { formatDate } = require("../../helpers/formatDate");
const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Master_User,
  Purchase_Order_Payment,
  Purchase_Order,
  Dashboard_Summary_Vendor,
} = require("../../models");

class PurchaseOrderPaymentService {
  static async getAll({ purchaseOrderId }) {
    try {
      const allData = await Purchase_Order_Payment.findAll({
        where: {
          purchaseOrderId,
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
       * 1. find purchase order
       *    - Cek apakah purchase order sudah selesai untuk dilakukan payment dan statusnya approved
       * 2. cek amountDebt purchase order
       *    - Jika ada amount debt bandingkan dengan jumlah pembayaran
       *    - Jika tidak ada amount debt maka tidak bisa lakukan pembayaran
       * 3. Jika ada pembayaran dilakukan update amountDebt dan amountPaid purchase order
       */

      const purchaseOrder = await Purchase_Order.findOne({
        where: {
          id: data.purchaseOrderId,
        },
      });

      if (!purchaseOrder) {
        throwValidation(404, "Data tidak ditemukan");
      } else if (purchaseOrder?.status !== "APPROVED") {
        throwValidation(
          400,
          "Tidak bisa melakukan pembayaran karna status purchase order tidak approved"
        );
      } else if (purchaseOrder?.amountDebt === 0) {
        throwValidation(
          400,
          "Tidak bisa melakukan pembayaran karna purchase order ini sudah lunas"
        );
      } else if (purchaseOrder?.amountDebt < data.amount) {
        throwValidation(
          400,
          `Mohon masukkan jumlah pembayaran sesuai sisa yang harus dibayar`
        );
      }

      const createdPayment = await Purchase_Order_Payment.create(
        {
          typePayment: data.typePayment,
          amount: data.amount,
          notes: data.notes,
          purchaseOrderId: data.purchaseOrderId,
          createdBy: user.id,
        },
        { transaction }
      );

      let amountPaid = Number(purchaseOrder.amountPaid) + Number(data.amount);
      let amountDebt = Number(purchaseOrder.amountDebt) - Number(data.amount);

      await Purchase_Order.update(
        {
          amountPaid,
          amountDebt,
        },
        {
          where: {
            id: purchaseOrder.id,
          },
          transaction,
        }
      );

      // UPDATE DASHBOARD VENDOR SUMMARY
      const findVendorSummary = await Dashboard_Summary_Vendor.findOne({
        where: {
          vendorId: purchaseOrder?.vendorId,
        },
      });

      if (!findVendorSummary) {
        throwValidation(404, `Vendor Summary tidak ditemukan`);
      }

      /**
       * 1. reduce total amount debt from payment
       * 2. sum total amount paid from payment
       */
      await Dashboard_Summary_Vendor.update(
        {
          totalAmountDebtPurchaseOrder:
            Number(findVendorSummary.totalAmountDebtPurchaseOrder) -
            Number(data.amount),
          totalAmountPaidPurchaseOrder:
            Number(findVendorSummary.totalAmountPaidPurchaseOrder) +
            Number(data.amount),
        },
        {
          where: {
            id: findVendorSummary?.id,
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

module.exports = PurchaseOrderPaymentService;

const {
  sequelize: sq,
  Pr_Orders,
  Pr_Order_Details,
  Master_User,
  Master_Role,
  Master_Product,
  Master_Unit,
  Delivery_Order
} = require("../../models");

const { throwValidation } = require("../../helpers/responses");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");
const { formatDate } = require("../../helpers/formatDate");
const { codeGenerator } = require("../../helpers/codeGenerator");
const { STATUS } = require("../../helpers/statusHelper");
const DeliveryOrderService = require("../deliveryOrder/DeliveryOrderService");
const { ROLES } = require("../../const/roles");

class ProductRequestOrderService {
  static async createProductRequest(payload) {
    const transaction = await sq.transaction();
    try {
      const { data, user } = payload;

      const code = await codeGenerator(8, "PRO");

      const productOrder = {
        status: "PENDING",
        notes: data.notes || "",
        createdBy: user.id,
        code: code,
      };

      // BUAT PRODUCT REQUEST ORDER
      const productRequestOrder = await Pr_Orders.create(
        productOrder,
        { transaction }
      );

      const listProduct = data.data;

      const listProductRequest = [];

      for await (const item of listProduct) {
        listProductRequest.push({
          ...item,
          productRequestOrderId: productRequestOrder.id,
        });
      }
      // BULK INSERT PRODUCT REQUEST ORDER
      await Pr_Order_Details.bulkCreate(listProductRequest, { transaction });

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throwValidation(error.code, error.message);
    }
  }

  static async getAllProductRequest(payload) {
    try {
      const isPosLayout = payload?.query?.isPosLayout === 'true' || payload?.query?.isPosLayout === true;
      const statusOrder = payload?.query?.statusOrder;

      const queryOption = {
        where: {},
        include: [
          {
            model: Master_User,
            paranoid: false,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
            as: "creator",
          },
          {
            model: Master_User,
            paranoid: false,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
            as: "approver",
          },
        ],
        order: [["createdAt", "DESC"]],
      };

      // Add status filter if provided [PENDING, COMPLETED, REJECTED]
      if (statusOrder) {
        queryOption.where.status = STATUS[statusOrder] || "PENDING";
      }

      // Add createdBy filter if isPosLayout is true and user is not admin
      if (isPosLayout && payload.userData?.id && payload.userData?.roleId !== ROLES.ADMIN) {
        queryOption.where.createdBy = payload.userData?.id;
      }

      const data = await Pr_Orders.findAll(queryOption);

      const result = data.map((item) => {
        const plain = item.get({ plain: true });
        delete plain.creator;
        delete plain.approver;
        
        return {
          ...plain,
          approvedAt: formatDate(item.approvedAt),
          createdBy: {
            id: item.creator?.id,
            name: item.creator?.name,
            roleName: item.creator?.Master_Role?.name,
          },
          approvedBy: {
            name: item.approver?.name || null,
            roleName: item.approver?.Master_Role?.name || null,
          },
          dateCreated: formatDate(item.createdAt),
          dateApproved: item.approvedAt,
        };
      });

      return result;
    } catch (error) {
      throwValidation(error.code, error.message);
    }
  }

  static async reject({ code, user }) {
    try {
      const exsistingData = await Pr_Orders.findOne({
        where: {
          code: code,
        },
      });

      switch (exsistingData?.status) {
        case STATUS.APPROVED:
          throwValidation(400, "Data sudah di approve");
        case STATUS.REJECTED:
          throwValidation(400, "Data sudah di reject");
        default:
          if (!exsistingData) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }

      const rejectedData = await Pr_Orders.update(
        {
          status: STATUS.REJECTED,
          approvedBy: user?.id,
          approvedAt: new Date(),
        },
        {
          where: {
            code: code,
          },
        }
      );

      return rejectedData;
    } catch (error) {
      throw error;
    }
  }

  static async getDetailByCode(code) {
    try {
      const exsistingData = await Pr_Orders.findOne({
        where: {
          code: code,
        },
        include: [
          {
            model: Master_User,
            paranoid: false,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
            as: "creator",
          },
          {
            model: Master_User,
            paranoid: false,
            attributes: ["id", "name"],
            include: [
              {
                model: Master_Role,
                attributes: ["name"],
              },
            ],
            as: "approver",
          },
        ],
      });

      if (!exsistingData) {
        throwValidation(400, "Data tidak ditemukan");
      }

      const listProducts = await Pr_Order_Details.findAll({
        include: [
          { model: Master_Product, attributes: ["id", "name"] },
          { model: Master_Unit, attributes: ["id", "name"] },
        ],
        where: {
          productRequestOrderId: exsistingData.id,
        },
      });

      const plain = exsistingData.get({ plain: true });
      delete plain.creator;
      const result = {
        ...plain,
        approvedAt: formatDate(exsistingData.approvedAt),
        createdBy: {
          name: exsistingData.creator.name,
          roleName: exsistingData.creator.Master_Role.name,
        },
        dateCreated: formatDate(exsistingData.createdAt),
        dateApproved: exsistingData.approvedAt,
        listProducts: listProducts.map((item) => {
          const plainItem = item.get({ plain: true });
          delete plainItem.Master_Product;
          delete plainItem.Master_Unit;
          return {
            ...plainItem,
            productName: item.Master_Product.name,
            unitName: item.Master_Unit.name,
          };
        }),
        warehouseDestination: "GUDANG DEPAN", // hardcode gudang depan
        warehouseDestinationId: 6, // hardcode id gudang depan
      };

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async updateProductRequestOrder({ code, data }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Pr_Orders.findOne({
        where: {
          code: code,
        },
      });

      switch (exsistingData?.status) {
        case STATUS.APPROVED:
          throwValidation(400, "Data sudah di approve");
        case STATUS.REJECTED:
          throwValidation(400, "Data sudah di reject");
        default:
          if (!exsistingData) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }

      const listProductRequest = [];

      for (const item of data.data) {
        listProductRequest.push({
          ...item,
          productRequestOrderId: exsistingData.id,
        });
      }

      await Pr_Order_Details.destroy({
        where: {
          productRequestOrderId: exsistingData.id,
        },
        transaction, // put it here
      })

      await Pr_Order_Details.bulkCreate(listProductRequest, { transaction });

      await exsistingData.update(
        {
          notes: data.notes,
        },
        { transaction }
      );

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async processProductRequestOrder({ data, user }) {
    const transaction = await sq.transaction();
    try {
      const exsistingData = await Pr_Orders.findOne({
        where: {
          code: data.code,
        },
      });

      // validate status product request
      switch (exsistingData?.status) {
        case STATUS.APPROVED:
          throwValidation(400, "Data sudah di approve");
        case STATUS.REJECTED:
          throwValidation(400, "Data sudah di reject");
        default:
          if (!exsistingData) {
            throwValidation(400, "Data tidak ditemukan");
          }
      }

      // 2. Group items by warehouseId
      const groupedByWarehouse = {};
      for (const item of data.data) {
        // skip the item if quantity give is 0 or dont have productWarehouseId
        if (item.qtyGive <= 0 || !item.productWarehouseId) continue;
        if (!groupedByWarehouse[item.warehouseId]) {
          groupedByWarehouse[item.warehouseId] = [];
        }
        groupedByWarehouse[item.warehouseId].push(item);
      }

      // 3. Create Delivery Orders for each warehouse
      for (const [warehouseId, products] of Object.entries(groupedByWarehouse)) {
        const deliveryOrderPayload = {
          warehouseOriginId: Number(warehouseId),
          warehouseDestinationId: data.warehouseDestinationId,
          notes: data.notes,
          productRequestOrderId: exsistingData.id,
          data: products.map((p) => ({
            productWarehouseId: p.productWarehouseId,
            qty: p.qtyGive, // ✅ use qtyGive here
          })),
        };

        await DeliveryOrderService.createDeliveryOrder({
          data: deliveryOrderPayload,
          user,
        }, transaction);
      }

      // UPDATE STATUS PRODUCT REQUEST ORDER
      await exsistingData.update(
        {
          status: STATUS.APPROVED,
          approvedBy: user?.id,
          approvedAt: new Date(),
        },
        { transaction }
      );

      await transaction.commit();
      return;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static async getProcessProductRequestOrder(code) {
    try {
      const getDetail = await this.getDetailByCode(code);

      // find delivery orders related to this product request order
      const deliveryOrders = await Delivery_Order.findAll({
        where: {
          productRequestOrderId: getDetail.id,
        },
      });
      console.log(deliveryOrders);
      return { ...getDetail, deliveryOrderCode: deliveryOrders.map(d => d.code) };
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ProductRequestOrderService;


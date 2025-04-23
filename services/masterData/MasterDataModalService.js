const { Op } = require("sequelize");
const {
  sequelize: sq,
  Master_Modal,
  Master_Product,
  Master_Unit,
  Purchase_Order,
  Purchase_Order_Detail,
  Warehouse_Product,
  Stock_Opname,
  Stock_Opname_Product,
  Sales_Order,
  Sales_Order_Barter_Details,
  Sales_Order_Detail,
  Master_Product_Transformation,
  Master_Customer,
} = require("../../models");

const moment = require("moment");

const ExcelJS = require("exceljs");

class MasterDataModalService {
  static async getOnePriceModal(query) {
    try {
      const { productId, unitId } = query;

      const existingModal = await Master_Modal.findOne({
        where: { productId, unitId },
        attributes: ["id", "modal"],
      });

      return existingModal ? existingModal : null;
    } catch (error) {
      throw error;
    }
  }

  static async mappingSO(query) {
    try {
      /*
        check semua SO barang apa aja yang ga ada modalnya, 
          Mintol farhad minggu ini selesai untuk modal
          Kalau bisa yang januari aja, gausah tunggu harga modal dengan asumsi di PO Januari jadi harga modal
          Ketika buat SO dan modal kosong, asumsi udah ada , tapi tetep kasi kasi list ke alex
          Yang penting script selesai dan asumsi udah ada harga modal semuanya
          Di minggu ini 
       */

      const { date_from, date_to } = query;

      const semua_so = await Sales_Order.findAll({
        where: {
          approvedAt: {
            [Op.between]: [date_from, date_to],
          },
          status: "APPROVED",
        },
        include: [
          {
            model: Sales_Order_Detail,
            include: [
              {
                model: Warehouse_Product,
                paranoid: false,
                include: [
                  {
                    model: Master_Product,
                  },
                  {
                    model: Master_Unit,
                  },
                ],
              },
            ],
          },
          {
            model: Master_Customer,
            attributes: ["name"],
          },
        ],
      });

      const maping_so = [];

      semua_so.forEach((so) => {
        let temp = {
          so_id: so.id,
          so_code: so.code,
          so_date: so.approvedAt,
          so_status: so.status,
          so_subtotal: so.subTotal,
          so_discount: so.discount,
          so_total: so.total,
          so_total_tax: so.totalTax,
          customer_name: so.Master_Customer.name,
          list_so_detail: [],
        };

        so.Sales_Order_Details.forEach((detail) => {
          temp.list_so_detail.push({
            so_detail_id: detail.id,
            so_detail_quantity: detail.quantity,
            so_detail_price: +detail.price,
            so_detail_subtotal: +detail.subTotal,
            product_id: detail.Warehouse_Product?.productId,
            product_name: detail.Warehouse_Product.Master_Product.name,
            unit_id: detail.Warehouse_Product.unitId,
            unit_name: detail.Warehouse_Product.Master_Unit.name,
            modal: detail.modal,
          });
        });

        maping_so.push(temp);
      });

      let result = maping_so.map((so) => {
        return {
          so_date: so.so_date,
          so_code: so.so_code,
          customer_name: so.customer_name,
          list_so_detail: so.list_so_detail.map((detailSo) => {
            return {
              so_detail_id: detailSo.so_detail_id,
              so_qty: detailSo.so_detail_quantity,
              so_price: detailSo.so_detail_price,
              so_subtotal: detailSo.so_detail_subtotal,
              product_name: detailSo.product_name,
              unit_name: detailSo.unit_name,
              product_id: detailSo.product_id,
              unit_id: detailSo.unit_id,
              modal: detailSo.modal,
            };
          }),
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }

  static async mappingPO(query) {
    try {
      const { date_from, date_to } = query;
      const semua_po = await Purchase_Order.findAll({
        where: {
          approvedAt: {
            [Op.between]: [date_from, date_to],
          },
          status: "APPROVED",
        },
        include: [
          {
            model: Purchase_Order_Detail,
            include: [
              {
                model: Warehouse_Product,
                paranoid: false,
                include: [
                  {
                    model: Master_Product,
                  },
                  {
                    model: Master_Unit,
                  },
                ],
              },
            ],
          },
        ],
      });

      const mapping_po = [];

      semua_po.forEach((po) => {
        let temp = {
          po_id: po.id,
          po_code: po.code,
          po_date: po.approvedAt,
          po_status: po.status,
          po_subtotal: po.subTotal,
          po_discount: po.discount,
          po_total: po.total,
          po_total_tax: po.totalTax,
          list_po_detail: [],
        };

        po.Purchase_Order_Details.forEach((detail) => {
          temp.list_po_detail.push({
            po_detail_id: detail.id,
            po_detail_quantity: detail.quantity,
            po_detail_price: +detail.price,
            po_detail_subtotal: +detail.subTotal,
            product_id: detail.Warehouse_Product?.productId,
            product_name: detail.Warehouse_Product.Master_Product.name,
            unit_id: detail.Warehouse_Product.unitId,
            unit_name: detail.Warehouse_Product.Master_Unit.name,
            modal: detail.modal,
          });
        });

        mapping_po.push(temp);
      });

      mapping_po.sort((b, a) => {
        return b.po_date - a.po_date;
      });

      let result = mapping_po.map((po) => {
        return {
          po_date: po.po_date,
          list_po_detail: po.list_po_detail.map((detailPo) => {
            return {
              po_qty: detailPo.po_detail_quantity,
              po_price: detailPo.po_detail_price,
              po_subtotal: detailPo.po_detail_subtotal,
              product_id: detailPo.product_id,
              unit_id: detailPo.unit_id,
            };
          }),
        };
      });
      //! BARTER GA MASUK KARENA GA ADA BARTER DI AWAL 2025
      return result;
    } catch (error) {
      throw error;
    }
  }

  // INI MASUKIN MODAL KE SO
  static async migratePriceModal(query) {
    try {
      const { date_from, date_to } = query;

      const dataSO = await MasterDataModalService.mappingSO({
        date_from,
        date_to,
      });
      const dataPO = await MasterDataModalService.mappingPO({
        date_from,
        date_to,
      });

      // Urutkan PO berdasarkan tanggal dan waktu secara ascending
      let sortedPO = dataPO.sort(
        (a, b) => new Date(a.po_date) - new Date(b.po_date)
      );

      // Grup data PO berdasarkan product_id dan unit_id, kemudian urutkan berdasarkan tanggal
      // untuk mendapatkan harga terbaru sebelum tanggal SO
      let productModalHistory = {};
      sortedPO.forEach((po) => {
        po.list_po_detail.forEach((detail) => {
          const key = `${detail.product_id}-${detail.unit_id}`;
          if (!productModalHistory[key]) {
            productModalHistory[key] = [];
          }

          // Tambahkan entry baru dengan tanggal dan harga modal
          productModalHistory[key].push({
            date: new Date(po.po_date),
            modal: detail.po_subtotal / detail.po_qty,
            total_qty: detail.po_qty,
            total_subtotal: detail.po_subtotal,
            productIdFromPo: detail.product_id,
            unitIdFromPo: detail.unit_id,
          });
        });
      });

      // Sort each product's history by date
      Object.keys(productModalHistory).forEach((key) => {
        productModalHistory[key].sort((a, b) => a.date - b.date);
      });

      // Untuk aggregasi total & transformasi (kalau diperlukan)
      let aggregatedPO = {};
      sortedPO.forEach((po) => {
        po.list_po_detail.forEach((detail) => {
          const key = `${detail.product_id}-${detail.unit_id}`;
          if (!aggregatedPO[key]) {
            aggregatedPO[key] = {
              total_qty: 0,
              total_subtotal: 0,
              last_price: 0,
              last_date: null,
            };
          }
          aggregatedPO[key].total_qty += detail.po_qty;
          aggregatedPO[key].total_subtotal += detail.po_subtotal;
          aggregatedPO[key].last_price = detail.po_price;
          aggregatedPO[key].last_date = po.po_date;
          aggregatedPO[key].productIdFromPo = detail.product_id;
          aggregatedPO[key].unitIdFromPo = detail.unit_id;
        });
      });

      const arrayAgregatedPO = [];
      Object.keys(aggregatedPO).forEach((key) => {
        const tempsData = aggregatedPO[key];
        arrayAgregatedPO.push({
          ...tempsData,
        });
      });

      // Mapping SO dan menambahkan modal
      let mapping_so = [];

      for (const so of dataSO) {
        let temp = {};
        temp.so_date = so.so_date;
        temp.so_code = so.so_code;
        temp.customer_name = so.customer_name;
        temp.list_so_detail = [];
        temp.total_modal = 0;
        temp.total_gain_loss = 0;

        const soDate = new Date(so.so_date);

        for await (const detailSo of so.list_so_detail) {
          const key = `${detailSo.product_id}-${detailSo.unit_id}`;
          let modal;

          // Cari modal berdasarkan PO terakhir sebelum tanggal SO
          if (productModalHistory[key]) {
            // Filter history entries yang tanggalnya sebelum tanggal SO
            const priorEntries = productModalHistory[key].filter(
              (entry) => entry.date <= soDate
            );

            if (priorEntries.length > 0) {
              // Ambil entry terakhir (terbaru) sebelum tanggal SO
              const latestPriorEntry = priorEntries[priorEntries.length - 1];
              modal = latestPriorEntry.modal;
            }
          }

          // Jika tidak ada history PO untuk product-unit ini, coba transformasi
          if (!modal && aggregatedPO[key]) {
            modal =
              aggregatedPO[key].total_subtotal / aggregatedPO[key].total_qty;
          } else if (!modal) {
            const findProductPo = arrayAgregatedPO.find(
              (po) => po.productIdFromPo === detailSo.product_id
            );
            if (findProductPo) {
              const findTransformation =
                await Master_Product_Transformation.findOne({
                  where: {
                    masterProductId: detailSo.product_id,
                    unitToId: detailSo.unit_id,
                    unitFromId: findProductPo?.unitIdFromPo,
                  },
                });

              if (findTransformation) {
                let sumModal =
                  +findProductPo.total_subtotal / +findProductPo.total_qty; // Transformasi dari PO = 19,800,000 harga modal karton (Mencari harga rata2 dari PO per product yang unitnya dari PO)
                sumModal = +sumModal / +findTransformation.amountTo; // Harga modal per bal (19,800,000 / 4) = 4,950,000 sesuai dengan unit tujuan yang di transformasi
                modal = sumModal;
              }
            }
          }

          //! Ini produk yang ga pernah di PO tapi di SO (STATIC REQUEST HARGA DARI MICHAEL)
          if (!modal) {
            if (detailSo.so_detail_id === 499) modal = 2900000;
            if (
              (detailSo.so_detail_id === 532) |
              (detailSo.so_detail_id === 566) |
              (detailSo.so_detail_id === 603)
            )
              modal = 3190000;
          }
          if (detailSo.so_detail_id === 427) {
            console.log("detailSo", detailSo);
            console.log("modal", modal);
          }
          //! ====================================
          temp.total_modal += Math.ceil(modal * detailSo.so_qty);
          temp.total_gain_loss += Math.ceil(
            (detailSo.so_price - modal) * detailSo.so_qty
          );

          temp.list_so_detail.push({
            so_detail_id: detailSo.so_detail_id,
            so_qty: detailSo.so_qty,
            so_price: detailSo.so_price,
            so_subtotal: detailSo.so_subtotal,
            product_id: detailSo.product_id,
            unit_id: detailSo.unit_id,
            product_name: detailSo.product_name,
            unit_name: detailSo.unit_name,
            modal: Math.ceil(modal),
            gainLoss: Math.ceil(detailSo.so_price - modal),
          });
        }
        mapping_so.push(temp);
      }
      return mapping_so;
    } catch (error) {
      throw error;
    }
  }

  // untuk insert modal ke SO dan SO Detail
  static async insertModalToSO(query) {
    const transaction = await sq.transaction();
    try {
      const { date_from, date_to } = query;
      const data = await MasterDataModalService.migratePriceModal({
        date_from,
        date_to,
      });

      for (const so of data) {
        for (const detail of so.list_so_detail) {
          await Sales_Order_Detail.update(
            { modal: detail.modal, gainLoss: detail.gainLoss * detail.so_qty },
            { where: { id: detail.so_detail_id }, transaction }
          );
        }
      }

      for (const so of data) {
        const soCode = so.so_code;
        const totalModal = so.total_modal;
        const totalGainLoss = so.total_gain_loss;
        await Sales_Order.update(
          {
            totalModal,
            totalGainLoss,
          },
          { where: { code: soCode }, transaction }
        );
      }
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  // untuk update modal di master modal
  static async updateMasterModal(query) {
    const transaction = await sq.transaction();
    try {
      const { date_from, date_to } = query;

      // Get aggregated PO data and transformation data
      const dataPO = await MasterDataModalService.mappingPO({
        date_from,
        date_to,
      });

      // Sort PO by date ascending
      let sortedPO = dataPO.sort(
        (a, b) => new Date(a.po_date) - new Date(b.po_date)
      );

      // Aggregate PO data by product and unit
      let aggregatedPO = {};
      sortedPO.forEach((po) => {
        po.list_po_detail.forEach((detail) => {
          const key = `${detail.product_id}-${detail.unit_id}`;
          if (!aggregatedPO[key]) {
            aggregatedPO[key] = {
              productId: detail.product_id,
              unitId: detail.unit_id,
              quantity: 0,
              amountPurchaseOrder: 0,
              totalPurchaseOrder: 0,
            };
          }
          aggregatedPO[key].quantity += detail.po_qty;
          // amountPurchaseOrder is the total nominal value of the PO
          aggregatedPO[key].amountPurchaseOrder += detail.po_subtotal;
          // totalPurchaseOrder is the count of POs created
          aggregatedPO[key].totalPurchaseOrder += 1;
        });
      });

      // Calculate modal (average price) for each product-unit combination
      Object.keys(aggregatedPO).forEach((key) => {
        const data = aggregatedPO[key];
        data.modal = Math.ceil(data.amountPurchaseOrder / data.quantity);
      });

      // Get transformation data from SO that might not be in PO
      const dataSO = await MasterDataModalService.migratePriceModal({
        date_from,
        date_to,
      });

      // Extract transformation data from SO
      const transformationModalData = {};
      dataSO.forEach((so) => {
        so.list_so_detail.forEach((detail) => {
          const key = `${detail.product_id}-${detail.unit_id}`;

          // If this product-unit doesn't exist in aggregatedPO, it might be from transformation
          if (!aggregatedPO[key] && detail.modal) {
            if (!transformationModalData[key]) {
              transformationModalData[key] = {
                productId: detail.product_id,
                unitId: detail.unit_id,
                quantity: 0,
                amountPurchaseOrder: 0,
                modal: detail.modal,
                totalPurchaseOrder: 0,
              };
            }

            transformationModalData[key].quantity += detail.so_qty;
            // For transformations, amountPurchaseOrder will be modal * quantity
            transformationModalData[key].amountPurchaseOrder += Math.ceil(detail.modal * detail.so_qty);
            // totalPurchaseOrder remains 0 for transformations as they weren't part of a PO
          }
        });
      });

      // Combine both datasets
      const combinedModalData = { ...aggregatedPO, ...transformationModalData };
      // Upsert Master_Modal records
      for (const key of Object.keys(combinedModalData)) {
        const data = combinedModalData[key];
        const exsistingModal = await Master_Modal.findOne({
          where: {
            productId: data.productId,
            unitId: data.unitId,
          },
        });
        if (exsistingModal) {
          await Master_Modal.update(
            {
              quantity: data.quantity,
              amountPurchaseOrder: data.amountPurchaseOrder,
              modal: data.modal,
              totalPurchaseOrder: data.totalPurchaseOrder,
            },
            {
              where: {
                productId: data.productId,
                unitId: data.unitId,
              },
              transaction,
            }
          )
        }
        else {
          await Master_Modal.create(
            {
              productId: data.productId,
              unitId: data.unitId,
              quantity: data.quantity,
              amountPurchaseOrder: data.amountPurchaseOrder,
              modal: data.modal,
              totalPurchaseOrder: data.totalPurchaseOrder,
            },
            { transaction }
          );
        }
      }
      await transaction.commit();
      return true;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

module.exports = MasterDataModalService;

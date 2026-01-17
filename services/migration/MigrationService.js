const {
  sequelize: sq,
  Stock_Adjustment_History,
  Warehouse_Product,
  Purchase_Order,
  Purchase_Order_Payment,
  Dashboard_Summary_Vendor,
  Master_Vendor,
  Sales_Order,
  Sales_Order_Payment,
  Dashboard_Summary_Customer,
  Master_Customer,
  Master_Product_Price,
  Master_Product,
  Master_Unit,
} = require("../../models");
const { Op } = require("sequelize");
const fs = require("fs");
const path = require('path');

class MigrationService {
  static async apiMigration(migrationName) {
    const transaction = await sq.transaction();
    try {
      const result = []
      switch (migrationName) {
        case "MIGRATION LAST QUANTITY":
          /**
           * data product warehouse id = get all stock adjustment history distinct by product warehouse id
           * loop data product warehouse id
           *  - Find stock adjustment history by product warehouse id (ASC)
           *    - if type minus -> last quantity - quantity
           *    - if type plus -> last quantity + quantity
           *    Update current id (last quantity based on formula)
           *  - Get current quantity right now in warehouse product compare with last quantity
           */
          console.log("masuk migrasi last quantity");

          // Find All Stock in stock adjustment History
          const findAllStock = await Stock_Adjustment_History.findAll({
            attributes: [
              [
                sq.fn("DISTINCT", sq.col("productWarehouseId")),
                "productWarehouseId",
              ],
            ],
            group: ["productWarehouseId"],
            raw: true,
          });

          // Loop data stock
          for (let i = 0; i < findAllStock.length; i++) {
            const productWarehouseId = findAllStock[i].productWarehouseId;

            // find productWarehouse to get current quantity
            const productWarehouse = await Warehouse_Product.findOne({
              attributes: ["quantity"],
              where: {
                id: productWarehouseId,
              },
              raw: true,
            });

            if (!productWarehouse) {
              continue;
            }

            const currentQuantity = await this.processStockAdjustmentHistory(
              productWarehouseId,
              transaction
            );

            // Make sure quantity is same
            if (currentQuantity !== productWarehouse.quantity) {
              throw {
                code: 400,
                message: `Mismatch in quantity for productWarehouseId: ${productWarehouseId}. Expected: ${productWarehouse.quantity}, Found: ${currentQuantity}`,
              };
            }
          }
          break;
        case "MIGRATION UPDATE PAYMENT":
          // Update all PO and SO payment to full status paid 31 july
          /**
           * 1. PO Payment
           *   - Find all Purchase Order with (status approved, according to date, amount debt > 0)
           *   - Create Payment in Purchase_Order_Payment with type cash
           *   - update purchase order paid and debt
           *   - update dashboard vendor
           */
          const resultDataPo = [];
          const resultDataSo = [];
          console.log("masuk migrasi update payment so&po");
          const endDate = new Date("2025-07-31T23:59:59.999Z");

          const getPoData = await Purchase_Order.findAll({
            where: {
              status: "APPROVED",
              amountDebt: {
                [Op.gt]: 0,
              },
              approvedAt: {
                [Op.lte]: endDate,
              },
            },
            include: [{ model: Master_Vendor, attributes: ["id", "name"] }],
            transaction,
          });
          console.log("getPoData", getPoData.length);

          for (const po of getPoData) {
            const summary = {};
            const amountToPay = Number(po.amountDebt);


            // 2. Create payment record
            const dataPayment = await Purchase_Order_Payment.create(
              {
                typePayment: "CASH",
                amount: amountToPay,
                notes: "Migration payment - full settlement as of 31 July 2025",
                purchaseOrderId: po.id,
                createdBy: 1, // change to system/admin ID if needed
              },
              { transaction }
            );

            // 3. Update PO paid/debt values
            await Purchase_Order.update(
              {
                amountPaid: Number(po.amountPaid) + amountToPay,
                amountDebt: 0,
              },
              {
                where: { id: po.id },
                transaction,
              }
            );

            // 4. Update vendor dashboard summary
            const vendorSummary = await Dashboard_Summary_Vendor.findOne({
              where: { vendorId: po.vendorId },
              transaction,
              lock: transaction.LOCK.UPDATE,
            });

            if (!vendorSummary) {
              console.warn(`Vendor Summary not found for vendorId: ${po.vendorId}`);
              continue;
            }

            await Dashboard_Summary_Vendor.update(
              {
                totalAmountDebtPurchaseOrder:
                  Number(vendorSummary.totalAmountDebtPurchaseOrder) - amountToPay,
                totalAmountPaidPurchaseOrder:
                  Number(vendorSummary.totalAmountPaidPurchaseOrder) + amountToPay,
              },
              {
                where: { id: vendorSummary.id },
                transaction,
              }
            );

            summary.code = po.code;
            summary.Vendor = {
              id: po.vendorId,
              name: po?.Master_Vendor?.name ?? "",
              dashboardVendor: {
                beforeUpdate: vendorSummary.toJSON(),
                afterUpdate: {
                  totalAmountDebtPurchaseOrder: Number(vendorSummary.totalAmountDebtPurchaseOrder) - amountToPay,
                  totalAmountPaidPurchaseOrder: Number(vendorSummary.totalAmountPaidPurchaseOrder) + amountToPay,
                }
              }
            };
            summary.amountDebt = amountToPay;
            summary.paymentData = dataPayment.toJSON();
            resultDataPo.push(summary);
          }

          /**
           * 2. SO Payment
           *   - Find all Sales Order with (status approved, according to date, amount debt > 0)
           *   - Create Payment in PSales_Order_Payment with type cash
           *   - update sales order paid and debt
           *   - update dashboard customer
           */
          const getSoData = await Sales_Order.findAll({
            where: {
              status: "APPROVED",
              amountDebt: {
                [Op.gt]: 0,
              },
              approvedAt: {
                [Op.lte]: endDate,
              },
            },
            include: [{ model: Master_Customer, attributes: ["id", "name"] }],
            order: [["id", "ASC"]],
            transaction,
          });
          console.log("getSoData", getSoData.length);

          for (const so of getSoData) {
            const summary = {};
            const amountToPay = Number(so.amountDebt);

            // 2. Create payment record
            const dataPayment = await Sales_Order_Payment.create(
              {
                typePayment: "CASH",
                amount: amountToPay,
                notes: "Migration payment - full settlement as of 31 July 2025",
                salesOrderId: so.id,
                createdBy: 1, // change to system/admin ID if needed
              },
              { transaction }
            );

            // 3. Update so paid/debt values
            await Sales_Order.update(
              {
                amountPaid: Number(so.amountPaid) + amountToPay,
                amountDebt: 0,
              },
              {
                where: { id: so.id },
                transaction,
              }
            );

            // 4. Update customer dashboard summary
            const customerSummary = await Dashboard_Summary_Customer.findOne({
              where: { customerId: so.customerId },
              transaction,
              lock: transaction.LOCK.UPDATE,
            });

            if (!customerSummary) {
              console.warn(`Customer Summary not found for customerId: ${so.customerId}`);
              continue;
            }

            await Dashboard_Summary_Customer.update(
              {
                totalAmountDebtSalesOrder:
                  Number(customerSummary.totalAmountDebtSalesOrder) - amountToPay,
                totalAmountPaidSalesOrder:
                  Number(customerSummary.totalAmountPaidSalesOrder) + amountToPay,
              },
              {
                where: { id: customerSummary.id },
                transaction,
              }
            );

            summary.code = so.code;
            summary.Customer = {
              id: so.customerId,
              name: so?.Master_Customer?.name ?? "",
              dashboardCustomer: {
                beforeUpdate: customerSummary.toJSON(),
                afterUpdate: {
                  totalAmountDebtSalesOrder: Number(customerSummary.totalAmountDebtSalesOrder) - amountToPay,
                  totalAmountPaidSalesOrder: Number(customerSummary.totalAmountPaidSalesOrder) + amountToPay,
                }
              }
            };
            summary.amountDebt = amountToPay;
            summary.paymentData = dataPayment.toJSON();
            resultDataSo.push(summary);
          }
          result.push({
            DataPo: resultDataPo,
            DataSo: resultDataSo,
          })
          break;
        case "MIGRATION BASE PRICE":
          console.log("masuk migrasi basic price");
          // Update all product & unit base price according to files
          const filePath = path.join(__dirname, '..', '..', 'files', 'BasePrice.csv');
          console.log("Looking for:", filePath);

          const content = fs.readFileSync(filePath, 'utf8');
          const lines = content.trim().split('\n');

          console.log('Total lines to process:', lines.length);

          let dataFailed = [];
          let dataSuccess = [];

          for (let i = 1; i < lines.length; i++) {
            const data = lines[i].split(',');
            const productName = data[0].trim();
            const unit = data[1].trim();
            const basePrice = data[2].trim();
            let message = ""
            
            // /**
            //  * 1. Get Product and unit id by name
            //  * 2. get master product price by product id and unit id
            //  * 3. if exist update, if not create
            //  */
            if (["out", "??"].includes(productName)) {
              message = `Skipping row ${i + 1} due to out product`;
              console.warn(`Skipping row ${i + 1} due to out product ${productName}, ${unit}, ${basePrice}`);
              continue;
            }

            const findProductData = await Master_Product.findOne({
              where: {
                name: productName
              },
              transaction
            });

            const findUnitData = await Master_Unit.findOne({
              where: {
                name: unit
              },
              transaction
            });


            if (!findProductData || !findUnitData) {
              message = `Product or unit not found.`;
              console.warn(`Product or unit not found: ${productName} ${unit}`);
              dataFailed.push({ productName, unit, basePrice, message });
              continue;
            }

            // FIND OR UPDATE
            const existingProduct = await Master_Product_Price.findOne({
              where: {
                productId: findProductData.id,
                unitId: findUnitData.id
              },
              transaction
            })

            if (existingProduct) {
              // skip if base price 0
              if (Number(basePrice) === 0) {
                continue;
              }
              // Update
              await Master_Product_Price.update({
                basePrice: Number(basePrice),
                basePricePos: Number(basePrice)
              }, {
                where: {
                  id: existingProduct.id
                },
                transaction
              })
              dataSuccess.push({ productName, unit, basePrice });
            } else {
              // Create
              await Master_Product_Price.create({
                productId: findProductData.id,
                unitId: findUnitData.id,
                basePrice: Number(basePrice),
                basePricePos: Number(basePrice)
              }, { transaction })

              dataSuccess.push({ productName, unit, basePrice });
            }
          }
          result.push({ dataSuccess, dataFailed });
          break;
        
        case "MIGRATION STOCKS":
          console.log("masuk migrasi stocks");
          /**
           * 1. Find All from Master Produk and Fetch all Master Unit
           * 2. For each product find in ProductWarehouse with each product id with different unit id (ONLY APPLY TO WAREHOUSE ID 6)
           * 3. if ProductWarehouse exist, update quantity into 1000
           * 4. if not exist create the productId with unit id and quantity 1000
           *
           */

          // 1. Find all Master Products and Master Units
          const allProducts = await Master_Product.findAll({
            attributes: ['id', 'name'],
            transaction
          });

          const allUnits = await Master_Unit.findAll({
            attributes: ['id', 'name'],
            transaction
          });

          console.log(`Found ${allProducts.length} products and ${allUnits.length} units`);

          let processedCount = 0;
          let createdCount = 0;
          let updatedCount = 0;

          // 2. For each product, check/create Warehouse_Product for each unit in warehouse ID 6
          for (const product of allProducts) {
            for (const unit of allUnits) {
              // Check if Warehouse_Product exists for this product + unit + warehouse 6
              const existingWarehouseProduct = await Warehouse_Product.findOne({
                where: {
                  productId: product.id,
                  unitId: unit.id,
                  warehouseId: 6
                },
                transaction
              });

              if (existingWarehouseProduct) {
                // 3. If exists, update quantity to 1000
                await Warehouse_Product.update(
                  { quantity: 1000 },
                  {
                    where: { id: existingWarehouseProduct.id },
                    transaction
                  }
                );
                updatedCount++;
                console.log(`Updated product ${product.name} (ID: ${product.id}) with unit ${unit.name} (ID: ${unit.id}) in warehouse 6`);
              } else {
                // 4. If not exist, create with quantity 1000
                await Warehouse_Product.create({
                  productId: product.id,
                  unitId: unit.id,
                  warehouseId: 6,
                  quantity: 1000,
                  warehouseRackId: 1
                }, { transaction });
                createdCount++;
                console.log(`Created product ${product.name} (ID: ${product.id}) with unit ${unit.name} (ID: ${unit.id}) in warehouse 6`);
              }

              processedCount++;
            }
          }

          result.push({
            totalProducts: allProducts.length,
            totalUnits: allUnits.length,
            totalCombinations: allProducts.length * allUnits.length,
            processedCount,
            createdCount,
            updatedCount,
            message: `Migration completed for warehouse ID 6. Created ${createdCount} new warehouse products, updated ${updatedCount} existing ones.`
          });
          break;
        default:
          break;
      }
      await transaction.commit();
      return result;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  static getQuantityValue(quantity, historyQuantity, type) {
    let result = 0;
    if (type === "PLUS") {
      result = quantity + historyQuantity;
    } else if (type === "MINUS") {
      result = quantity - historyQuantity;
    } else if (type === "INITIATE") {
      result = historyQuantity;
    }
    return result;
  }

  static async processStockAdjustmentHistory(productWarehouseId, transaction) {
    // find stock adjustment history by productWarehouseId
    const findStockWarehouse = await Stock_Adjustment_History.findAll({
      where: {
        productWarehouseId: productWarehouseId,
      },
      order: [["id", "ASC"]],
      raw: true,
    });

    let currentQuantity = 0;

    for (let j = 0; j < findStockWarehouse.length; j++) {
      const data = findStockWarehouse[j];

      // if index j = 0 straight update lastQuantity
      if (j == 0) {
        // First must be initiate
        await Stock_Adjustment_History.update(
          {
            lastQuantity: data.quantity,
          },
          { where: { id: data.id }, transaction }
        );
        // Set Current Quantity based on initiate
        currentQuantity = this.getQuantityValue(
          currentQuantity,
          data.quantity,
          data.adjustmentType
        );
      } else {
        // Perform math quantity based on adjustment type (PLUS or MINUS)
        currentQuantity = this.getQuantityValue(
          currentQuantity,
          data.quantity,
          data.adjustmentType
        );

        await Stock_Adjustment_History.update(
          {
            lastQuantity: currentQuantity,
          },
          { where: { id: data.id }, transaction }
        );
      }
    }

    return currentQuantity;
  }
}

module.exports = MigrationService;

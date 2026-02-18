const { throwValidation } = require("../../helpers/responses");
const {
  sequelize: sq,
  Master_Product,
  Master_Type,
  Master_Category,
  Warehouse_Product,
  Master_Unit,
  Master_Warehouse,
  Master_Product_Transformation,
  Stock_Adjustment_History,
  Master_Warehouse_Rack,
  Master_Modal,
} = require("../../models");
const StockAdjustmentHistoryService = require("../stockAdjustmentHistory/StockAdjustmentHistoryService");

class ProductWarehouseTransformationService {
  static async getAllListTransformationByProductWarehouseId(id) {
    try {
      const dataProduct = await Warehouse_Product.findOne({
        where: {
          id,
        },
        attributes: ["productId", "unitId"]
      })

      if (!dataProduct) {
        throw {
          code: 404,
          message: "Produk tidak ditemukan",
        }
      }

      const listData = await Master_Product_Transformation.findAll({
        where: {
          masterProductId: dataProduct.productId,
          unitFromId: dataProduct.unitId,
        },
        include: [
          {
            model: Master_Unit,
            as: "unitFrom"
          },
          {
            model: Master_Unit,
            as: "unitTo"
          }
        ]
      })

      return listData
    } catch (error) {
      throw error
    }
  }

  static async transformProduct({ id, data, user }) {
    const transaction = await sq.transaction();
    try {
      const transformationData = await Master_Product_Transformation.findOne({
        where: {
          id: data.masterTransformationId
        }
      })

      const originProduct = await Warehouse_Product.findOne({
        where: {
          id: id,
        }
      });

      const destinationProduct = await Warehouse_Product.findOne({
        where: {
          productId: originProduct.productId,
          unitId: transformationData.unitToId,
          warehouseId: originProduct.warehouseId,
        },
        include: [
          {
            model: Master_Warehouse_Rack,
            attributes: ["id", "name"],
          },
          {
            model: Master_Unit,
            attributes: ["id", "name"],
          },
          {
            model: Master_Product,
            paranoid: false,
            include: [
              {
                model: Master_Category,
                paranoid: false,
              },
            ],
          },
        ]
      })

      let result = {}

      // VALIDASI: Cek transformationData ada
      if (!transformationData) {
        throwValidation(400, "Data transformasi tidak ditemukan");
      }

      // VALIDASI: Cek originProduct ada
      if (!originProduct) {
        throwValidation(400, "Produk asal tidak ditemukan di warehouse");
      }

      // VALIDASI: qtyTransformation harus minimal 1 amountFrom
      if (Number(data.qtyTransformation) < Number(transformationData.amountFrom)) {
        throwValidation(
          400,
          `Jumlah transformasi minimal ${transformationData.amountFrom} unit untuk dapat dikonversi`
        );
      }

      // VALIDASI: qtyTransformation harus kelipatan amountFrom
      if (Number(data.qtyTransformation) % Number(transformationData.amountFrom) !== 0) {
        throwValidation(
          400,
          `Jumlah transformasi harus kelipatan ${transformationData.amountFrom}`
        );
      }

      // VALIDASI: Stok unit asal harus cukup untuk ditransformasi
      if (Number(originProduct.quantity) < Number(data.qtyTransformation)) {
        throwValidation(
          400,
          `Stok unit asal tidak cukup untuk ditransformasi. Stok saat ini: ${originProduct.quantity}, dibutuhkan: ${data.qtyTransformation}`
        );
      }

      // KURANGI PRODUCT AWAL
      originProduct.quantity -= data.qtyTransformation
      await originProduct.save({ transaction });
      await StockAdjustmentHistoryService.createOne({
        data: originProduct,
        user,
        adjustmentType: "MINUS",
        quantity: data.qtyTransformation,
        info: "TRANSFORMATION PRODUCT",
        description: transformationData?.info,
        lastQuantity: originProduct.quantity,
        transaction,
      });

      // Find Master Modal Origin
      const modalOrigin = await Master_Modal.findOne({
        where: {
          productId: originProduct.productId,
          unitId: originProduct.unitId
        }
      })

      // Jika Base modal asal tidak ada throw error
      if (!modalOrigin) {
        throwValidation(400, "Data base modal pada produk asal tidak ditemukan, silahkan buat po terlebih dahulu untuk mendapatkan base modal")
      }
      // Find Master Modal Destination
      const modalDestination = await Master_Modal.findOne({
        where: {
          productId: originProduct.productId,
          unitId: transformationData.unitToId,
        }
      })

      /**
         * Quantity Modal Tujuan -> (data transformasi / Amount konversi asal) *  total qty konversi rumus tujuan
         * Harga Modal Tujuan -> Harga modal asal / quantity Rumus Transform unit
         * Harga total purchase Order -> Harga Modal Tujuan * Jumlah Quantity produk yang di transformasi
         */
      const hasilQuantityTransformation = (Number(data.qtyTransformation) / Number(transformationData.amountFrom)) * Number(transformationData.amountTo)
      let newQuantityDestination = hasilQuantityTransformation
      let newModalDestination;

      // Menentukan Modal Tujuan
      if (transformationData?.amountTo == 1) {
        // Jika transformasi dari kecil ke besar
        newModalDestination = Math.round(
          Number(modalOrigin?.modal) * Number(transformationData?.amountFrom)
        );
      } else if (transformationData?.amountTo != 1) {
        // jika transformasi dari besar ke kecil
        newModalDestination = Math.round(
          Number(modalOrigin?.modal) / Number(transformationData?.amountTo)
        );
      }

      let newAmountPurchaseOrder = Number(newModalDestination) * Number(newQuantityDestination)

      // Process Calculate Base Modal For Transformation
      if (modalDestination) {
        // Jika modal tujuan ada maka kalkulasi rumus
        /**
         * Quantity Baru -> quantity produk lama + quantity produk baru
         * Amount Purchase Order Baru -> total PO lama + total Amount PO baru
         * Modal Baru -> amount PO Baru / Quantity Baru
         */
        newQuantityDestination = Number(modalDestination?.quantity) + Number(newQuantityDestination)
        newAmountPurchaseOrder = Number(modalDestination?.amountPurchaseOrder) + Number(newAmountPurchaseOrder)
        newModalDestination = Math.round(
          Number(newAmountPurchaseOrder) / Number(newQuantityDestination)
        );

        await Master_Modal.update(
          {
            quantity: newQuantityDestination,
            amountPurchaseOrder: newAmountPurchaseOrder,
            modal: newModalDestination,
          },
          {
            where: {
              id: modalDestination?.id,
            },
            transaction,
          }
        );

      } else {
        // jika modal destinasi tidak ada maka buat baru
        await Master_Modal.create(
          {
            productId: originProduct.productId,
            unitId: transformationData.unitToId,
            quantity: hasilQuantityTransformation, // total quantity transformasi
            amountPurchaseOrder: newAmountPurchaseOrder, // total harga modal * quantity transformation
            modal: newModalDestination, // harga modal Asal / quantity transformation tujuan
            totalPurchaseOrder: 0, // Iniate 
          },
          { transaction }
        );

      }
      if (destinationProduct) {
        // FOR SALES ORDER
        result = {
          warehouseProductId: destinationProduct.id,
          quantity: hasilQuantityTransformation,
          qty: destinationProduct.quantity + hasilQuantityTransformation,
          masterProductId: originProduct.productId,
          rackName: destinationProduct.Master_Warehouse_Rack.name,
          unitName: destinationProduct.Master_Unit.name,
          masterUnitId: destinationProduct.Master_Unit.id,
          productName: `${destinationProduct.Master_Product.name} - ${destinationProduct.Master_Unit.name}`,
          categoryName: destinationProduct.Master_Product.Master_Category.name,
          productWarehouseId: destinationProduct.id
        }
        // PRODUCT SUDAH ADA
        // TAMBAHKAN PRODUCT TUJUAN
        destinationProduct.quantity += hasilQuantityTransformation
        await destinationProduct.save({ transaction });
        await StockAdjustmentHistoryService.createOne({
          data: destinationProduct,
          user,
          adjustmentType: "PLUS",
          quantity: hasilQuantityTransformation,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          lastQuantity: destinationProduct.quantity,
          transaction,
        });
      } else {
        // PRODUCT BELUM ADA
        // BUAT PRODUCT TUJUAN
        const newDestinationProduct = await Warehouse_Product.create({
          productId: originProduct.productId,
          warehouseId: originProduct.warehouseId,
          quantity: hasilQuantityTransformation,
          unitId: transformationData.unitToId,
          minimumStock: 1,
          // Jika produk baru maka tambahkan ke rack product origin
          warehouseRackId: data.warehouseRackId,
        }, { transaction })

        const product = await Warehouse_Product.findOne({
          where: {
            id: newDestinationProduct.id
          },
          include: [
            {
              model: Master_Warehouse_Rack,
              attributes: ["id", "name"],
            },
            {
              model: Master_Unit,
              attributes: ["id", "name"],
            },
            {
              model: Master_Product,
              paranoid: false,
              include: [
                {
                  model: Master_Category,
                  paranoid: false,
                },
              ],
            },
          ],
          transaction
        })

        result = {
          warehouseProductId: newDestinationProduct.id,
          quantity: hasilQuantityTransformation,
          qty: newDestinationProduct.quantity,
          masterProductId: originProduct.productId,
          rackName: product.Master_Warehouse_Rack.name,
          unitName: product.Master_Unit.name,
          masterUnitId: product.Master_Unit.id,
          productName: `${product.Master_Product.name} - ${product.Master_Unit.name}`,
          categoryName: product.Master_Product.Master_Category.name,
          productWarehouseId: newDestinationProduct.id
        }

        await StockAdjustmentHistoryService.createOne({
          data: newDestinationProduct,
          user,
          adjustmentType: "INITIATE",
          quantity: hasilQuantityTransformation,
          info: "TRANSFORMATION PRODUCT",
          description: transformationData?.info,
          lastQuantity: hasilQuantityTransformation,
          transaction,
        });
      }
      await transaction.commit();
      return result
    } catch (error) {
      await transaction.rollback();
      throw error
    }
  }
}

module.exports = ProductWarehouseTransformationService
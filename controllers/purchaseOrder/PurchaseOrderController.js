const { responses } = require("../../helpers/responses");
const { yupSchemaValidation } = require("../../helpers/yupSchemaValidation");
const yup = require("yup");
const PurchaseOrderService = require("../../services/purchaseOrder/PurchaseOrderService");

class PurchaseOrderController {
  static async getAllPurchaseOrder(req, res) {
    try {
      const user = req.userData;

      const getAllPurchaseOrder = await PurchaseOrderService.getAll({
        user,
      });

      res.status(200).json(responses(true, "Berhasil", getAllPurchaseOrder));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async createPurchaseOrder(req, res) {
    try {
      const schema = yup.object({
        warehouseId: yup.number().required("Gudang tujuan harus diisi"),
        vendorId: yup.number().required("Vendor harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        grandTotalVendor: yup
          .number()
          .required("Total Purchase order harus ada"),
        grandTotalBarter: yup.number().required("Total Barter harus ada"),
        dueDate: yup.string().required("Tanggal jatuh tempo harus ada"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              masterProductId: yup.number().required("Product id harus diisi"),
              price: yup.number().required("Price product harus diisi"),
              unitId: yup.number().required("Satuan product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
            })
          )
          .required("List sales order produk harus ada"),
        listBarterProduct: yup.lazy((value) => {
          // If there are items in the barterProduct array, require all fields within the objects
          if (value && value.length > 0) {
            return yup.array().of(
              yup.object({
                warehouseProductId: yup
                  .number()
                  .required("Id product warehouse harus diisi"),
                price: yup.number().required("Harga barter harus diisi"),
                quantity: yup.number().required("Kuantiti barter harus diisi"),
                subTotal: yup.number().required("Sub Total barter harus diisi"),
              })
            );
          }
          // If no barter products, make it optional
          return yup
            .array()
            .of(
              yup.object({
                warehouseProductId: yup.number(),
                price: yup.number(),
                quantity: yup.number(),
                subTotal: yup.number(),
              })
            )
            .optional();
        }),
      });

      const body = await yupSchemaValidation(req.body, schema);

      const user = req.userData;

      const createPurchaseOrder = await PurchaseOrderService.create({
        data: body,
        user,
      });

      res
        .status(201)
        .json(
          responses(
            true,
            "Berhasil membuat purchase order",
            createPurchaseOrder
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async approvePurchaseOrder(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code purchase order harus ada"),
        })
        .required("Code purchase order harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const approvePurchaseOrder = await PurchaseOrderService.approve({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(
            true,
            "Berhasil approval purchase order",
            approvePurchaseOrder
          )
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async rejectPurchaseOrder(req, res) {
    try {
      const schemaParams = yup
        .object({
          code: yup.string().required("Code purchase order harus ada"),
        })
        .required("Code purchase order harus ada");

      const params = await yupSchemaValidation(req.params, schemaParams);

      const user = req.userData;

      const rejectPurchaseOrder = await PurchaseOrderService.reject({
        code: params.code,
        user,
      });

      res
        .status(200)
        .json(
          responses(true, "Berhasil reject purchase order", rejectPurchaseOrder)
        );
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async getDetailPurchaseOrder(req, res) {
    try {
      const params = req.params;

      const schemaParams = yup
        .string()
        .required("Code purchase order harus diisi");
      const code = await yupSchemaValidation(params.code, schemaParams);

      const getDetail = await PurchaseOrderService.getDetailByCode(code);

      res.status(200).json(responses(true, "Berhasil", getDetail));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  static async updatePurchaseOrder(req, res) {
    try {
      const schemaParams = yup
        .string()
        .required("Code purchase order harus diisi");

      const schemaBody = yup.object({
        warehouseId: yup.number().required("Gudang tujuan harus diisi"),
        vendorId: yup.number().required("Vendor harus diisi"),
        grandTotal: yup.number().required("Grand Total harus ada"),
        grandTotalVendor: yup
          .number()
          .required("Total Purchase order harus ada"),
        grandTotalBarter: yup.number().required("Total Barter harus ada"),
        dueDate: yup.string().required("Tanggal jatuh tempo harus ada"),
        notes: yup.string().optional(),
        listProduct: yup
          .array()
          .of(
            yup.object({
              id: yup.number().required("purchase order detail id harus diisi"),
              warehouseProductId: yup
                .number()
                .required("Id product warehouse harus diisi"),
              price: yup.number().required("Price product harus diisi"),
              quantity: yup.number().required("Quantity harus diisi"),
              subTotal: yup.number().required("Sub Total Product harus diisi"),
            })
          )
          .required("List purchase order produk harus ada"),
        listBarterProduct: yup.lazy((value) => {
          // If there are items in the barterProduct array, require all fields within the objects
          if (value && value.length > 0) {
            return yup.array().of(
              yup.object({
                id: yup
                  .number()
                  .required("purchase order barter detail id harus diisi"),
                warehouseProductId: yup
                  .number()
                  .required("Id product warehouse harus diisi"),
                price: yup.number().required("Harga barter harus diisi"),
                quantity: yup.number().required("Kuantiti barter harus diisi"),
                subTotal: yup.number().required("Sub Total barter harus diisi"),
              })
            );
          }
          // If no barter products, make it optional
          return yup
            .array()
            .of(
              yup.object({
                id: yup.number(),
                warehouseProductId: yup.number(),
                price: yup.number(),
                quantity: yup.number(),
                subTotal: yup.number(),
              })
            )
            .optional();
        }),
      });

      const code = await yupSchemaValidation(req.params.code, schemaParams);
      const body = await yupSchemaValidation(req.body, schemaBody);

      await PurchaseOrderService.updatePurchaseOrder({
        data: body,
        code: code,
      });

      res.status(200).json(responses(true, "Berhasil update purchase order"));
    } catch (error) {
      res
        .status(error.code || 500)
        .json(responses(false, error.message || error));
    }
  }

  // static async getPurchaseOrderByVendorId(req, res) {
  //   try {
  //     const params = req.params;

  //     const schemaParams = yup.string().required("Customer Id harus diisi");

  //     const customerId = await yupSchemaValidation(params.id, schemaParams);

  //     const getAllSalesOrder =
  //       await SalesOrderService.getSalesOrderByCustomerId({
  //         customerId,
  //       });

  //     res.status(200).json(responses(true, "Berhasil", getAllSalesOrder));
  //   } catch (error) {
  //     res
  //       .status(error.code || 500)
  //       .json(responses(false, error.message || error));
  //   }
  // }
}

module.exports = PurchaseOrderController;

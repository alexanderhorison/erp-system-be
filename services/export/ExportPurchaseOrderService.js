const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { TemplatePdfPurchaseOrder } = require("../../template/export/TemplatePdfPurchaseOrder");
const PurchaseOrderService = require("../purchaseOrder/PurchaseOrderService");

class ExportPurchaseOrderService {
  static async export(code) {
    try {
      const data = await PurchaseOrderService.getDetailByCode(code);

      let result = {
        ...data,
        listProducts: data?.listProducts?.map((itemProduct) => ({
          ...itemProduct,
          price: priceFormatWIthCurrency(itemProduct.price),
          subTotal: priceFormatWIthCurrency(itemProduct.subTotal),
        })),
        listBarterProducts: data?.listBarterProducts?.map((itemProduct) => ({
          ...itemProduct,
          price: priceFormatWIthCurrency(itemProduct.price),
          subTotal: priceFormatWIthCurrency(itemProduct.subTotal),
        })),
        grandTotal: priceFormatWIthCurrency(data.grandTotal),
        grandTotalVendor: priceFormatWIthCurrency(data.grandTotalVendor),
        grandTotalBarter: priceFormatWIthCurrency(data.grandTotalBarter),
        amountPaid: priceFormatWIthCurrency(data.amountPaid),
        amountDebt: priceFormatWIthCurrency(data.amountDebt),
      };

      const pdfBuffer = await TemplatePdfPurchaseOrder({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportPurchaseOrderService;

const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const SalesOrderService = require("../salesOrder/SalesOrderService");
const { TemplatePdfSalesOrder } = require("../../template/export/TemplatePdfSalesOrder");

class ExportSalesOrderService {
  static async export(code) {
    try {
      const data = await SalesOrderService.getDetailByCode(code);

      const shipDate = data?.shippingDate
        ? new Date(data.shippingDate).toLocaleDateString("en-GB")
        : data?.dueDate;

      let result = {
        ...data,
        shipDate: shipDate,
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
        grandTotalCustomer: priceFormatWIthCurrency(data.grandTotalCustomer),
        grandTotalBarter: priceFormatWIthCurrency(data.grandTotalBarter),
        amountPaid: priceFormatWIthCurrency(data.amountPaid),
        amountDebt: priceFormatWIthCurrency(data.amountDebt),
      };
      
      const pdfBuffer = await TemplatePdfSalesOrder({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportSalesOrderService;

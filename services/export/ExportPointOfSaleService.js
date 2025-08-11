const { formatDateWithSlash } = require("../../helpers/formatDate");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const { TemplatePdfPointOfSale } = require("../../template/export/TemplatePdfPointOfSale");
const PointOfSaleService = require("../pointOfSale/PointOfSaleService");

class ExportPointOfSaleService {
  static async export(code) {
    try {
      const data = await PointOfSaleService.getDetailPointOfSaleByCode(code);

      let result = {
        ...data,
        listProducts: data?.listProducts?.map((itemProduct) => ({
          ...itemProduct,
          price: priceFormatWIthCurrency(itemProduct.price),
          subTotal: priceFormatWIthCurrency(itemProduct.subTotal),
        })),
        discount: priceFormatWIthCurrency(data.discount),
        subTotal: priceFormatWIthCurrency(data.subTotal),
        grandTotal: priceFormatWIthCurrency(data.grandTotal),
        dueDate: formatDateWithSlash(data?.createdAt),
      };

      const pdfBuffer = await TemplatePdfPointOfSale({
        data: result,
      });
      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportPointOfSaleService;
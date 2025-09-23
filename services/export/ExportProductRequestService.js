const moment = require("moment");
require("moment/locale/id");
const { formatTimeSecond } = require("../../helpers/formatDate");

const { TemplatePdfDeliveryOrderReceipt } = require("../../template/export/TemplatePdfDeliveryOrderReceipt");
const ProductRequestOrderService = require("../productRequestOrder/ProductRequestOrderService");
const { TemplatePdfProductRequestOrder } = require("../../template/export/TemplatePdfProductRequestOrder");

class ExportProductRequestOrderService {
  static async export(code) {
    try {
      const data =
        await ProductRequestOrderService.getDetailByCode(code);

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        receivedAt: moment(data.receivedAt).format("DD, MMM YYYY"),
        receivedTime: formatTimeSecond(data.receivedAt),
      };

      const pdfBuffer = await TemplatePdfProductRequestOrder({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error
    }
  }
}

module.exports = ExportProductRequestOrderService;
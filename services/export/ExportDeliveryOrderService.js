const moment = require("moment");
require("moment/locale/id");
const { formatTime } = require("../../helpers/formatDate");

const DeliveryOrderService = require("../deliveryOrder/DeliveryOrderService");
const { TemplatePdfDeliveryOrder } = require("../../template/export/TemplatePdfDeliveryOrder");

class ExportDeliveryOrderService {
  static async export(code) {
    try {
      const data = await DeliveryOrderService.getDetailDeliveryOrder(code);
  
      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTime(data.createdAt),
      };

      const pdfBuffer = await TemplatePdfDeliveryOrder({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportDeliveryOrderService;

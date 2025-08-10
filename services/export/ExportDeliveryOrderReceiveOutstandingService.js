const { formatTimeSecond } = require("../../helpers/formatDate");
const { TemplatePdfDeliveryOrderReceiptOutstanding } = require("../../template/export/TemplatePdfDeliveryOrderReceiptOutstanding");
const DeliveryOrderReceiveOutstandingService = require("../deliveryOrderReceiveOutstanding/DeliveryOrderReceiveOutstandingService");

const moment = require("moment");
require("moment/locale/id");


class ExportDeliveryOrderReceiveOutstandingService {
  static async export(code) {
    try {
      const data = await DeliveryOrderReceiveOutstandingService.getOne(code);

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const pdfBuffer = await TemplatePdfDeliveryOrderReceiptOutstanding({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error
    }
  }
}

module.exports = ExportDeliveryOrderReceiveOutstandingService;
const { TemplatePdfInternalTransfer } = require("../../template/export/TemplatePdfInternalTransfer");
const moment = require("moment");
require("moment/locale/id");
const { formatTimeSecond } = require("../../helpers/formatDate");
const InternalTransferService = require("../internalTransfer/InternalTransferService");


class ExportInternalTransferService {
  static async export(code) {
    try {
      const data = await InternalTransferService.getDetailByCode(code);

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const pdfBuffer = await TemplatePdfInternalTransfer({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportInternalTransferService;
const { TemplatePdfGoodsIn } = require("../../template/export/TemplatePdfGoodsIn");
const GoodsInService = require("../adjustmentGoods/GoodsInService");
const moment = require("moment");
const {
  formatTimeSecond,
} = require("../../helpers/formatDate");

class ExportReportGoodsInService {
  static async export(code) {
    try {
      const data = await GoodsInService.getDetailByCode(code);

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const pdfBuffer = await TemplatePdfGoodsIn({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportReportGoodsInService;

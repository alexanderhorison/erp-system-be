const moment = require("moment");
const { formatTimeSecond } = require("../../helpers/formatDate");
const GoodsOutService = require("../adjustmentGoods/GoodsOutService");
const { generateGoodsOutPDF } = require("../../template/export/TemplatePdfGoodsOut");

class ExportReportGoodsOutService {
  static async export(code) {
    try {
      const data = await GoodsOutService.getDetailByCode(code);

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const pdfBuffer = await generateGoodsOutPDF({
        data: result,
      });

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportReportGoodsOutService;

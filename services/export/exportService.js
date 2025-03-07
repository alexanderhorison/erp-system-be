const handlebars = require("handlebars");
const SalesOrderService = require("../salesOrder/SalesOrderService");
const puppeteer = require("puppeteer");
const path = require("path");
const fs = require("fs");
const { priceFormatWIthCurrency } = require("../../helpers/priceFormat");
const PurchaseOrderService = require("../purchaseOrder/PurchaseOrderService");
const DeliveryOrderService = require("../deliveryOrder/DeliveryOrderService");
const {
  formatDate,
  formatTime,
  formatTimeSecond,
} = require("../../helpers/formatDate");
const DeliveryOrderReceiveService = require("../deliveryOrderReceive/DeliveryOrderReceiveService");
const moment = require("moment");
const DeliveryOrderReceiveOutstandingService = require("../deliveryOrderReceiveOutstanding/DeliveryOrderReceiveOutstandingService");
const GoodsInService = require("../adjustmentGoods/GoodsInService");
const GoodsOutService = require("../adjustmentGoods/GoodsOutService");
const InternalTransferService = require("../internalTransfer/InternalTransferService");
const ExcelJS = require("exceljs");
const ProductWarehouseService = require("../productWarehouse/ProductWarehouseService");
const StockOpnameService = require("../stockOpname/StockOpnameService");

require("moment/locale/id");
class ExportService {
  static async salesOrder(code) {
    try {
      const filePath = path.join("./template/export/", "SalesOrder.html");

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await SalesOrderService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

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
        grandTotalCustomer: priceFormatWIthCurrency(data.grandTotalCustomer),
        grandTotalBarter: priceFormatWIthCurrency(data.grandTotalBarter),
        amountPaid: priceFormatWIthCurrency(data.amountPaid),
        amountDebt: priceFormatWIthCurrency(data.amountDebt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      const pdfBuffer = await page.pdf({ format: "A4" });

      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async purchaseOrder(code) {
    try {
      const filePath = path.join("./template/export/", "PurchaseOrder.html");

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await PurchaseOrderService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

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

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async deliveryOrder(code) {
    try {
      const filePath = path.join("./template/export/", "DeliveryOrder.html");

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await DeliveryOrderService.getDetailDeliveryOrder(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTime(data.createdAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async deliveryOrderReceive(code) {
    try {
      const filePath = path.join(
        "./template/export/",
        "DeliveryOrderReceipt.html"
      );

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data =
        await DeliveryOrderReceiveService.getDetailDeliveryOrderReceive(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        receivedAt: moment(data.receivedAt).format("DD, MMM YYYY"),
        receivedTime: formatTimeSecond(data.receivedAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async deliveryOrderReceiveOutstanding(code) {
    try {
      const filePath = path.join(
        "./template/export/",
        "DeliveryOrderReceiptOutstanding.html"
      );

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await DeliveryOrderReceiveOutstandingService.getOne(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async adjustmentGoodsIn(code) {
    try {
      const filePath = path.join(
        "./template/export/",
        "AdjustmentGoodsIn.html"
      );

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await GoodsInService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async adjustmentGoodsOut(code) {
    try {
      const filePath = path.join(
        "./template/export/",
        "AdjustmentGoodsOut.html"
      );

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await GoodsOutService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async internalTransfer(code) {
    try {
      const filePath = path.join("./template/export/", "InternalTransfer.html");

      const htmlTemplate = fs.readFileSync(filePath, "utf8");

      const template = handlebars.compile(htmlTemplate);

      const data = await InternalTransferService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: "Data not found",
        };
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      };

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: "networkidle0" });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: "A4" });

      // Close the browser
      await browser.close();

      return pdfBuffer;
    } catch (error) {
      throw error;
    }
  }

  static async allStock({ res, warehouseId }) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile("./template/export/TotalStock.xlsx");

      const getDataAllStock = await ProductWarehouseService.getExportAllStock(
        warehouseId
      );

      // Define worksheet mapping
      const worksheetMapping = {
        "GUDANG GARAM": 1,
        "SAMPOERNA": 2,
        "DJARUM": 3,
        "BRAND KECIL": 4,
      };

      // Grouping products by company and name
      const groupedData = {};

      // Group products by company
      getDataAllStock.forEach((data) => {
        const key = `${data.companyName.toUpperCase()}||${data.productName}`;
        if (!groupedData[key]) {
          groupedData[key] = {
            companyName: data.companyName.toUpperCase(),
            productName: data.productName,
            KARTON: 0,
            BAL: 0,
            SLOP: 0,
          };
        }
        // Filter by the Unit
        if (["KARTON", "BAL", "SLOP"].includes(data.unitName)) {
          groupedData[key][data.unitName] = data.quantity;
        }
      });
      // Index for start from row 2
      const rowIndexMap = { 1: 2, 2: 2, 3: 2, 4: 2 };

      // loop key to made the row
      Object.values(groupedData).forEach((item, index) => {
        const sheetIndex = worksheetMapping[item.companyName] || 4;
        const worksheet = workbook.getWorksheet(sheetIndex);
        const rowIndex = rowIndexMap[sheetIndex]++;

        worksheet.getCell(`A${rowIndex}`).value = item.companyName.toUpperCase();
        worksheet.getCell(`B${rowIndex}`).value = item.productName;
        worksheet.getCell(`C${rowIndex}`).value = item.KARTON;
        worksheet.getCell(`D${rowIndex}`).value = item.BAL;
        worksheet.getCell(`E${rowIndex}`).value = item.SLOP;
      });

      const fileName = "Total Stock.xlsx";

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader("Content-Disposition", "attachment; filename=" + fileName);

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      throw error;
    }
  }

  static async stockOpnameExcel(code) {
    try {
      const data = await StockOpnameService.getDetailByCode(code);

      if (!data) {
        throw { code: 404, message: "Data not found" };
      }

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Stock Opname");

      worksheet.getColumn("A").width = 35;
      worksheet.getColumn("B").width = 35;
      worksheet.getColumn("C").width = 15;
      worksheet.getColumn("D").width = 15;
      worksheet.getColumn("E").width = 15;
      worksheet.getColumn("F").width = 15;
      worksheet.getColumn("G").width = 15;
      worksheet.getColumn("H").width = 15;

      // Metadata (Column A)
      const metadata = [
        { key: `Stock Opname Date`, value: data.opnameDate },
        { key: `Stock Opname Code`, value: data.code },
        { key: `Status`, value: data.status },
        { key: `Warehouse Name`, value: data.warehouseName },
        { key: `Creator Name`, value: data.creatorName },
        { key: `Notes`, value: data.notes },
      ];

      metadata.forEach((item, index) => {
        worksheet.addRow([item.key, item?.value || ""]);
      });

      // FOR SPACE
      worksheet.addRow([""]);

      // Headers in Row 9
      const headers = [
        "Product Name",
        "Company Name",
        "Rack Name",
        "Unit Name",
        "System Stock",
        "Actual Stock",
        "Different",
        "Adjustment",
      ];

      const headerRow = worksheet.addRow(headers);

      // Set border and fill for headers
      headerRow.eachCell((cell, colNumber) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: '889ff2' },  // Biru muda
        };

        // Cek kolom pertama dan terakhir untuk border tebal
        const isFirstCol = colNumber === 1;
        const isLastCol = colNumber === headers.length;

        cell.border = {
          top: { style: 'thick', color: { argb: '000000' } },    // Atas tebal
          bottom: { style: 'thick', color: { argb: '000000' } },  // Bawah tebal
          left: { style: isFirstCol ? 'thick' : 'thin', color: { argb: '000000' } },   // Kiri tebal cuma di kolom pertama
          right: { style: isLastCol ? 'thick' : 'thin', color: { argb: '000000' } },   // Kanan tebal cuma di kolom terakhir
        };

        cell.font = {
          bold: true,
          color: { argb: '000000' },
        };
      });


      // Data in Column C
      data.listProduct.forEach((product, index) => {
        const row = worksheet.addRow([
          product.productName,
          product.companyName,
          product.rackName,
          product.unitName,
          product.systemStock,
          product.actualStock,
          product.diff,
          product.isAdjustment ? "Yes" : "No",
        ]);
        row.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },       // Biru muda
            left: { style: 'thin', color: { argb: '000000' } },      // Biru muda
            bottom: { style: 'thin', color: { argb: '000000' } },    // Biru muda
            right: { style: 'thin', color: { argb: '000000' } },     // Biru muda
          };
        });

      });

      for (let col = 1; col <= 2; col++) {
        worksheet.getColumn(col).alignment = { horizontal: "left" };
      }

      return await workbook.xlsx.writeBuffer();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = ExportService;

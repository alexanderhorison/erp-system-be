const handlebars = require('handlebars');
const SalesOrderService = require('../salesOrder/SalesOrderService');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { priceFormatWIthCurrency } = require('../../helpers/priceFormat');
const PurchaseOrderService = require('../purchaseOrder/PurchaseOrderService');
const DeliveryOrderService = require('../deliveryOrder/DeliveryOrderService');
const { formatDate, formatTime, formatTimeSecond } = require('../../helpers/formatDate');
const DeliveryOrderReceiveService = require('../deliveryOrderReceive/DeliveryOrderReceiveService');
const moment = require('moment');
const DeliveryOrderReceiveOutstandingService = require('../deliveryOrderReceiveOutstanding/DeliveryOrderReceiveOutstandingService');
const GoodsInService = require('../adjustmentGoods/GoodsInService');
const GoodsOutService = require('../adjustmentGoods/GoodsOutService');
const InternalTransferService = require('../internalTransfer/InternalTransferService');
const ExcelJS = require("exceljs");
const ProductWarehouseService = require('../productWarehouse/ProductWarehouseService');

require('moment/locale/id');
class ExportService {
  static async salesOrder(code) {
    try {
      const filePath = path.join('./template/export/', 'SalesOrder.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await SalesOrderService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
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
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({ format: 'A4' });

      await browser.close();

      return pdfBuffer
    } catch (error) {
      throw error
    }
  }

  static async purchaseOrder(code) {
    try {

      const filePath = path.join('./template/export/', 'PurchaseOrder.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await PurchaseOrderService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
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
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async deliveryOrder(code) {
    try {
      const filePath = path.join('./template/export/', 'DeliveryOrder.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await DeliveryOrderService.getDetailDeliveryOrder(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTime(data.createdAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async deliveryOrderReceive(code) {
    try {
      const filePath = path.join('./template/export/', 'DeliveryOrderReceipt.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await DeliveryOrderReceiveService.getDetailDeliveryOrderReceive(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        receivedAt: moment(data.receivedAt).format("DD, MMM YYYY"),
        receivedTime: formatTimeSecond(data.receivedAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async deliveryOrderReceiveOutstanding(code) {
    try {
      const filePath = path.join('./template/export/', 'DeliveryOrderReceiptOutstanding.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await DeliveryOrderReceiveOutstandingService.getOne(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  //! Tidak ada
  static async stockOpname(code) {
    try {

    } catch (error) {
      throw error
    }
  }

  static async adjustmentGoodsIn(code) {
    try {
      const filePath = path.join('./template/export/', 'AdjustmentGoodsIn.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await GoodsInService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async adjustmentGoodsOut(code) {
    try {
      const filePath = path.join('./template/export/', 'AdjustmentGoodsOut.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await GoodsOutService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async internalTransfer(code) {
    try {
      const filePath = path.join('./template/export/', 'InternalTransfer.html');

      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      const template = handlebars.compile(htmlTemplate);

      const data = await InternalTransferService.getDetailByCode(code);

      if (!data) {
        throw {
          code: 404,
          message: 'Data not found'
        }
      }

      let result = {
        ...data,
        createdAt: moment(data.createdAt).format("DD, MMM YYYY"),
        createdTime: formatTimeSecond(data.createdAt),
        approvedAt: moment(data.approvedAt).format("DD, MMM YYYY"),
        approvedTime: formatTimeSecond(data.approvedAt),
      }

      const renderedHtml = template(result);

      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      return pdfBuffer

    } catch (error) {
      throw error
    }
  }

  static async allStock(res) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile("./template/export/TotalStock.xlsx");

      const getDataAllStock = await ProductWarehouseService.getExportAllStock();

      const worksheet1 = await workbook.getWorksheet(1);
      worksheet1.getColumn('A').width = 25;
      worksheet1.getCell(`A1`).value = `TJAHAYA BERKAT ABADI`;
      worksheet1.getColumn('B').width = 28;
      worksheet1.getCell(`B1`).value = `Export Stock ${formatDate(Date.now())}`;
      worksheet1.getColumn('C').width = 35;
      worksheet1.getColumn('D').width = 20;

      getDataAllStock.forEach((data, index) => {
        worksheet1.getCell(`A${index + 3}`).value = String(data.productWarehouseId);
        worksheet1.getCell(`B${index + 3}`).value = data.warehouseName;
        worksheet1.getCell(`C${index + 3}`).value = data.productName;
        worksheet1.getCell(`D${index + 3}`).value = data.companyName;
        worksheet1.getCell(`E${index + 3}`).value = data.rackName;
        worksheet1.getCell(`F${index + 3}`).value = data.unitName;
        worksheet1.getCell(`G${index + 3}`).value = data.categoryName;
        worksheet1.getCell(`H${index + 3}`).value = data.quantity;
        worksheet1.getCell(`I${index + 3}`).value = data.minimumStock;
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
      throw error
    }
  }
}

module.exports = ExportService
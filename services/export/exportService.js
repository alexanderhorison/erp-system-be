const handlebars = require('handlebars');
const SalesOrderService = require('../salesOrder/SalesOrderService');
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const { priceFormatWIthCurrency } = require('../../helpers/priceFormat');
const PurchaseOrderService = require('../purchaseOrder/PurchaseOrderService');


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

      const browser = await puppeteer.launch();
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

      const filePath = path.join('./template/export/', 'purchaseOrder.html');

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

      const browser = await puppeteer.launch();
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
}

module.exports = ExportService
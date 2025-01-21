const ExportService = require('../../services/export/exportService');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

class ExportController {
  static async testing2(req, res) {
    try {
      // const htmlContent = templateSalesOrder;
      const filePath = path.join('./template/export/', 'SalesOrder.html');
      const htmlTemplate = fs.readFileSync(filePath, 'utf8');

      // Compile template menggunakan Handlebars
      const template = handlebars.compile(htmlTemplate);

      function paginate(array, pageSize) {
        const pages = [];
        for (let i = 0; i < array.length; i += pageSize) {
          pages.push(array.slice(i, i + pageSize));
        }
        return pages;
      }

      const data = {
        code: "SO-89166189",
        customer: {
          name: "Alex The Kingsman"
        },
        grandTotal: "2244800",
        listProducts: [
          {
            productName: "GUDANG GARAM SURYAPRO 16 FULL POWER MAKSIMAL PLUS PLUS PLUS ULTIMATUM",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          }
          ,
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "GUDANG GARAM SURYAPRO 16",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          },
          {
            productName: "MAGNUM MAX 20",
            quantity: 5,
            unitName: "KARTON",
            price: "50000",
            subTotal: "250000"
          }
        ]
      };



      const renderedHtml = template(data);

      const browser = await puppeteer.launch();
      const page = await browser.newPage();

      await page.setContent(renderedHtml, { waitUntil: 'networkidle0' });

      // Generate PDF
      const pdfBuffer = await page.pdf({ format: 'A4' });

      // Close the browser
      await browser.close();

      // Kirim PDF sebagai respons
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="generated.pdf"',
      });

      res.end(pdfBuffer);

      // const browser = await puppeteer.launch();
      // const page = await browser.newPage();

      // await page.setContent(data, { waitUntil: 'networkidle0' });

      // // Generate PDF
      // const pdfBuffer = await page.pdf({ format: 'A4' });

      // // Close the browser
      // await browser.close();

      // res.set({
      //   'Content-Type': 'application/pdf',
      //   'Content-Disposition': 'attachment; filename="generated.pdf"',
      // });

      // // Send the PDF buffer as the response
      // res.end(pdfBuffer);

    } catch (error) {
      res.status(500).json({ message: 'Error generating PDF', error: error.message });
    }
  }
}

module.exports = ExportController;

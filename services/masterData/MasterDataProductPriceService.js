const {
  Master_Unit,
  Master_Product,
  Master_Product_Price,
  Master_Modal,
  sequelize: sq,
} = require("../../models");
const ExcelJS = require("exceljs");
const { throwValidation } = require("../../helpers/responses");
const { styleExcel } = require("../../helpers/excelHelperStyle");
const transporter = require("../../helpers/emailConfig");

class MasterDataProductPriceService {
  static async createOrUpdate(data) {
    try {
      const { productId, unitId, basePrice, basePricePos } = data;

      const existingRecord = await Master_Product_Price.findOne({
        where: {
          productId: productId,
          unitId: unitId,
        },
      });

      if (existingRecord) {
        await existingRecord.update({
          basePrice: basePrice,
          basePricePos: basePricePos,
        });
        return;
      } else {
        await Master_Product_Price.create({
          productId: productId,
          unitId: unitId,
          basePrice: basePrice,
          basePricePos: basePricePos,
        });

        return;
      }
    } catch (error) {
      throw error;
    }
  }

  static async findAll(payload) {
    try {
      const units = await Master_Unit.findAll();

      const existingPrices = await Master_Product_Price.findAll({
        where: { productId: payload.productId },
        include: [Master_Product, Master_Unit],
      });

      const masterModal = await Master_Modal.findAll({
        where: { productId: payload.productId },
        include: [Master_Product, Master_Unit],
      });

      const result = units.map((unit, index) => {
        // Find if this unit has an existing price for the product
        const existingPrice = existingPrices.find(
          (price) => price.unitId === unit.id
        );

        const existingModal = masterModal.find(
          (modal) => modal.unitId === unit.id
        );

        return {
          id: index + 1,
          unitId: unit.id,
          unitName: unit.name, // Assuming Master_Unit has a 'name' column
          basePrice: existingPrice ? existingPrice.basePrice : 0,
          masterModal: existingModal ? existingModal.modal : 0,
          basePricePos: existingPrice ? existingPrice.basePricePos : 0,
        };
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
  static async findOne(data) {
    try {
      const { productId, unitId } = data;

      const existingRecord = await Master_Product_Price.findOne({
        where: {
          productId: productId,
          unitId: unitId,
        },
        attributes: ["id", "basePrice"],
      });

      return existingRecord ? existingRecord : null;
    } catch (error) {
      throw error;
    }
  }

  static async downloadTemplate() {
    try {
      // Get all product prices with product and unit information
      const productPrices = await Master_Product_Price.findAll({
        include: [
          {
            model: Master_Product,
            attributes: ["name"],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
        ],
        order: [
          [Master_Product, "name", "ASC"],
          [Master_Unit, "name", "ASC"],
        ],
      });

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Product Price Template");
      const sheetName = "Product_Price_Template.xlsx";
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      // Define column headers
      const headers = [
        "Product Name",
        "Unit Name",
        "Base Price",
        "Base Price POS",
      ];

      worksheet.columns = [
        { header: headers[0], key: "productName", width: 30 },
        { header: headers[1], key: "unitName", width: 20 },
        { header: headers[2], key: "basePrice", width: 15 },
        { header: headers[3], key: "basePricePos", width: 15 },
      ];

      // Apply styling to headers
      const headerRow = worksheet.getRow(1);
      headerRow.font = fontBold;
      headerRow.alignment = centerMiddle;

      // Add data rows
      for (const productPrice of productPrices) {
        worksheet.addRow({
          productName: productPrice.Master_Product.name,
          unitName: productPrice.Master_Unit.name,
          basePrice: productPrice.basePrice,
          basePricePos: productPrice.basePricePos,
        });
      }

      // Apply borders to all cells with data
      const lastRow = worksheet.rowCount;
      for (let i = 1; i <= lastRow; i++) {
        const row = worksheet.getRow(i);
        for (let j = 1; j <= 4; j++) {
          const cell = row.getCell(j);
          cell.border = styleBorder;
        }
      }

      const file = await workbook.xlsx.writeBuffer();
      console.log("Product Price template generated successfully");

      return {
        sheetName,
        file,
      };
    } catch (error) {
      throw error;
    }
  }

  static async importTemplate(fileBuffer, user) {
    const transaction = await sq.transaction();
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(fileBuffer);
      
      const worksheet = workbook.getWorksheet(1); // Get first worksheet
      if (!worksheet) {
        throw throwValidation(400, "File Excel tidak valid");
      }

      let dataSuccess = [];
      let dataFailed = [];
      
      // Get all rows data first
      const rowsData = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header
        
        rowsData.push({
          rowNumber,
          productName: row.getCell(1).value?.toString().trim(),
          unitName: row.getCell(2).value?.toString().trim(),
          basePrice: parseFloat(row.getCell(3).value) || 0,
          basePricePos: parseFloat(row.getCell(4).value) || 0,
        });
      });

      // Process each row data
      for (const rowData of rowsData) {
        try {
          const { rowNumber, productName, unitName, basePrice, basePricePos } = rowData;

          if (!productName || !unitName) {
            dataFailed.push({
              row: rowNumber,
              productName,
              unitName,
              basePrice,
              basePricePos,
              message: "Product Name and Unit Name are required",
            });
            continue;
          }

          // Skip if both base prices are 0 (as per requirement)
          if (basePrice === 0 && basePricePos === 0) {
            console.log(`Skipping row ${rowNumber} - both prices are 0`);
            continue;
          }

          // Find product by name
          const findProductData = await Master_Product.findOne({
            where: { name: productName },
            transaction,
          });

          // Find unit by name
          const findUnitData = await Master_Unit.findOne({
            where: { name: unitName },
            transaction,
          });

          if (!findProductData || !findUnitData) {
            dataFailed.push({
              row: rowNumber,
              productName,
              unitName,
              basePrice,
              basePricePos,
              message: "Product or Unit not found in database",
            });
            continue;
          }

          // Find existing product price record
          const existingProductPrice = await Master_Product_Price.findOne({
            where: {
              productId: findProductData.id,
              unitId: findUnitData.id,
            },
            transaction,
          });

          const updateData = {};
          if (basePrice > 0) updateData.basePrice = basePrice;
          if (basePricePos > 0) updateData.basePricePos = basePricePos;

          if (Object.keys(updateData).length === 0) {
            dataFailed.push({
              row: rowNumber,
              productName,
              unitName,
              basePrice,
              basePricePos,
              message: `Skipping row ${rowNumber} - no valid prices to update`,
            });
            continue;
          }

          if (existingProductPrice) {
            // Update existing record
            await existingProductPrice.update(updateData, { transaction });
          } else {
            // Create new record
            await Master_Product_Price.create({
              productId: findProductData.id,
              unitId: findUnitData.id,
              basePrice: basePrice || 0,
              basePricePos: basePricePos || 0,
            }, { transaction });
          }

          dataSuccess.push({
            row: rowNumber,
            productName,
            unitName,
            basePrice,
            basePricePos,
            action: existingProductPrice ? "Updated" : "Created",
          });

        } catch (rowError) {
          console.error(`Error processing row ${rowData.rowNumber}:`, rowError);
          dataFailed.push({
            row: rowData.rowNumber,
            message: `Error processing row: ${rowError.message}`,
          });
        }
      }

      await transaction.commit();

      // Send email notification after successful import
      try {
        await this.sendImportSummaryEmail({
          totalProcessed: dataSuccess.length + dataFailed.length,
          successCount: dataSuccess.length,
          failedCount: dataFailed.length,
          dataFailed,
        });
      } catch (emailError) {
        console.error("Failed to send import summary email:", emailError);
        // Don't throw error here as the import was successful
      }

      return {
        totalProcessed: dataSuccess.length + dataFailed.length,
        successCount: dataSuccess.length,
        failedCount: dataFailed.length,
        dataSuccess,
        dataFailed,
      };

    } catch (error) {
      console.log(error)
      await transaction.rollback();
      throw error;
    }
  }

  static async sendImportSummaryEmail({ totalProcessed, successCount, failedCount, dataFailed }) {
    try {
      const subjectText = `Summary Import Data Product Price - ${new Date().toLocaleDateString('id-ID')}`;

      // Create table rows for failed data
      const failedRows = dataFailed.map((item, index) => `
        <tr>
          <td style="border:1px solid #ccc; padding:8px;">${index + 1}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.productName || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.unitName || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">${item.basePrice || 0}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">${item.basePricePos || 0}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.message || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${item.row || '-'}</td>
        </tr>
      `).join('');

      const htmlBody = `
        <p>Berikut hasil summary import data:</p>
        <br>
        <div style="margin-bottom: 20px;">
          <p><strong>Data Process:</strong> ${totalProcessed}</p>
          <p><strong>Data Success:</strong> ${successCount}</p>
          <p><strong>Data Failed:</strong> ${failedCount}</p>
        </div>
        <br>
        ${failedCount > 0 ? `
          <p><strong>List Data Failed:</strong></p>
          <table style="border-collapse:collapse; width:100%; font-family:Arial, sans-serif; font-size:12px;">
            <thead>
              <tr style="background-color:#f2f2f2;">
                <th style="border:1px solid #ccc; padding:8px;">No</th>
                <th style="border:1px solid #ccc; padding:8px;">Product Name</th>
                <th style="border:1px solid #ccc; padding:8px;">Unit Name</th>
                <th style="border:1px solid #ccc; padding:8px;">Base Price</th>
                <th style="border:1px solid #ccc; padding:8px;">Base Price POS</th>
                <th style="border:1px solid #ccc; padding:8px;">Message</th>
                <th style="border:1px solid #ccc; padding:8px;">Row Number</th>
              </tr>
            </thead>
            <tbody>
              ${failedRows}
            </tbody>
          </table>
        ` : '<p><strong>Semua data berhasil diproses tanpa ada yang gagal.</strong></p>'}
        <br>
        <p>Email ini dikirim secara otomatis oleh sistem ERP.</p>
      `;

      const transporterConnection = await transporter();

      const msg = {
        from: process.env.EMAIL_IS, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        bcc: process.env.EMAIL_RECEIVER_BCC, // BCC email address
        subject: subjectText, // Subject line
        text: `Berikut hasil summary import data Product Price. Data Process: ${totalProcessed}, Success: ${successCount}, Failed: ${failedCount}`, // plain text body
        html: htmlBody,
      };

      await transporterConnection.sendMail(msg);
      console.log("Import summary email sent successfully");

    } catch (error) {
      console.error("Error sending import summary email:", error);
      throw error;
    }
  }
}

module.exports = MasterDataProductPriceService;

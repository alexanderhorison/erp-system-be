const {
  Master_Unit,
  Master_Product,
  Master_Product_Price,
  Master_Modal,
  Master_Company,
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
      // Get all product prices with product, unit, and company information
      const productPrices = await Master_Product_Price.findAll({
        include: [
          {
            model: Master_Product,
            attributes: ["name", "companyId"],
            include: [
              {
                model: Master_Company,
                attributes: ["name"],
              },
            ],
          },
          {
            model: Master_Unit,
            attributes: ["name"],
          },
        ],
        order: [
          [Master_Product, { model: Master_Company }, "name", "ASC"],
          [Master_Product, "name", "ASC"],
          [Master_Unit, "name", "ASC"],
        ],
      });

      // Group products by company
      const companiesData = {};
      productPrices.forEach(productPrice => {
        const companyName = productPrice.Master_Product.Master_Company?.name || "No Company";
        if (!companiesData[companyName]) {
          companiesData[companyName] = [];
        }
        companiesData[companyName].push(productPrice);
      });

      const workbook = new ExcelJS.Workbook();
      const { styleBorder, fontBold, centerMiddle } = styleExcel;

      // Define column headers
      const headers = [
        "Product Name",
        "Unit Name",
        "Base Price",
        "Base Price POS",
      ];

      // Create a sheet for each company
      Object.keys(companiesData).forEach(companyName => {
        const worksheet = workbook.addWorksheet(companyName);
        
        worksheet.columns = [
          { header: headers[0], key: "productName", width: 30 },
          { header: headers[1], key: "unitName", width: 20 },
          { header: headers[2], key: "basePrice", width: 15, style: { alignment: { horizontal: 'right' } } },
          { header: headers[3], key: "basePricePos", width: 15, style: { alignment: { horizontal: 'right' } } },
        ];

        // Apply styling to headers
        const headerRow = worksheet.getRow(1);
        headerRow.font = fontBold;
        headerRow.alignment = centerMiddle;

        // Add data rows for this company
        companiesData[companyName].forEach(productPrice => {
          worksheet.addRow({
            productName: productPrice.Master_Product.name,
            unitName: productPrice.Master_Unit.name,
            basePrice: productPrice.basePrice,
            basePricePos: productPrice.basePricePos,
          });
        });

        // Apply borders to all cells with data
        const lastRow = worksheet.rowCount;
        for (let i = 1; i <= lastRow; i++) {
          const row = worksheet.getRow(i);
          for (let j = 1; j <= 4; j++) {
            const cell = row.getCell(j);
            cell.border = styleBorder;
          }
        }
      });

      const sheetName = "Product_Price_Template_By_Company.xlsx";
      const file = await workbook.xlsx.writeBuffer();
      console.log(`Product Price template generated successfully with ${Object.keys(companiesData).length} company sheets`);

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
      
      let dataSuccess = [];
      let dataFailed = [];
      let totalSheetsProcessed = 0;

      // Process each worksheet (company sheet)
      workbook.eachSheet((worksheet, sheetId) => {
        totalSheetsProcessed++;
        const companyName = worksheet.name;
        console.log(`Processing sheet: ${companyName}`);

        // Get all rows data from this sheet
        const rowsData = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          rowsData.push({
            rowNumber,
            sheetName: companyName,
            productName: row.getCell(1).value?.toString().trim(),
            unitName: row.getCell(2).value?.toString().trim(),
            basePrice: parseFloat(row.getCell(3).value) || 0,
            basePricePos: parseFloat(row.getCell(4).value) || 0,
          });
        });

        // Process each row from this sheet
        rowsData.forEach(rowData => {
          try {
            const { rowNumber, sheetName, productName, unitName, basePrice, basePricePos } = rowData;

            if (!productName || !unitName) {
              dataFailed.push({
                row: rowNumber,
                sheet: sheetName,
                productName,
                unitName,
                basePrice,
                basePricePos,
                message: "Product Name and Unit Name are required",
              });
              return;
            }

            // Skip if both base prices are 0 (as per requirement)
            if (basePrice === 0 && basePricePos === 0) {
              console.log(`Skipping row ${rowNumber} in sheet ${sheetName} - both prices are 0`);
              return;
            }

            // Store for async processing later
            rowsData.asyncProcessing = rowsData.asyncProcessing || [];
            rowsData.asyncProcessing.push(rowData);

          } catch (rowError) {
            console.error(`Error processing row ${rowData.rowNumber} in sheet ${rowData.sheetName}:`, rowError);
            dataFailed.push({
              row: rowData.rowNumber,
              sheet: rowData.sheetName,
              message: `Error processing row: ${rowError.message}`,
            });
          }
        });
      });

      // Now process all valid rows asynchronously with database operations
      for (const worksheet of workbook.worksheets) {
        const companyName = worksheet.name;
        
        // Get all rows data from this sheet again for async processing
        const rowsData = [];
        worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
          if (rowNumber === 1) return; // Skip header
          
          const productName = row.getCell(1).value?.toString().trim();
          const unitName = row.getCell(2).value?.toString().trim();
          const basePrice = parseFloat(row.getCell(3).value) || 0;
          const basePricePos = parseFloat(row.getCell(4).value) || 0;

          // Skip invalid or zero-price rows
          if (!productName || !unitName || (basePrice === 0 && basePricePos === 0)) {
            return;
          }

          rowsData.push({
            rowNumber,
            sheetName: companyName,
            productName,
            unitName,
            basePrice,
            basePricePos,
          });
        });

        // Process each valid row with database operations
        for (const rowData of rowsData) {
          try {
            const { rowNumber, sheetName, productName, unitName, basePrice, basePricePos } = rowData;

            // Find product by name (with company verification)
            const findProductData = await Master_Product.findOne({
              where: { name: productName },
              include: [
                {
                  model: Master_Company,
                  attributes: ["name"],
                }
              ],
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
                sheet: sheetName,
                productName,
                unitName,
                basePrice,
                basePricePos,
                message: "Product or Unit not found in database",
              });
              continue;
            }

            // Verify product belongs to the correct company sheet
            const productCompanyName = findProductData.Master_Company?.name || "No Company";
            if (productCompanyName !== sheetName) {
              dataFailed.push({
                row: rowNumber,
                sheet: sheetName,
                productName,
                unitName,
                basePrice,
                basePricePos,
                message: `Product belongs to '${productCompanyName}' company, not '${sheetName}'`,
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
                sheet: sheetName,
                productName,
                unitName,
                basePrice,
                basePricePos,
                message: `No valid prices to update (both prices are 0)`,
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
              sheet: sheetName,
              productName,
              unitName,
              basePrice,
              basePricePos,
              action: existingProductPrice ? "Updated" : "Created",
            });

          } catch (rowError) {
            console.error(`Error processing row ${rowData.rowNumber} in sheet ${rowData.sheetName}:`, rowError);
            dataFailed.push({
              row: rowData.rowNumber,
              sheet: rowData.sheetName,
              message: `Error processing row: ${rowError.message}`,
            });
          }
        }
      }

      await transaction.commit();

      dataFailed.push({...dataSuccess[0], message: "This is a test failed entry"})

      // Send email notification after successful import
      try {
        await this.sendImportSummaryEmail({
          totalProcessed: dataSuccess.length + dataFailed.length,
          successCount: dataSuccess.length,
          failedCount: dataFailed.length,
          totalSheetsProcessed,
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
        totalSheetsProcessed,
        dataSuccess,
        dataFailed,
      };

    } catch (error) {
      console.log(error)
      await transaction.rollback();
      throw error;
    }
  }

  static async sendImportSummaryEmail({ totalProcessed, successCount, failedCount, totalSheetsProcessed, dataFailed }) {
    try {
      const subjectText = `Summary Import Data Product Price - ${new Date().toLocaleDateString('id-ID')}`;

      // Create table rows for failed data
      const failedRows = dataFailed.map((item, index) => `
        <tr>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${index + 1}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.sheet || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.productName || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.unitName || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">${item.basePrice || 0}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:right;">${item.basePricePos || 0}</td>
          <td style="border:1px solid #ccc; padding:8px;">${item.message || '-'}</td>
          <td style="border:1px solid #ccc; padding:8px; text-align:center;">${item.row || '-'}</td>
        </tr>
      `).join('');

      const htmlBody = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Import Summary - Product Price</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <div style="max-width: 900px; margin: 0 auto; padding: 20px;">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
              <h2 style="margin: 0; font-size: 24px;">📊 Import Summary Report</h2>
              <p style="margin: 5px 0 0 0; opacity: 0.9;">Product Price Data Import</p>
            </div>
            
            <!-- Summary Cards -->
            <div style="background: #f8f9fa; padding: 20px; border-radius: 0 0 8px 8px; margin-bottom: 20px;">
              <h3 style="margin-top: 0; color: #495057; border-bottom: 2px solid #dee2e6; padding-bottom: 10px; text-align: center;">📈 Import Statistics</h3>
              
              <!-- Additional Info -->
              <div style="text-align: center; margin-bottom: 15px; color: #495057;">
                <strong>📄 Total Sheets Processed: ${totalSheetsProcessed || 0}</strong>
              </div>
              
              <div style="display: flex; flex-wrap: wrap; gap: 40px; margin-top: 20px; justify-content: center; align-items: center; width: 100%;">
                <div style="flex: 0 0 auto; width: 180px; background: white; padding: 25px; border-radius: 12px; border-left: 5px solid #28a745; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; margin: 10px;">
                  <div style="font-size: 32px; font-weight: bold; color: #28a745; margin-bottom: 12px;">${totalProcessed}</div>
                  <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Total Processed</div>
                </div>
                
                <div style="flex: 0 0 auto; width: 180px; background: white; padding: 25px; border-radius: 12px; border-left: 5px solid #007bff; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; margin: 10px;">
                  <div style="font-size: 32px; font-weight: bold; color: #007bff; margin-bottom: 12px;">${successCount}</div>
                  <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Successfully Updated</div>
                </div>
                
                <div style="flex: 0 0 auto; width: 180px; background: white; padding: 25px; border-radius: 12px; border-left: 5px solid ${failedCount > 0 ? '#dc3545' : '#28a745'}; box-shadow: 0 4px 12px rgba(0,0,0,0.15); text-align: center; margin: 10px;">
                  <div style="font-size: 32px; font-weight: bold; color: ${failedCount > 0 ? '#dc3545' : '#28a745'}; margin-bottom: 12px;">${failedCount}</div>
                  <div style="font-size: 12px; color: #6c757d; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">Failed Records</div>
                </div>
              </div>
            </div>
            
            <!-- Success Message -->
            ${failedCount === 0 ? `
              <div style="background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 6px; margin-bottom: 20px;">
                <div style="display: flex; align-items: center;">
                  <span style="font-size: 20px; margin-right: 10px;">✅</span>
                  <div>
                    <strong>Import Completed Successfully!</strong><br>
                    <span style="font-size: 14px;">All ${totalProcessed} records across ${totalSheetsProcessed} company sheets were processed without any errors.</span>
                  </div>
                </div>
              </div>
            ` : ''}
            
            <!-- Failed Records Section -->
            ${failedCount > 0 ? `
              <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; color: #856404; display: flex; align-items: center;">
                  <span style="margin-right: 8px;">⚠️</span>
                  Failed Records Details
                </h3>
                <p style="margin-bottom: 15px; color: #856404;">The following records could not be processed. Please review and correct the data before re-importing.</p>
                
                <div style="overflow-x: auto;">
                  <table style="border-collapse: collapse; width: 100%; font-family: Arial, sans-serif; font-size: 12px; background: white; border-radius: 4px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #f8f9fa; border-bottom: 2px solid #dee2e6;">
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: 600;">No</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600;">Sheet/Company</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: 600;">Row</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600;">Product Name</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600;">Unit Name</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: right; font-weight: 600;">Base Price</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: right; font-weight: 600;">Base Price POS</th>
                        <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600;">Error Message</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${failedRows}
                    </tbody>
                  </table>
                </div>
              </div>
            ` : ''}
            
            <!-- Footer -->
            <div style="background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; border-top: 1px solid #dee2e6;">
              <p style="margin: 0; font-size: 12px; color: #6c757d;">
                <strong>ERP System Notification</strong><br>
                This email was automatically generated on ${new Date().toLocaleString('id-ID')}<br>
                Multi-company sheet import processed successfully.<br>
                Please do not reply to this email.
              </p>
            </div>
            
          </div>
        </body>
        </html>
      `;

      const transporterConnection = await transporter();

      const msg = {
        from: process.env.EMAIL_IS, // sender address
        to: process.env.EMAIL_RECEIVER, // list of receivers
        bcc: process.env.EMAIL_RECEIVER_BCC, // BCC email address
        subject: subjectText, // Subject line
        text: `Import Summary - Product Price Data (Multi-Company). Total Processed: ${totalProcessed}, Success: ${successCount}, Failed: ${failedCount}, Sheets: ${totalSheetsProcessed}`, // plain text body
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

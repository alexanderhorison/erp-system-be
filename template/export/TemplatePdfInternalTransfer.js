const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfInternalTransfer = async ({ data }) => {
  try {
    // ================ DATA EXTRACTION ================
    const {
      code,
      status,
      notes,
      warehouseName,
      warehouseLocation,
      createdBy,
      approvedBy,
      createdAt,
      createdTime,
      approvedAt,
      approvedTime,
      listProduct,
    } = data;

    // ================ PDF INITIALIZATION ================
    const pdfDoc = await PDFDocument.create();
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    let page = pdfDoc.addPage(settingPdf.paperSizeA4);

    // ================ CONSTANTS ================
    const {
      color: grayColor,
      fontSize,
      spacing1,
      spacing2,
      spacing3,
      spacingProduct,
      pageMarginBottom,
      marginLeft,
      yBody: initialYBody,
      marginLeftHeader2,
      xLeftSignature,
      xRightSignature,
      spaceSign,
    } = settingPdf;

    // ================ HELPER FUNCTIONS ================

    // Helper function to check if we need a new page
    const checkAndCreateNewPage = (currentY) => {
      if (currentY <= pageMarginBottom) {
        page = pdfDoc.addPage(settingPdf.paperSizeA4);
        return settingPdf.startYAfterNewPage;
      }
      return currentY;
    };

    // Helper function to draw product table header
    const drawProductTableHeader = (
      yPosition,
      title = "Informasi Gudang",
      showTitle = true
    ) => {
      // Draw section title only if showTitle is true
      if (showTitle) {
        page.drawText(title, {
          x: marginLeft,
          y: yPosition,
          size: settingPdf.fontSizeTitle,
          color: grayColor,
          font: fontBold,
        });
        yPosition -= spacing2;

        // Draw warehouse information
        page.drawText("Gudang:", {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          color: grayColor,
          font: fontBold,
        });
        yPosition -= spacing1;

        page.drawText(warehouseName || "-", {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        yPosition -= spacing1;

        page.drawText(warehouseLocation || "-", {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        yPosition -= spacing2;
      }

      separator(page, yPosition);
      yPosition -= spacing2;

      // Draw table header columns (PRODUK, UNIT, PERUSAHAAN, RAK ASAL, RAK TUJUAN)
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: 180, // Position for unit
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("PERUSAHAAN", {
        x: 230, // Position for company
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("RAK ASAL", {
        x: 350, // Position for source rack
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("RAK TUJUAN", {
        x: 450, // Position for destination rack
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      yPosition -= spacing1;
      separator(page, yPosition);
      yPosition -= spacing1;

      return yPosition;
    };

    // Helper function to render a product row
    const renderProductRow = (product, yPosition) => {
      const { productName, unitName, companyName, warehouseRackFrom, warehouseRackTo } = product;

      // Product name with area (up to column 160)
      const productNameMaxWidth = 160 - marginLeft;
      const productNameLines = wrapText({
        text: productName,
        font,
        fontSize: fontSize,
        maxWidth: productNameMaxWidth,
      });

      // Draw product name (with wrapping)
      productNameLines.forEach((line, index) => {
        page.drawText(line, {
          x: marginLeft,
          y: yPosition - index * settingPdf.spacingWrapText,
          size: fontSize,
          color: grayColor,
          font: font,
        });
      });

      // Calculate the middle position for other columns when product name is wrapped
      const lineCount = productNameLines.length;
      const middleOffset = Math.floor(((lineCount - 1) * 10) / 2);
      const middleY = yPosition - middleOffset;

      // Draw other columns
      page.drawText(unitName || "-", {
        x: 180, // Unit position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(companyName || "-", {
        x: 230, // Company position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(warehouseRackFrom || "-", {
        x: 350, // Source rack position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(warehouseRackTo || "-", {
        x: 450, // Destination rack position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Calculate new Y position after this product
      const newY =
        yPosition - (lineCount - 1) * spacingProduct - spacingProduct;
      separator(page, newY);

      return newY - spacingProduct - 6;
    };

    // ================ DOCUMENT GENERATION ================

    // Generate header
    await GenerateHeader({
      page,
      pdfDoc,
      font,
      fontBold,
    });

    // ================ HEADER INFORMATION ================
    const renderHeaderInfo = () => {
      let headerY = 785;

      // Internal Transfer title and code
      page.drawText("Transfer Internal", {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(`#${code}`, {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: font,
      });

      headerY -= spacing2;
      // Status Information
      if (status) {
        page.drawText(`${status}`, {
          x: marginLeftHeader2,
          y: headerY,
          size: settingPdf.fontSizeHeader,
          color: grayColor,
          font: fontBold,
        });
      }

      separator(page, 680);
    };

    renderHeaderInfo();

    // ================ DOCUMENT BODY ================
    let yBody = initialYBody;

    // Products Section
    const renderProductsSection = () => {
      if (!listProduct || listProduct.length === 0) return;

      // Check if we need a new page for the product section header
      yBody = checkAndCreateNewPage(yBody);

      // Draw initial header
      yBody = drawProductTableHeader(yBody, "Informasi Gudang");

      listProduct.forEach((product) => {
        // Check if we need a new page before rendering the product
        if (yBody <= pageMarginBottom) {
          yBody = checkAndCreateNewPage(yBody);
          // Redraw header on new page
          yBody = drawProductTableHeader(yBody, "", false);
        }

        yBody = renderProductRow(product, yBody);
      });

      // Add spacing after products
      yBody -= spacing1;
    };

    // Notes Section
    const renderNotesSection = () => {
      if (!notes) return;

      // Draw "CATATAN:" label
      page.drawText("CATATAN:", {
        x: marginLeft,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      yBody -= spacing1;

      // Wrap notes text
      const notesMaxWidth = 500;
      const notesLines = wrapText({
        text: notes,
        font,
        fontSize: fontSize,
        maxWidth: notesMaxWidth,
      });

      // Draw wrapped notes
      notesLines.forEach((line, index) => {
        page.drawText(line, {
          x: marginLeft,
          y: yBody - index * spacing1,
          size: fontSize,
          color: grayColor,
          font: font,
        });
      });

      // Adjust yBody based on number of lines
      yBody -= notesLines.length * spacing1;
      yBody -= spacing1;
      separator(page, yBody);
    };

    // Render all sections
    renderProductsSection();
    renderNotesSection();

    // ================ FOOTER ================
    const renderFooter = () => {
      // Check if we have enough space for footer
      const footerRequiredSpace = 150;
      if (yBody - footerRequiredSpace < pageMarginBottom) {
        page = pdfDoc.addPage(settingPdf.paperSizeA4);
        yBody = settingPdf.startYAfterNewPage;
      }

      // Signature sections
      yBody -= spacing3;

      // Left side - Dibuat Oleh
      page.drawText("Dibuat Oleh", {
        x: xLeftSignature - font.widthOfTextAtSize("Dibuat Oleh", fontSize) / 2,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      // Right side - Disetujui Oleh
      page.drawText("Disetujui Oleh", {
        x: xRightSignature - font.widthOfTextAtSize("Disetujui Oleh", fontSize) / 2,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      yBody -= spaceSign;

      // Creator information (left side)
      let creatorY = yBody;
      if (createdBy) {
        const createdByWidth = font.widthOfTextAtSize(createdBy, fontSize);
        page.drawText(createdBy, {
          x: xLeftSignature - createdByWidth / 2,
          y: creatorY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        creatorY -= spacing1;
      }

      if (createdAt) {
        const createdAtWidth = font.widthOfTextAtSize(createdAt, fontSize);
        page.drawText(createdAt, {
          x: xLeftSignature - createdAtWidth / 2,
          y: creatorY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        creatorY -= spacing1;
      }

      if (createdTime) {
        const createdTimeWidth = font.widthOfTextAtSize(createdTime, fontSize);
        page.drawText(createdTime, {
          x: xLeftSignature - createdTimeWidth / 2,
          y: creatorY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
      }

      // Approver information (right side)
      let approverY = yBody;
      if (approvedBy) {
        const approvedByWidth = font.widthOfTextAtSize(approvedBy, fontSize);
        page.drawText(approvedBy, {
          x: xRightSignature - approvedByWidth / 2,
          y: approverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        approverY -= spacing1;
      }

      if (approvedAt) {
        const approvedAtWidth = font.widthOfTextAtSize(approvedAt, fontSize);
        page.drawText(approvedAt, {
          x: xRightSignature - approvedAtWidth / 2,
          y: approverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        approverY -= spacing1;
      }

      if (approvedTime) {
        const approvedTimeWidth = font.widthOfTextAtSize(approvedTime, fontSize);
        page.drawText(approvedTime, {
          x: xRightSignature - approvedTimeWidth / 2,
          y: approverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
      }
    };

    renderFooter();

    return pdfDoc.save();
  } catch (error) {
    throw error;
  }
}

module.exports = { TemplatePdfInternalTransfer };
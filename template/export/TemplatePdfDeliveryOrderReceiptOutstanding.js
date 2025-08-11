const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfDeliveryOrderReceiptOutstanding = async ({ data }) => {
  try {
    // ================ DATA EXTRACTION ================
    const {
      code,
      status,
      deliveryOrderReceiptCode,
      deliveryOrderCode,
      warehouseOrigin,
      warehouseDestination,
      creatorBy,
      approverBy,
      createdAt,
      createdTime,
      approvedAt,
      approvedTime,
      productOutstandings,
      notes,
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
        // Draw warehouse information side by side
        const leftColumnX = marginLeft;
        const rightColumnX = 400; // Position for right column

        // Left side - Gudang Asal
        let leftY = yPosition;
        page.drawText("Gudang Asal:", {
          x: leftColumnX,
          y: leftY,
          size: fontSize,
          color: grayColor,
          font: fontBold,
        });
        leftY -= spacing1;

        page.drawText(warehouseOrigin?.name || "-", {
          x: leftColumnX,
          y: leftY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        leftY -= spacing1;

        page.drawText(warehouseOrigin?.location || "-", {
          x: leftColumnX,
          y: leftY,
          size: fontSize,
          color: grayColor,
          font: font,
        });

        // Right side - Gudang Tujuan
        let rightY = yPosition;
        page.drawText("Gudang Tujuan:", {
          x: rightColumnX,
          y: rightY,
          size: fontSize,
          color: grayColor,
          font: fontBold,
        });
        rightY -= spacing1;

        page.drawText(warehouseDestination?.name || "-", {
          x: rightColumnX,
          y: rightY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        rightY -= spacing1;

        page.drawText(warehouseDestination?.location || "-", {
          x: rightColumnX,
          y: rightY,
          size: fontSize,
          color: grayColor,
          font: font,
        });

        // Update yPosition to the lowest point
        yPosition = Math.min(leftY, rightY) - spacing1;
      }
      separator(page, yPosition);
      yPosition -= spacing2;

      // Draw table header columns (PRODUK, UNIT, RAK, KUANTITI ASAL, KUANTITI DITERIMA, KUANTITI OUTSTANDING)
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: 150, // Position for unit
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("RAK", {
        x: 200, // Position for rack/shelf
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI ASAL", {
        x: 250, // Position for original quantity
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI DITERIMA", {
        x: 350, // Position for received quantity
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI OUTSTANDING", {
        x: 460, // Position for outstanding quantity
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
      const { productName, unitName, rackName, quantityFrom, quantityReceived, quantityOutstanding } = product;

      // Product name with smaller area (up to column 130)
      const productNameMaxWidth = 130 - marginLeft;
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
      page.drawText(unitName, {
        x: 150, // Unit position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(rackName || "-", {
        x: 200, // Rack position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantityFrom?.toString() || "0", {
        x: 250, // Original quantity position (left aligned)
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantityReceived?.toString() || "0", {
        x: 350, // Received quantity position (left aligned)
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantityOutstanding?.toString() || "0", {
        x: 460, // Outstanding quantity position (left aligned)
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

      // Outstanding Receipt title and code
      page.drawText("Outstanding Penerimaan", {
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

      // Receipt title and code
      page.drawText("Penerimaan Surat Jalan", {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(`#${deliveryOrderReceiptCode}`, {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: font,
      });

      headerY -= spacing2;

      // Delivery Order title and code
      page.drawText("Surat Jalan", {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(`#${deliveryOrderCode}`, {
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
      if (!productOutstandings || productOutstandings.length === 0) return;

      // Check if we need a new page for the product section header
      yBody = checkAndCreateNewPage(yBody);

      // Draw initial header
      yBody = drawProductTableHeader(yBody, "Informasi Gudang");

      productOutstandings.forEach((product) => {
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
      if (creatorBy?.name) {
        const createdByWidth = font.widthOfTextAtSize(creatorBy.name, fontSize);
        page.drawText(creatorBy.name, {
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
      if (approverBy?.name) {
        const approvedByWidth = font.widthOfTextAtSize(approverBy.name, fontSize);
        page.drawText(approverBy.name, {
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

module.exports = { TemplatePdfDeliveryOrderReceiptOutstanding };
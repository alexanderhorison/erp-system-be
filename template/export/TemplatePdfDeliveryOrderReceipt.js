const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfDeliveryOrderReceipt = async ({ data }) => {
  try {

    console.log(data);

    // ================ DATA EXTRACTION ================
    const {
      codeReceipt,
      codeDeliveryOrder,
      warehouseOrigin,
      warehouseDestination,
      creatorBy,
      receiverBy,
      createdAt,
      createdTime,
      receivedAt,
      receivedTime,
      listProducts,
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

      // Draw table header columns (PRODUK, UNIT, RAK, KUANTITI ASAL, KUANTITI DITERIMA)
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: 200, // Position for unit
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("RAK", {
        x: 260, // Position for rack/shelf
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI ASAL", {
        x: 320, // Position for original quantity
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI DITERIMA", {
        x: 430, // Position for received quantity
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
      const { productName, unitName, rackName, originalQuantity, receivedQuantity } = product;

      // Product name with smaller area (up to column 180)
      const productNameMaxWidth = 180 - marginLeft;
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
        x: 200, // Unit position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(rackName || "-", {
        x: 260, // Rack position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(originalQuantity?.toString() || "0", {
        x: 320, // Original quantity position (left aligned)
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(receivedQuantity?.toString() || "0", {
        x: 430, // Received quantity position (left aligned)
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

      // Receipt title and code (left side)
      page.drawText("Penerimaan Surat Jalan", {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(`#${codeReceipt}`, {
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

      page.drawText(`#${codeDeliveryOrder}`, {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: font,
      });

      headerY -= spacing2;
      // Remove status information since it's not in the data structure

      separator(page, 680);
    };

    renderHeaderInfo();

    // ================ DOCUMENT BODY ================
    let yBody = initialYBody;

    // Products Section
    const renderProductsSection = () => {
      if (!listProducts || listProducts.length === 0) return;

      // Check if we need a new page for the product section header
      yBody = checkAndCreateNewPage(yBody);

      // Draw initial header
      yBody = drawProductTableHeader(yBody, "Informasi Gudang");

      listProducts.forEach((product) => {
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

      // Right side - Diterima Oleh
      page.drawText("Diterima Oleh", {
        x: xRightSignature - font.widthOfTextAtSize("Diterima Oleh", fontSize) / 2,
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

      // Receiver information (right side)
      let receiverY = yBody;
      if (receiverBy?.name) {
        const receivedByWidth = font.widthOfTextAtSize(receiverBy.name, fontSize);
        page.drawText(receiverBy.name, {
          x: xRightSignature - receivedByWidth / 2,
          y: receiverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        receiverY -= spacing1;
      }

      if (receivedAt) {
        const receivedAtWidth = font.widthOfTextAtSize(receivedAt, fontSize);
        page.drawText(receivedAt, {
          x: xRightSignature - receivedAtWidth / 2,
          y: receiverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        receiverY -= spacing1;
      }

      if (receivedTime) {
        const receivedTimeWidth = font.widthOfTextAtSize(receivedTime, fontSize);
        page.drawText(receivedTime, {
          x: xRightSignature - receivedTimeWidth / 2,
          y: receiverY,
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

module.exports = { TemplatePdfDeliveryOrderReceipt };
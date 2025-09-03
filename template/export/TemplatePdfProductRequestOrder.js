const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfProductRequestOrder = async ({ data }) => {
  try {
    // ================ DATA EXTRACTION ================
    const {
      status,
      notes,
      code,
      warehouseOrigin,
      warehouseDestination,
      createdBy,
      createdAt,
      createdTime,
      listProducts,
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
      showTitle = false
    ) => {
      // Draw section title only if showTitle is true
      // if (showTitle) {
      //   // Draw warehouse information side by side
      //   const leftColumnX = marginLeft;
      //   const rightColumnX = 400; // Position for right column (moved further right)

      //   // Left side - Gudang Asal
      //   let leftY = yPosition;
      //   page.drawText("Gudang Asal:", {
      //     x: leftColumnX,
      //     y: leftY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: fontBold,
      //   });
      //   leftY -= spacing1;

      //   page.drawText(warehouseOrigin?.name || "-", {
      //     x: leftColumnX,
      //     y: leftY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: font,
      //   });
      //   leftY -= spacing1;

      //   page.drawText(warehouseOrigin?.location || "-", {
      //     x: leftColumnX,
      //     y: leftY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: font,
      //   });

      //   // Right side - Gudang Tujuan
      //   let rightY = yPosition;
      //   page.drawText("Gudang Tujuan:", {
      //     x: rightColumnX,
      //     y: rightY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: fontBold,
      //   });
      //   rightY -= spacing1;

      //   page.drawText(warehouseDestination?.name || "-", {
      //     x: rightColumnX,
      //     y: rightY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: font,
      //   });
      //   rightY -= spacing1;

      //   page.drawText(warehouseDestination?.location || "-", {
      //     x: rightColumnX,
      //     y: rightY,
      //     size: fontSize,
      //     color: grayColor,
      //     font: font,
      //   });

      //   // Update yPosition to the lowest point
      //   yPosition = Math.min(leftY, rightY) - spacing1;
      // }
      // separator(page, yPosition);
      // yPosition -= spacing2;

      // Draw table header columns (PRODUK, RAK, UNIT, TOTAL)
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: 300, // Position for unit
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("TOTAL", {
        x: 480, // Position for total quantity
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
      const { productName, unitName, quantityRequested } = product;

      // Product name with larger area (up to column 280)
      const productNameMaxWidth = 280 - marginLeft;
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

      page.drawText(unitName, {
        x: 300, // Unit position
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantityRequested.toString(), {
        x: 480, // Total quantity position
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
      const marginLeftHeader1 = 280;
      let headerY = 785;

      // Delivery Order title and code
      page.drawText("Surat Product Request", {
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
      const notesMaxWidth = settingPdf.notesMaxWidth;
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
      const footerRequiredSpace = settingPdf.footerRequiredSpace;
      if (yBody - footerRequiredSpace < pageMarginBottom) {
        page = pdfDoc.addPage(settingPdf.paperSizeA4);
        yBody = settingPdf.startYAfterNewPage;
      }

      const spaceSign = settingPdf.spaceSignature;

      // Signature sections
      yBody -= spacing3;

      // Only "Dibuat Oleh" section (centered like in GoodsIn)
      page.drawText("Dibuat Oleh", {
        x: settingPdf.xRightSignature - font.widthOfTextAtSize("Dibuat Oleh", fontSize) / 2,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      yBody -= spaceSign;

      // Creator information (centered like in GoodsIn)
      let creatorY = yBody;
      if (createdBy?.name) {
        const createdByWidth = font.widthOfTextAtSize(createdBy.name, fontSize);
        page.drawText(createdBy.name, {
          x: settingPdf.xRightSignature - createdByWidth / 2,
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
          x: settingPdf.xRightSignature - createdAtWidth / 2,
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
          x: settingPdf.xRightSignature - createdTimeWidth / 2,
          y: creatorY,
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

module.exports = { TemplatePdfProductRequestOrder };
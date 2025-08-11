const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfGoodsIn = async ({ data }) => {
  try {
    // ================ DATA EXTRACTION ================
    const {
      status,
      notes,
      code,
      warehouseDestinationName,
      warehouseLocation,
      createdBy,
      approvedBy,
      approvedAt,
      createdAt,
      createdTime,
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
      title = "Gudang Tujuan",
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

        // Draw warehouse destination name
        page.drawText(warehouseDestinationName, {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        yPosition -= spacing1;

        // Draw warehouse location
        page.drawText(warehouseLocation, {
          x: marginLeft,
          y: yPosition,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        yPosition -= spacing2;
      }

      // Draw table header columns (PRODUK paling besar, UNIT dan KUANTITI di kanan)
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: 400, // Posisi lebih ke kanan
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI", {
        x: 480, // Posisi paling kanan
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
      const { productName, unitName, quantity } = product;

      // Produk name dengan area yang lebih besar (sampai kolom 350)
      const productNameMaxWidth = 350 - marginLeft;
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

      // Draw other columns dengan posisi yang disesuaikan
      page.drawText(unitName, {
        x: 400, // Posisi Unit di kanan
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantity.toString(), {
        x: 480, // Posisi Kuantiti paling kanan
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

      // Purchase Order title and code
      page.drawText("Barang Masuk", {
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
      page.drawText(`${status}`, {
        x: marginLeftHeader2,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });

      separator(page, 680);
    };

    renderHeaderInfo();

    // ================ DOCUMENT BODY ================
    let yBody = initialYBody;

    // Products Section
    const renderProductsSection = () => {
      if (listProduct.length === 0) return;

      // Check if we need a new page for the product section header
      yBody = checkAndCreateNewPage(yBody);

      // Draw initial header
      yBody = drawProductTableHeader(yBody, "Gudang Tujuan");

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
      const footerRequiredSpace = 150; // More space needed for signature info
      if (yBody - footerRequiredSpace < pageMarginBottom) {
        page = pdfDoc.addPage(settingPdf.paperSizeA4);
        yBody = settingPdf.startYAfterNewPage;
      }

      const spaceSign = settingPdf.spaceSignature;

      // Signature sections
      yBody -= spacing3;

      // Left side - Dibuat Oleh
      page.drawText("Dibuat Oleh", {
        x: settingPdf.xLeftSignature - font.widthOfTextAtSize("Dibuat Oleh", fontSize) / 2,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      // Right side - Diterima Oleh
      page.drawText("Diterima Oleh", {
        x: settingPdf.xRightSignature - font.widthOfTextAtSize("Diterima Oleh", fontSize) / 2,
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
          x: settingPdf.xLeftSignature - createdByWidth / 2,
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
          x: settingPdf.xLeftSignature - createdAtWidth / 2,
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
          x: settingPdf.xLeftSignature - createdTimeWidth / 2,
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
          x: settingPdf.xRightSignature - approvedByWidth / 2,
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
          x: settingPdf.xRightSignature - approvedAtWidth / 2,
          y: approverY,
          size: fontSize,
          color: grayColor,
          font: font,
        });
        approverY -= spacing1;
      }

      if (approvedTime) {
        const approvedTimeWidth = font.widthOfTextAtSize(
          approvedTime,
          fontSize
        );
        page.drawText(approvedTime, {
          x: settingPdf.xRightSignature - approvedTimeWidth / 2,
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
};

module.exports = {
  TemplatePdfGoodsIn,
};

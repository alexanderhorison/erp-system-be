const { PDFDocument, StandardFonts, rgb } = require("pdf-lib");
const {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
} = require("./HelperExport");
const settingPdf = require("./settingPdf");

const TemplatePdfPurchaseOrder = async ({ data }) => {
  try {
    // ================ DATA EXTRACTION ================
    const {
      grandTotalVendor,
      code,
      dueDate,
      vendor,
      listProducts,
      listBarterProducts,
      grandTotal,
      grandTotalBarter,
    } = data;

    const vendorName = vendor?.name;

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
      xUnit,
      xQty,
      xPrice,
      xTotal,
      xGrandTotal,
      yBody: initialYBody,
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
      title = "Barang Purchase Order",
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
      }

      // Draw table header columns
      page.drawText("PRODUK", {
        x: marginLeft,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("UNIT", {
        x: xUnit,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("KUANTITI", {
        x: xQty,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("HARGA", {
        x: xPrice,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      page.drawText("JUMLAH", {
        x: xTotal,
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
      const { productName, unitName, quantity, price, subTotal } = product;

      const productNameMaxWidth = 200 - marginLeft;
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
        x: xUnit,
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      page.drawText(quantity.toString(), {
        x: xQty,
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Right-aligned price
      const priceWidth = font.widthOfTextAtSize(price, fontSize);
      page.drawText(price, {
        x: 450 - priceWidth,
        y: middleY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Right-aligned subtotal
      const subTotalWidth = font.widthOfTextAtSize(subTotal, fontSize);
      page.drawText(subTotal, {
        x: 555 - subTotalWidth,
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

    // Helper function to draw total row
    const drawTotalRow = (yPosition, totalAmount) => {
      const totalLabelWidth = fontBold.widthOfTextAtSize("Total:", fontSize);
      page.drawText("Total:", {
        x: xGrandTotal - totalLabelWidth,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      const totalWidth = fontBold.widthOfTextAtSize(totalAmount, fontSize);
      page.drawText(totalAmount, {
        x: 555 - totalWidth,
        y: yPosition,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      return yPosition - spacing2;
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
      page.drawText("Purchase Order", {
        x: marginLeftHeader1,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(`#${code}`, {
        x: marginLeftHeader1,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: font,
      });

      // Due date
      headerY -= spacing2;
      page.drawText("Tgl. Jatuh Tempo", {
        x: marginLeftHeader1,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      headerY -= spacing1;

      page.drawText(dueDate, {
        x: marginLeftHeader1,
        y: headerY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: font,
      });

      // Vendor information
      let vendorY = settingPdf.startYHeaderInfo2;
      const marginLeftHeader2 = settingPdf.marginLeftHeader2;

      page.drawText("Vendor", {
        x: marginLeftHeader2,
        y: vendorY,
        size: settingPdf.fontSizeHeader,
        color: grayColor,
        font: fontBold,
      });
      vendorY -= spacing1;

      // Wrap vendor name if too long
      const maxWidth = 560 - marginLeftHeader2;
      const wrappedLines = wrapText({
        text: vendorName,
        font,
        fontSize: settingPdf.fontSizeHeader,
        maxWidth,
      });

      wrappedLines.forEach((line, index) => {
        page.drawText(line, {
          x: marginLeftHeader2,
          y: vendorY - index * settingPdf.spacingWrapText,
          size: settingPdf.fontSizeHeader,
          color: grayColor,
          font: font,
        });
      });

      separator(page, 680);
    };

    renderHeaderInfo();

    // ================ DOCUMENT BODY ================
    let yBody = initialYBody;

    // Regular Products Section
    const renderProductsSection = () => {
      if (listProducts.length === 0) return;

      // Check if we need a new page for the product section header
      yBody = checkAndCreateNewPage(yBody);

      // Draw initial header
      yBody = drawProductTableHeader(yBody, "Barang Purchase Order");

      listProducts.forEach((product) => {
        // Check if we need a new page before rendering the product
        if (yBody <= pageMarginBottom) {
          yBody = checkAndCreateNewPage(yBody);
          // Redraw header on new page
          yBody = drawProductTableHeader(yBody, "", false);
        }

        yBody = renderProductRow(product, yBody);
      });

      // Draw total for regular products
      yBody = drawTotalRow(yBody, grandTotalVendor);

      if (listBarterProducts.length !== 0) {
        yBody -= spacing2;
      }
    };

    // Barter Products Section
    const renderBarterProductsSection = () => {
      if (listBarterProducts.length === 0) return;

      // Force new page for barter products section
      page = pdfDoc.addPage(settingPdf.paperSizeA4);
      yBody = settingPdf.topMargin;

      // Draw initial header for barter products
      yBody = drawProductTableHeader(yBody, "Barang Barter");

      listBarterProducts.forEach((product) => {
        // Check if we need a new page before rendering the barter product
        if (yBody <= pageMarginBottom) {
          yBody = checkAndCreateNewPage(yBody);
          // Redraw header on new page without title
          yBody = drawProductTableHeader(yBody, "", false);
        }

        yBody = renderProductRow(product, yBody);
      });

      // Draw total for barter products
      yBody = drawTotalRow(yBody, grandTotalBarter);
    };

    // Grand Total Section
    const renderGrandTotal = () => {
      if (listProducts.length === 0) return;

      // Grand Total always follows immediately after the last Total
      yBody += 10; // Small spacing between Total and Grand Total

      const grandTotalLabelWidth = fontBold.widthOfTextAtSize(
        "Grand Total:",
        fontSize
      );
      page.drawText("Grand Total:", {
        x: xGrandTotal - grandTotalLabelWidth,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });

      const grandTotalWidth = fontBold.widthOfTextAtSize(grandTotal, fontSize);
      page.drawText(grandTotal, {
        x: settingPdf.marginRight - grandTotalWidth,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: fontBold,
      });
    };

    // Render all sections
    renderProductsSection();
    renderBarterProductsSection();
    renderGrandTotal();

    // ================ FOOTER ================
    const renderFooter = () => {
      // Check if we have enough space for footer
      const footerRequiredSpace = settingPdf.footerRequiredSpace;
      if (yBody - footerRequiredSpace < pageMarginBottom) {
        page = pdfDoc.addPage(settingPdf.paperSizeA4);
        yBody = settingPdf.startYAfterNewPage;
      }

      const xFooterLeft = marginLeft;
      const xLeftSignature = settingPdf.xLeftSignature;
      const xRightSignature = settingPdf.xRightSignature;
      const spaceSign = settingPdf.spaceSign;

      // Bank transfer information
      yBody -= spacing3;
      page.drawText("Silahkan transfer ke rekening:", {
        x: xFooterLeft,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      yBody -= spacing1;
      page.drawText("248 882 2298 BCA a/n PT TJAHAYA BERKAT ABADI", {
        x: xFooterLeft,
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Signature sections
      yBody -= spacing2;

      // Receiver signature (left side)
      const penerimaWidth = font.widthOfTextAtSize("Penerima", fontSize);
      page.drawText("Penerima", {
        x: xLeftSignature - (penerimaWidth / 2),
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      const receiverSignatureY = yBody - spaceSign;
      const signatureWidth = font.widthOfTextAtSize("( ................... )", fontSize);
      page.drawText("( ................... )", {
        x: xLeftSignature - (signatureWidth / 2),
        y: receiverSignatureY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Sender signature (right side)
      const denganHormatWidth = font.widthOfTextAtSize("Dengan Hormat,", fontSize);
      page.drawText("Dengan Hormat,", {
        x: xRightSignature - (denganHormatWidth / 2),
        y: yBody,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Michael Santoso signature
      const michaelSantosoWidth = font.widthOfTextAtSize("Michael Santoso", fontSize);
      page.drawText("Michael Santoso", {
        x: xRightSignature - (michaelSantosoWidth / 2),
        y: receiverSignatureY,
        size: fontSize,
        color: grayColor,
        font: font,
      });

      // Finance Dept
      const financeDeptWidth = font.widthOfTextAtSize("Finance Dept", fontSize);
      page.drawText("Finance Dept", {
        x: xRightSignature - (financeDeptWidth / 2),
        y: receiverSignatureY - spacing1,
        size: fontSize,
        color: grayColor,
        font: font,
      });
    };

    renderFooter();

    return pdfDoc.save();
  } catch (error) {
    throw error;
  }
};

module.exports = {
  TemplatePdfPurchaseOrder,
};

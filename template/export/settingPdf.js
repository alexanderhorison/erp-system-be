const { rgb } = require("pdf-lib");

const settingPdf = {
  // Colors
  color: rgb(92 / 255, 89 / 255, 103 / 255),

  // Font Sizes
  fontSize: 10,
  fontSizeHeader: 12,
  fontSizeTitle: 14,

  // Paper & Page Settings
  paperSizeA4: [595, 841],
  pageMarginTop: 40,
  pageMarginBottom: 80,
  startYAfterNewPage: 785,

  // Margins & Basic Positioning
  marginLeft: 40,
  marginRight: 555,
  marginLeftHeader1: 280,
  marginLeftHeader2: 400,

  // Spacing
  spacing1: 15,
  spacing2: 25,
  spacing3: 40,
  spacingProduct: 10,
  spacingWrapText: 15,
  spaceSignature: 60,

  // Header Positioning
  startYHeaderInfo: 785,
  startYHeaderInfo2: 785,

  // Table Column X Positions
  xUnit: 230,
  xQty: 300,
  xPrice: 380,
  xTotal: 500,

  // Body & Content Positioning
  yBody: 650,
  xGrandTotal: 450,

  // Footer Settings
  footerRequiredSpace: 120,
  xFooterRight: 545,
  spaceSign: 60,
  xLeftSignature: 120,
  xRightSignature: 480,

  notesMaxWidth: 500,
};
module.exports = settingPdf;

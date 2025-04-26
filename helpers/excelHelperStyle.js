const thinBorder = {
  style: "thin",
};

const styleBorder = {
  top: thinBorder,
  left: thinBorder,
  bottom: thinBorder,
  right: thinBorder,
};

const applyHeaderStyle = (row, color) => {
  row.eachCell((cell) => {
    cell.border = styleBorder;
    applyCellFill(cell, color);
  });
};

/**
 * Light Red : FFFFC1C1,
 * Light Blue : FFADD8E6,
 * Yellow : FFFFFF00
 */
const applyCellFill = (cell, color, type = "pattern", pattern = "solid") => {
  cell.fill = { type, pattern, fgColor: { argb: color } };
};

const styleExcel = {
  styleBorder,
  fontBold: { bold: true },
  centerMiddle: { horizontal: "center", vertical: "middle" },
};

module.exports = {
  applyHeaderStyle,
  applyCellFill,
  styleExcel,
};

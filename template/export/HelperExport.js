const { rgb } = require("pdf-lib");
const fs = require("fs");
const path = require("path");
const settingPdf = require("./settingPdf");

const GenerateHeader = async ({ page, pdfDoc, font, fontBold }) => {
  try {
    const grayColor = settingPdf.color;

    const data = {
      companyName: "TJAHAYA BERKAT ABADI",
      storeName: "Toko Jaya Makmur",
      address1: "Jl. Raya Kebayoran Lama No. 555",
      address2: "Grogol Selatan, Jakarta Selatan 12220",
      phone: "081807922555",
    };

    // Load and embed the PNG icon
    const iconPath = path.join(__dirname, "assets", "icon.png");
    const iconImageBytes = fs.readFileSync(iconPath);
    const iconImage = await pdfDoc.embedPng(iconImageBytes);

    let posY = 760; // Starting Y position for the header text
    const enterSpace = -18;
    const marginLeft = settingPdf.marginLeft;

    // Get image dimensions (smaller size for better proportion)
    const iconDims = iconImage.scale(0.13); // Scale to 30% of original size
    // Draw the icon (top left position)
    const iconPos = {
      x: marginLeft,
      y: 780,
    };

    page.drawImage(iconImage, {
      x: iconPos.x,
      y: iconPos.y,
      width: iconDims.width,
      height: iconDims.height,
    });

    // Company name - positioned next to the logo
    page.drawText(data.companyName, {
      x: marginLeft + iconDims.width + 10, // Position after logo with some spacing
      y: 785,
      size: settingPdf.fontSizeTitle,
      color: grayColor,
      font: fontBold,
    });
    // Store name
    page.drawText(data.storeName, {
      x: marginLeft,
      y: posY,
      size: settingPdf.fontSizeHeader,
      color: grayColor, // Gray color
      font: font,
    });
    posY += enterSpace;
    // Address line 1
    page.drawText(data.address1, {
      x: marginLeft,
      y: posY,
      size: settingPdf.fontSize,
      color: grayColor,
      font: font,
    });
    posY += enterSpace;

    // Address line 2
    page.drawText(data.address2, {
      x: marginLeft,
      y: posY,
      size: settingPdf.fontSize,
      color: grayColor,
      font: font,
    });
    posY += enterSpace;

    // Phone number
    page.drawText(data.phone, {
      x: marginLeft,
      y: posY,
      size: settingPdf.fontSize,
      color: grayColor,
      font: font,
    });
    posY += enterSpace;

    return page;
  } catch (error) {
    throw error;
  }
};

const drawDebugGrid = async ({ page, width, height, font }) => {
  const step = 10;
  for (let x = 0; x <= width; x += step) {
    page.drawText(`${x}`, { x: x + 2, y: height - 10, size: 4, font });
    page.drawLine({
      start: { x, y: 0 },
      end: { x, y: height },
      thickness: 0.1,
    });
  }

  for (let y = 0; y <= height; y += step) {
    page.drawText(`${y}`, { x: 2, y: y + 2, size: 4, font });
    page.drawLine({ start: { x: 0, y }, end: { x: width, y }, thickness: 0.1 });
  }
};

// Helper function to wrap text if it exceeds maximum width
const wrapText = ({ text, font, fontSize, maxWidth }) => {
  const words = text.split(" ");
  const lines = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const textWidth = font.widthOfTextAtSize(testLine, fontSize);

    if (textWidth <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        // Single word is too long, we need to break it
        lines.push(word);
        currentLine = "";
      }
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
};

const separator = (page, startY) => {
  const marginLeft = settingPdf.marginLeft;
  const marginRight = settingPdf.marginRight;
  page.drawLine({
    start: { x: marginLeft, y: startY },
    end: { x: marginRight, y: startY },
    thickness: 0.5,
    color: settingPdf.color,
  });
};

module.exports = {
  GenerateHeader,
  drawDebugGrid,
  wrapText,
  separator,
};

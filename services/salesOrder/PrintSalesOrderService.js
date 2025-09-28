const { virtualConsoleLogDotMatrix } = require("../../helpers/posFunction");

const {
  justifyLeft,
  justifyRight,
  addLine,
} = require("../../helpers/posFunction");
const { formatDateWithSlash } = require("../../helpers/formatDate");
const { priceFormat } = require("../../helpers/priceFormat");
const ConfigService = require("../config/configService");
const { numberToText } = require("../../helpers/numberToText");
const { spawn } = require("child_process");
const os = require("os");
const fs = require("fs");
const path = require("path");

class PrintSalesOrderService {
  static async print(data) {
    try {
      const configPrinter = await ConfigService.get({
        query: { key: "PRINTER_SERVER" },
      });

      const printerInfo = configPrinter.value_json;

      const printerSetting = {
        maxCol: 80, // Lebar kolom untuk dot matrix printer
        ip: printerInfo.ipServer, // IP pc server
        port: printerInfo.port, // PC Server yang terhubung ke printer
        printerIp: printerInfo.ipPrinter, // IP Printer Server
        hostName: printerInfo.hostName || "LX-310", // Epson LX-310 Dot Matrix
        queueName: printerInfo.queueName || "lp", // Nama queue printer
        targetLines: 41, // Jumlah baris per halaman
        tearOffset: 12, // Offset untuk perforasi kertas
      };

      const colSize = {
        productName: 29,
        unit: 9,
        quantity: 9,
        price: 14,
        total: 15,
        pos1: 0,
        pos2: 40,
        pos3: 15,
      };

      const headerTable = [
        justifyLeft("PRODUK", colSize.productName),
        justifyLeft("UNIT", colSize.unit),
        justifyRight("KUANTITI", colSize.quantity),
        justifyRight("HARGA", colSize.price),
        justifyRight("JUMLAH", colSize.total),
      ].join(" ");

      const configCompany = await ConfigService.get({
        query: { key: "COMPANY_INFO" },
      });
      const companyInfo = configCompany.value_json;

      // COMPANY INFO
      let printString = "";

      // Set 8 LPI (Lines Per Inch) untuk spacing yang lebih rapat
      printString += "\x1B0"; // ESC 0 - Set line spacing to 8 LPI

      // Nama toko dan tanggal cetak di baris yang sama
      const companyName = companyInfo.companyName;
      const printDate = `Tgl Cetak: ${formatDateWithSlash(new Date())}`;
      const spacingLength =
        printerSetting.maxCol - companyName.length - printDate.length;

      printString +=
        companyName + " ".repeat(Math.max(spacingLength, 1)) + printDate + "\n";
      printString +=
        justifyLeft(companyInfo.address, printerSetting.maxCol) + "\n";
      printString +=
        justifyLeft(`Telp: ${companyInfo.phoneNumber}`, printerSetting.maxCol) +
        "\n";
      printString += addLine(printerSetting.maxCol) + "\n";

      // Faktur info
      printString +=
        `No. SO      : ${data.code}`.padEnd(colSize.pos2) +
        `Pelanggan : ${data.customer?.name || "-"}\n`;
      printString +=
        `Tgl SO      : ${formatDateWithSlash(data.approvedAt)}`.padEnd(
          colSize.pos2
        ) + `Alamat    : ${data.customer?.address || "-"}\n`;
      printString +=
        `Jth Tempo   : ${data.dueDate}`.padEnd(colSize.pos2) +
        `No. Telp  : ${data.customer?.phoneNumber || "-"}\n`;
      printString += addLine(printerSetting.maxCol) + "\n";

      // Table header (PRODUK, UNIT, KUANTITI, HARGA, JUMLAH)
      printString += headerTable + "\n";
      printString += addLine(printerSetting.maxCol) + "\n";

      // Items
      let totalItems = 0;
      let totalSalesOrderItems = 0;
      data.listProducts.forEach((item) => {
        let name = item.productName || "-";
        let unit = item.unitName || "-";
        const qtyStr = `${item.quantity}`;
        const harga = priceFormat(item.price);
        const total = priceFormat(item.subTotal);

        // Wrap text untuk nama produk jika terlalu panjang
        const maxNameLength = colSize.productName; // Dikurangi 1 untuk spasi
        if (name.length > maxNameLength) {
          // Split berdasarkan spasi untuk membuat wrap text yang benar
          const words = name.split(" ");
          let firstName = "";
          let restName = "";
          let isFirstLineFull = false;

          for (let i = 0; i < words.length; i++) {
            const testLine = firstName + (firstName ? " " : "") + words[i];
            if (testLine.length <= maxNameLength && !isFirstLineFull) {
              firstName = testLine;
            } else {
              isFirstLineFull = true;
              restName += (restName ? " " : "") + words[i];
            }
          }

          // Cetak baris pertama dengan semua kolom
          printString +=
            justifyLeft(firstName, colSize.productName) +
            " " +
            justifyLeft(
              unit.length > 9 ? unit.substring(0, 9) : unit,
              colSize.unit
            ) +
            " " +
            justifyRight(qtyStr, colSize.quantity) +
            " " +
            justifyRight(harga, colSize.price) +
            " " +
            justifyRight(total, colSize.total) +
            "\n";

          // Cetak baris kedua hanya nama sisanya jika ada
          if (restName) {
            printString += justifyLeft(restName, colSize.productName) + "\n";
          }
        } else {
          // Nama tidak terlalu panjang, cetak normal
          printString +=
            justifyLeft(name, colSize.productName) +
            " " +
            justifyLeft(
              unit.length > colSize.unit
                ? unit.substring(0, colSize.unit)
                : unit,
              colSize.unit
            ) +
            " " +
            justifyRight(qtyStr, colSize.quantity) +
            " " +
            justifyRight(harga, colSize.price) +
            " " +
            justifyRight(total, colSize.total) +
            "\n";
        }
        totalItems += 1; // Hitung total item (jumlah produk), bukan kuantiti
        totalSalesOrderItems += 1;
      });

      // Tambahkan listBarterProducts jika ada
      if (data.listBarterProducts && data.listBarterProducts.length > 0) {
        // Tampilkan total sales order items hanya ketika ada barang barter
        printString += addLine(printerSetting.maxCol) + "\n";
        printString += `Sales Order: ${totalSalesOrderItems} items\n`;
        printString += addLine(printerSetting.maxCol) + "\n";
        printString += "BARANG BARTER:\n";
        printString += addLine(printerSetting.maxCol) + "\n";

        let totalBarterItems = 0;
        data.listBarterProducts.forEach((item) => {
          let name = item.productName || "-";
          let unit = item.unitName || "-";
          const qtyStr = `${item.quantity}`;
          const harga = priceFormat(item.price);
          const total = priceFormat(item.subTotal);

          // Wrap text untuk nama produk jika terlalu panjang
          const maxNameLength = colSize.productName; // Dikurangi 1 untuk spasi
          if (name.length > maxNameLength) {
            // Split berdasarkan spasi untuk membuat wrap text yang benar
            const words = name.split(" ");
            let firstName = "";
            let restName = "";
            let isFirstLineFull = false;

            for (let i = 0; i < words.length; i++) {
              const testLine = firstName + (firstName ? " " : "") + words[i];
              if (testLine.length <= maxNameLength && !isFirstLineFull) {
                firstName = testLine;
              } else {
                isFirstLineFull = true;
                restName += (restName ? " " : "") + words[i];
              }
            }

            // Cetak baris pertama dengan semua kolom
            printString +=
              justifyLeft(firstName, colSize.productName) +
              " " +
              justifyLeft(
                unit.length > colSize.unit
                  ? unit.substring(0, colSize.unit)
                  : unit,
                colSize.unit
              ) +
              " " +
              justifyRight(qtyStr, colSize.quantity) +
              " " +
              justifyRight(harga, colSize.price) +
              " " +
              justifyRight(total, colSize.total) +
              "\n";

            // Cetak baris kedua hanya nama sisanya jika ada
            if (restName) {
              printString += justifyLeft(restName, colSize.productName) + "\n";
            }
          } else {
            // Nama tidak terlalu panjang, cetak normal
            printString +=
              justifyLeft(name, colSize.productName) +
              " " +
              justifyLeft(
                unit.length > colSize.unit
                  ? unit.substring(0, colSize.unit)
                  : unit,
                colSize.unit
              ) +
              " " +
              justifyRight(qtyStr, colSize.quantity) +
              " " +
              justifyRight(harga, colSize.price) +
              " " +
              justifyRight(total, colSize.total) +
              "\n";
          }
          totalItems += 1; // Hitung total item barter juga
          totalBarterItems += 1;
        });

        // Tampilkan total barter items
        printString += addLine(printerSetting.maxCol) + "\n";
        printString += `Barter: ${totalBarterItems} items\n`;
        printString += addLine(printerSetting.maxCol) + "\n";
      } else {
        // Jika tidak ada barang barter, tambahkan garis pemisah setelah items sales order
        printString += addLine(printerSetting.maxCol) + "\n";
      }

      printString += `Total: ${totalItems} items\n`;
      printString += addLine(printerSetting.maxCol) + "\n";

      // Total dengan Terbilang
      let terbilangText = "";
      try {
        terbilangText = numberToText(data.grandTotal || 0);
      } catch (error) {
        terbilangText = "nominal tidak valid";
      }

      // Total dengan Terbilang - sejajar dengan header HARGA
      const terbilangWords = terbilangText
        .split(" ")
        .filter((word) => word.length > 0);

      // Hitung posisi kolom HARGA berdasarkan header table
      const hargaStartPosition =
        colSize.productName + 1 + colSize.unit + 1 + colSize.quantity + 1; // +1 untuk spasi
      const hargaEndPosition = hargaStartPosition + colSize.price;
      const totalStartPosition = hargaStartPosition;

      // Helper function untuk safe justify right
      const safeJustifyRight = (str, length) => {
        if (str.length >= length) {
          return str.substring(0, length);
        }
        return justifyRight(str, length);
      };

      // Baris pertama: Terbilang dan TOTAL sejajar dengan kolom HARGA
      printString +=
        "Terbilang:".padEnd(totalStartPosition) +
        justifyRight("TOTAL:", colSize.price) +
        " " +
        justifyRight(priceFormat(data.grandTotal), colSize.total) +
        "\n";

      // Items untuk kolom kanan
      const rightColumnItems = [
        { label: "HUTANG :", value: priceFormat(data.amountDebt) },
        { label: "BAYAR :", value: priceFormat(data.amountPaid) },
        { label: "POTONGAN :", value: "0" },
      ];

      // Pecah terbilang menjadi beberapa baris
      let currentLine = "";
      let lineIndex = 0;

      for (let i = 0; i < terbilangWords.length; i++) {
        const word = terbilangWords[i];
        const testLine = currentLine + (currentLine ? " " : "") + word;

        if (
          testLine.length <= totalStartPosition - 2 &&
          i < terbilangWords.length - 1
        ) {
          currentLine = testLine;
        } else {
          // Jika ini kata terakhir atau sudah mencapai batas, cetak baris
          if (i === terbilangWords.length - 1) {
            currentLine = testLine;
          }

          if (lineIndex < rightColumnItems.length) {
            const item = rightColumnItems[lineIndex];
            printString +=
              justifyLeft(currentLine, totalStartPosition) +
              justifyRight(item.label, colSize.price) +
              " " +
              justifyRight(item.value, colSize.total) +
              "\n";
          } else {
            printString +=
              justifyLeft(currentLine, printerSetting.maxCol) + "\n";
          }

          if (i < terbilangWords.length - 1) {
            currentLine = word;
          }
          lineIndex++;
        }
      }

      // Cetak sisa kolom kanan yang belum tercetak
      while (lineIndex < rightColumnItems.length) {
        const item = rightColumnItems[lineIndex];
        printString +=
          " ".repeat(totalStartPosition) +
          justifyRight(item.label, colSize.price) +
          " " +
          justifyRight(item.value, colSize.total) +
          "\n";
        lineIndex++;
      }
      printString += addLine(printerSetting.maxCol) + "\n";
      printString +=
        justifyRight(`${data.amountDebt == 0 ? "TOTAL:" : "SISA HUTANG:"}`, printerSetting.maxCol - colSize.pos3) +
        justifyRight(priceFormat(data.amountDebt == 0 ? data.grandTotal : data.amountDebt), colSize.pos3) +
        "\n";
      printString += addLine(printerSetting.maxCol) + "\n";

      // Footer dengan positioning spesifik
      const penerimaFromLeft = 15; // Penerima 15 kolom dari kiri
      const hormatKamiFromRight = 15; // Hormat Kami 15 space dari kanan
      const signatureLength = 15; // Panjang (..............)

      // Hitung posisi signature terlebih dahulu
      const penerimaSignaturePosition = penerimaFromLeft;
      const hormatKamiSignaturePosition =
        printerSetting.maxCol - hormatKamiFromRight - signatureLength;

      // Hitung posisi text agar centered dengan signature
      const penerimaTextPosition =
        penerimaSignaturePosition +
        Math.floor((signatureLength - "Penerima".length) / 2);
      const hormatKamiTextPosition =
        hormatKamiSignaturePosition +
        Math.floor((signatureLength - "Hormat Kami".length) / 2);

      printString +=
        " ".repeat(penerimaTextPosition) +
        "Penerima" +
        " ".repeat(
          hormatKamiTextPosition - penerimaTextPosition - "Penerima".length
        ) +
        "Hormat Kami" +
        "\n\n\n";
      printString +=
        " ".repeat(penerimaSignaturePosition) +
        "(.............)" +
        " ".repeat(
          hormatKamiSignaturePosition -
          penerimaSignaturePosition -
          signatureLength
        ) +
        "(.............)" +
        "\n\n";
      printString +=
        justifyLeft("Silahkan transfer ke rekening:", printerSetting.maxCol) +
        "\n";
      printString +=
        justifyLeft(
          "248 882 2298 BCA a/n PT TJAHAYA BERKAT ABADI",
          printerSetting.maxCol
        ) + "\n";
      printString += "\x0C"; // Form feed

      return { string: printString, printerSetting };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

module.exports = PrintSalesOrderService;

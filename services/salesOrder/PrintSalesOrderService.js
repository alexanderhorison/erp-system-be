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

  static createHeaderV3(data, companyInfo, printerSetting, colSize, headerTable, pageNumber, totalPages) {
    let header = "";

    // Nama toko dan tanggal cetak di baris yang sama, tambahkan page number di kanan
    const companyName = companyInfo.companyName;
    const printDate = `Tgl Cetak: ${formatDateWithSlash(new Date())}`;
    const pageInfo = `(${pageNumber}/${totalPages})`;

    // Hitung spacing - page info 5 karakter dari tgl cetak
    const spacingBetweenCompanyAndDate = printerSetting.maxCol - companyName.length - printDate.length - 5 - pageInfo.length;

    header += companyName + " ".repeat(Math.max(spacingBetweenCompanyAndDate, 1)) + printDate + " ".repeat(5) + pageInfo + "\n"; // 1
    header += justifyLeft(companyInfo.address, printerSetting.maxCol) + "\n"; // 2
    header += justifyLeft(`Telp: ${companyInfo.phoneNumber}`, printerSetting.maxCol) + "\n"; // 3
    header += addLine(printerSetting.maxCol) + "\n"; // 4

    // Faktur info
    header += `No. SO      : ${data.code}`.padEnd(colSize.pos2) + `Pelanggan : ${data.customer?.name || "-"}\n`; // 5
    header += `Tgl SO      : ${formatDateWithSlash(data.approvedAt)}`.padEnd(colSize.pos2) + `Alamat    : ${data.customer?.address || "-"}\n`; // 6
    header += `Jth Tempo   : ${data.dueDate}`.padEnd(colSize.pos2) + `No. Telp  : ${data.customer?.phoneNumber || "-"}\n`; // 7
    header += addLine(printerSetting.maxCol) + "\n"; // 8

    // Table header
    header += headerTable + "\n"; // 9
    header += addLine(printerSetting.maxCol) + "\n"; // 10

    return header;
  }

  static createProductTableV3(listProducts, productIndex, maxProduct, colSize) {
    const totalProducts = listProducts.length;
    let productLines = [];
    let currentProductLinesCount = 0;
    let productsInCurrentPage = 0;

    // Kumpulkan produk untuk halaman ini berdasarkan baris, bukan jumlah produk
    while (productIndex < totalProducts && currentProductLinesCount < maxProduct) {
      const item = listProducts[productIndex];

      let name = item.productName || "-";
      let unit = item.unitName || "-";
      const qtyStr = `${item.quantity}`;
      const harga = priceFormat(item.price);
      const total = priceFormat(item.subTotal);

      // Wrap text untuk nama produk jika terlalu panjang
      const maxNameLength = colSize.productName;
      let productLinesForThisItem = [];

      if (name.length > maxNameLength) {
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

        productLinesForThisItem.push(justifyLeft(firstName, colSize.productName) + " " +
          justifyLeft(unit.length > 9 ? unit.substring(0, 9) : unit, colSize.unit) + " " +
          justifyRight(qtyStr, colSize.quantity) + " " +
          justifyRight(harga, colSize.price) + " " +
          justifyRight(total, colSize.total));

        if (restName) {
          productLinesForThisItem.push(justifyLeft(restName, colSize.productName));
        }
      } else {
        productLinesForThisItem.push(justifyLeft(name, colSize.productName) + " " +
          justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
          justifyRight(qtyStr, colSize.quantity) + " " +
          justifyRight(harga, colSize.price) + " " +
          justifyRight(total, colSize.total));
      }

      // Cek apakah masih bisa masuk ke halaman ini
      if (currentProductLinesCount + productLinesForThisItem.length <= maxProduct) {
        productLines.push(...productLinesForThisItem);
        currentProductLinesCount += productLinesForThisItem.length;
        productIndex++;
        productsInCurrentPage++;
      } else {
        // Tidak bisa masuk, stop dan pindah ke halaman berikutnya
        break;
      }
    }

    return {
      productLines,
      newProductIndex: productIndex,
      productsInCurrentPage,
      linesUsed: currentProductLinesCount
    };
  }

  static createBarterTableV3(listBarterProducts, barterIndex, remainingLines, colSize, printerMaxCol, totalSalesOrderItems) {
    const totalBarterProducts = listBarterProducts.length;
    let barterLines = [];
    let currentLinesCount = 0;
    let isComplete = false;

    // Jika ini awal barter, tambahkan header (membutuhkan 5 baris)
    if (barterIndex === 0) {
      const headerNeeded = 5; // line + "Sales Order: X items" + line + "BARANG BARTER:" + line
      if (remainingLines >= headerNeeded) {
        barterLines.push(addLine(printerMaxCol));
        barterLines.push(`Sales Order: ${totalSalesOrderItems} items`);
        barterLines.push(addLine(printerMaxCol));
        barterLines.push("BARANG BARTER:");
        barterLines.push(addLine(printerMaxCol));
        currentLinesCount += headerNeeded;
      } else {
        // Tidak cukup ruang untuk header, kembalikan kosong
        return {
          barterLines: [],
          newBarterIndex: barterIndex,
          linesUsed: 0,
          isComplete: false
        };
      }
    }

    // Kumpulkan produk barter untuk halaman ini
    while (barterIndex < totalBarterProducts && currentLinesCount < remainingLines) {
      const item = listBarterProducts[barterIndex];

      let name = item.productName || "-";
      let unit = item.unitName || "-";
      const qtyStr = `${item.quantity}`;
      const harga = priceFormat(item.price);
      const total = priceFormat(item.subTotal);

      // Wrap text untuk nama produk jika terlalu panjang
      const maxNameLength = colSize.productName;
      let barterLinesForThisItem = [];

      if (name.length > maxNameLength) {
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

        barterLinesForThisItem.push(justifyLeft(firstName, colSize.productName) + " " +
          justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
          justifyRight(qtyStr, colSize.quantity) + " " +
          justifyRight(harga, colSize.price) + " " +
          justifyRight(total, colSize.total));

        if (restName) {
          barterLinesForThisItem.push(justifyLeft(restName, colSize.productName));
        }
      } else {
        barterLinesForThisItem.push(justifyLeft(name, colSize.productName) + " " +
          justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
          justifyRight(qtyStr, colSize.quantity) + " " +
          justifyRight(harga, colSize.price) + " " +
          justifyRight(total, colSize.total));
      }

      // Cek apakah masih bisa masuk ke halaman ini
      if (currentLinesCount + barterLinesForThisItem.length <= remainingLines) {
        barterLines.push(...barterLinesForThisItem);
        currentLinesCount += barterLinesForThisItem.length;
        barterIndex++;
      } else {
        // Tidak bisa masuk, stop
        break;
      }
    }

    // Jika semua barter sudah selesai, tambahkan footer barter (membutuhkan 3 baris)
    if (barterIndex >= totalBarterProducts) {
      const footerNeeded = 3; // line + "Barter: X items" + line
      if (currentLinesCount + footerNeeded <= remainingLines) {
        barterLines.push(addLine(printerMaxCol));
        barterLines.push(`Barter: ${totalBarterProducts} items`);
        barterLines.push(addLine(printerMaxCol));
        currentLinesCount += footerNeeded;
        isComplete = true;
      }
    }

    return {
      barterLines,
      newBarterIndex: barterIndex,
      linesUsed: currentLinesCount,
      isComplete
    };
  }

  static createFooterV3(data, printerSetting, colSize, isLastPage) {
    let footer = "";

    if (isLastPage) {
      // Footer lengkap dengan total, terbilang, dll
      let totalItems = data.listProducts.length;

      // Tambahkan total barter jika ada
      if (data.listBarterProducts && data.listBarterProducts.length > 0) {
        totalItems += data.listBarterProducts.length;
      }

      footer += addLine(printerSetting.maxCol) + "\n";
      footer += `Total: ${totalItems} items\n`;
      footer += addLine(printerSetting.maxCol) + "\n";

      // Total dengan Terbilang
      let terbilangText = "";
      try {
        terbilangText = numberToText(data.grandTotal || 0);
      } catch (error) {
        terbilangText = "nominal tidak valid";
      }

      const terbilangWords = terbilangText.split(" ").filter((word) => word.length > 0);
      const hargaStartPosition = colSize.productName + 1 + colSize.unit + 1 + colSize.quantity + 1;
      const totalStartPosition = hargaStartPosition;

      // Baris pertama: Terbilang dan TOTAL
      footer += "Terbilang :".padEnd(totalStartPosition) +
        justifyRight("TOTAL :", colSize.price) + " " +
        justifyRight(priceFormat(data.grandTotal), colSize.total) + "\n";

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

        if (testLine.length <= totalStartPosition - 2 && i < terbilangWords.length - 1) {
          currentLine = testLine;
        } else {
          if (i === terbilangWords.length - 1) {
            currentLine = testLine;
          }

          if (lineIndex < rightColumnItems.length) {
            const item = rightColumnItems[lineIndex];
            footer += justifyLeft(currentLine, totalStartPosition) +
              justifyRight(item.label, colSize.price) + " " +
              justifyRight(item.value, colSize.total) + "\n";
          } else {
            footer += justifyLeft(currentLine, printerSetting.maxCol) + "\n";
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
        footer += " ".repeat(Math.max(0, totalStartPosition)) +
          justifyRight(item.label, colSize.price) + " " +
          justifyRight(item.value, colSize.total) + "\n";
        lineIndex++;
      }

      footer += addLine(printerSetting.maxCol) + "\n";
      footer += justifyRight(`${data.amountDebt == 0 ? "TOTAL :" : "SISA HUTANG :"}`, printerSetting.maxCol - colSize.pos3) +
        justifyRight(priceFormat(data.amountDebt == 0 ? data.grandTotal : data.amountDebt), colSize.pos3) + "\n";
      footer += addLine(printerSetting.maxCol) + "\n";

      // Footer dengan positioning spesifik - sesuaikan dengan lebar kertas
      let penerimaFromLeft, hormatKamiFromRight, signatureLength;

      if (printerSetting.maxCol < 50) {
        // Untuk printer kecil (5 inch, maxCol 42)
        penerimaFromLeft = 2;
        hormatKamiFromRight = 2;
        signatureLength = 10;
      } else {
        // Untuk printer besar (11 inch, maxCol 80)
        penerimaFromLeft = 15;
        hormatKamiFromRight = 15;
        signatureLength = 15;
      }

      const penerimaSignaturePosition = penerimaFromLeft;
      const hormatKamiSignaturePosition = Math.max(
        penerimaSignaturePosition + signatureLength + 2,
        printerSetting.maxCol - hormatKamiFromRight - signatureLength
      );

      const penerimaTextPosition = penerimaSignaturePosition + Math.floor((signatureLength - "Penerima".length) / 2);
      const hormatKamiTextPosition = hormatKamiSignaturePosition + Math.floor((signatureLength - "Hormat Kami".length) / 2);

      const spaceBetweenPenerimaAndHormat = Math.max(0, hormatKamiTextPosition - penerimaTextPosition - "Penerima".length);
      const spaceBetweenSignatures = Math.max(0, hormatKamiSignaturePosition - penerimaSignaturePosition - signatureLength);

      footer += " ".repeat(Math.max(0, penerimaTextPosition)) + "Penerima" +
        " ".repeat(spaceBetweenPenerimaAndHormat) + "Hormat Kami" + "\n\n\n";
      footer += " ".repeat(Math.max(0, penerimaSignaturePosition)) + "(.............)" +
        " ".repeat(spaceBetweenSignatures) + "(.............)" + "\n\n";
      footer += justifyLeft("Silahkan transfer ke rekening:", printerSetting.maxCol) + "\n";

      // Potong teks rekening jika terlalu panjang untuk printer kecil
      const rekeningText = "248 882 2298 BCA a/n PT TJAHAYA BERKAT ABADI";
      footer += justifyLeft(rekeningText.substring(0, printerSetting.maxCol), printerSetting.maxCol) + "\n";
    } else {
      // Footer template untuk halaman yang bukan terakhir (tanpa text/value, hanya struktur)
      footer += addLine(printerSetting.maxCol) + "\n"; // Garis atas
      footer += "\n"; // Baris kosong untuk "Total: X items"
      footer += addLine(printerSetting.maxCol) + "\n"; // Garis

      footer += "\n"; // Baris kosong untuk "Terbilang + TOTAL"
      footer += "\n"; // Baris kosong untuk "HUTANG"
      footer += "\n"; // Baris kosong untuk "BAYAR"
      footer += "\n"; // Baris kosong untuk "POTONGAN"

      footer += addLine(printerSetting.maxCol) + "\n"; // Garis
      footer += "\n"; // Baris kosong untuk "SISA HUTANG/TOTAL"
      footer += addLine(printerSetting.maxCol) + "\n"; // Garis

      footer += "\n"; // Baris kosong untuk "Penerima & Hormat Kami"
      footer += "\n"; // Spacing
      footer += "\n"; // Spacing
      footer += "\n"; // Baris kosong untuk signature
      footer += "\n"; // Spacing
      footer += "\n"; // Baris kosong untuk "Silahkan transfer"
      footer += "\n"; // Baris kosong untuk nomor rekening
    }

    return footer;
  }

  static async print11inch(data) {
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
        targetLines: 32, // Jumlah baris per halaman
        newPageEnterLine: 3,
        maxProduct: 38,
      };
      const maxProduct = printerSetting.maxProduct;
      const colSize = {
        productName: 29,
        unit: 9,
        quantity: 9,
        price: 14,
        total: 15,
        pos1: 0,
        pos2: 40,
        pos3: 16,
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

      // Hitung total halaman berdasarkan jumlah baris produk (bukan jumlah produk)
      let totalProductLines = 0;

      // Validasi data.listProducts ada dan array
      if (!data.listProducts || !Array.isArray(data.listProducts)) {
        data.listProducts = [];
      }

      data.listProducts.forEach((item) => {
        let name = item.productName || "-";
        const maxNameLength = colSize.productName;

        if (name.length > maxNameLength) {
          // Produk dengan nama panjang akan menggunakan 2 baris
          totalProductLines += 2;
        } else {
          // Produk dengan nama normal menggunakan 1 baris
          totalProductLines += 1;
        }
      });

      // Jika ada barang barter, hitung juga baris yang dibutuhkan
      if (data.listBarterProducts && Array.isArray(data.listBarterProducts) && data.listBarterProducts.length > 0) {
        // Header barter membutuhkan 5 baris (line + "Sales Order: X items" + line + "BARANG BARTER:" + line)
        totalProductLines += 5;

        data.listBarterProducts.forEach((item) => {
          let name = item.productName || "-";
          const maxNameLength = colSize.productName;

          if (name.length > maxNameLength) {
            totalProductLines += 2;
          } else {
            totalProductLines += 1;
          }
        });

        // Footer barter membutuhkan 3 baris (line + "Barter: X items" + line)
        totalProductLines += 3;
      }

      // Maksimal maxProduct baris per halaman, pastikan minimal 1 halaman
      const totalPages = totalProductLines > 0 ? Math.ceil(totalProductLines / maxProduct) : 1;

      let printString = "";
      // Set font size 11 dan LPI 9
      printString += "\x1B\x4D"; // Set LPI to 9 (ESC M)
      printString += "\x1B\x58\x00\x0B\x00"; // Set font size to 11 (ESC X 0 11 0)

      let currentPage = 1;
      let productIndex = 0;
      let barterIndex = 0;
      const totalProducts = data.listProducts.length;
      const hasBarterProducts = data.listBarterProducts && data.listBarterProducts.length > 0;
      const totalBarterProducts = hasBarterProducts ? data.listBarterProducts.length : 0;
      let barterStarted = false;
      let barterCompleted = false;

      // Loop untuk setiap halaman
      while (productIndex < totalProducts || (hasBarterProducts && !barterCompleted)) {
        const isLastPage = currentPage === totalPages;
        let currentLineCount = 0;

        // Tambahkan header (10 baris) menggunakan function terpisah
        printString += this.createHeaderV3(data, companyInfo, printerSetting, colSize, headerTable, currentPage, totalPages);
        currentLineCount += 10;

        let remainingLines = maxProduct;
        let allLines = [];

        // Jika masih ada produk biasa, tambahkan
        if (productIndex < totalProducts) {
          const productResult = this.createProductTableV3(data.listProducts, productIndex, remainingLines, colSize);
          allLines.push(...productResult.productLines);
          productIndex = productResult.newProductIndex;
          remainingLines -= productResult.linesUsed;
        }

        // Jika produk sudah habis dan ada barter, coba tambahkan barter
        if (productIndex >= totalProducts && hasBarterProducts && !barterCompleted) {
          const totalSalesOrderItems = data.listProducts.length;
          const barterResult = this.createBarterTableV3(
            data.listBarterProducts,
            barterIndex,
            remainingLines,
            colSize,
            printerSetting.maxCol,
            totalSalesOrderItems
          );

          if (barterResult.linesUsed > 0) {
            allLines.push(...barterResult.barterLines);
            barterIndex = barterResult.newBarterIndex;
            barterStarted = true;
            barterCompleted = barterResult.isComplete;
            remainingLines -= barterResult.linesUsed;
          }
        }

        // Cetak semua lines dan pastikan selalu ada maxProduct baris
        for (let i = 0; i < maxProduct; i++) {
          if (i < allLines.length) {
            printString += allLines[i] + "\n";
          } else {
            printString += "\n"; // Baris kosong
          }
          currentLineCount++;
        }

        // Jika ini halaman terakhir dan semua sudah selesai, cetak footer lengkap
        const allDone = productIndex >= totalProducts && (!hasBarterProducts || barterCompleted);

        if (allDone) {
          // Halaman terakhir: isi dengan footer lengkap menggunakan function terpisah
          printString += this.createFooterV3(data, printerSetting, colSize, true);
        } else {
          // Halaman bukan terakhir: isi dengan template footer kosong dalam 17 baris
          printString += addLine(printerSetting.maxCol) + "\n"; // 1
          printString += "\n"; // 2 - Total items
          printString += addLine(printerSetting.maxCol) + "\n"; // 3
          printString += "\n"; // 4 - Terbilang + TOTAL
          printString += "\n"; // 5 - HUTANG
          printString += "\n"; // 6 - BAYAR  
          printString += "\n"; // 7 - POTONGAN
          printString += addLine(printerSetting.maxCol) + "\n"; // 8
          printString += "\n"; // 9 - SISA HUTANG/TOTAL
          printString += addLine(printerSetting.maxCol) + "\n"; // 10
          printString += "\n"; // 11 - Penerima & Hormat Kami
          printString += "\n"; // 12
          printString += "\n"; // 13
          printString += "\n"; // 14 - Signature
          printString += "\n"; // 15
          printString += "\n"; // 16 - Transfer info
          printString += "\n"; // 17 - Nomor rekening
        }

        // Form feed dan 3 enter untuk halaman baru (kecuali halaman terakhir)
        if (!allDone) {
          printString += "\n"; // 3 enter
        }
        currentPage++;
      }

      // virtualConsoleLogDotMatrix(printString);

      return { string: printString, printerSetting };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  static async print5inch(data) {
    try {
      const configPrinter = await ConfigService.get({
        query: { key: "PRINTER_SERVER" },
      });

      const printerInfo = configPrinter.value_json;

      const printerSetting = {
        maxCol: 80, // Lebar kolom sama dengan 11 inch (dot matrix 9.5 inch)
        ip: printerInfo.ipServer,
        port: printerInfo.port,
        printerIp: printerInfo.ipPrinter,
        hostName: printerInfo.hostName || "LX-310",
        queueName: printerInfo.queueName || "lp",
        targetLines: 16,
        newPageEnterLine: 3,
        maxProduct: 5, // Maksimal 5 produk per kertas (fixed template)
      };

      const maxProduct = printerSetting.maxProduct;
      const colSize = {
        productName: 29,
        unit: 9,
        quantity: 9,
        price: 14,
        total: 15,
        pos1: 0,
        pos2: 40,
        pos3: 16,
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

      // Validasi data.listProducts ada dan array
      if (!data.listProducts || !Array.isArray(data.listProducts)) {
        data.listProducts = [];
      }

      // Validasi data.listBarterProducts
      if (!data.listBarterProducts || !Array.isArray(data.listBarterProducts)) {
        data.listBarterProducts = [];
      }

      // Hitung total halaman - maksimal 5 produk per halaman (tidak dihitung per baris)
      const totalProducts = data.listProducts.length;
      const totalBarterProducts = data.listBarterProducts.length;
      const hasBarterProducts = totalBarterProducts > 0;

      // Total halaman = halaman produk normal + halaman barter (jika ada)
      let totalPages = totalProducts > 0 ? Math.ceil(totalProducts / maxProduct) : 1;
      if (hasBarterProducts) {
        totalPages += Math.ceil(totalBarterProducts / maxProduct);
      }

      let printString = "";
      // Set font size 11 dan LPI 9 (sama dengan 11 inch)
      printString += "\x1B\x4D"; // Set LPI to 9 (ESC M)
      printString += "\x1B\x58\x00\x0B\x00"; // Set font size to 11 (ESC X 0 11 0)

      let currentPage = 1;
      let productIndex = 0;

      // Loop untuk setiap halaman PRODUK NORMAL
      while (productIndex < totalProducts) {
        // Header - SELALU TAMPIL di setiap kertas
        printString += this.createHeaderV3(data, companyInfo, printerSetting, colSize, headerTable, currentPage, totalPages);

        // Body - maksimal 5 BARIS (bukan 5 produk!)
        // Kalau nama panjang pakai 2 baris, berarti cuma muat 2-3 produk
        let linesUsedInPage = 0;
        const maxLines = 5; // Maksimal 5 baris untuk body

        while (linesUsedInPage < maxLines && productIndex < totalProducts) {
          const item = data.listProducts[productIndex];

          let name = item.productName || "-";
          let unit = item.unitName || "-";
          const qtyStr = `${item.quantity}`;
          const harga = priceFormat(item.price);
          const total = priceFormat(item.subTotal);

          // Hitung berapa baris yang dibutuhkan produk ini
          const maxNameLength = colSize.productName;
          let linesNeeded = 1; // Minimal 1 baris

          if (name.length > maxNameLength) {
            linesNeeded = 2; // Nama panjang butuh 2 baris
          }

          // Cek apakah masih cukup ruang untuk produk ini
          if (linesUsedInPage + linesNeeded > maxLines) {
            // Tidak cukup ruang, skip ke halaman berikutnya
            break;
          }

          // Cetak produk
          if (name.length > maxNameLength) {
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

            printString += justifyLeft(firstName, colSize.productName) + " " +
              justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
              justifyRight(qtyStr, colSize.quantity) + " " +
              justifyRight(harga, colSize.price) + " " +
              justifyRight(total, colSize.total) + "\n";
            linesUsedInPage++;

            if (restName) {
              printString += justifyLeft(restName, colSize.productName) + "\n";
              linesUsedInPage++;
            }
          } else {
            printString += justifyLeft(name, colSize.productName) + " " +
              justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
              justifyRight(qtyStr, colSize.quantity) + " " +
              justifyRight(harga, colSize.price) + " " +
              justifyRight(total, colSize.total) + "\n";
            linesUsedInPage++;
          }

          productIndex++;
        }

        // Isi sisa baris kosong agar footer tetap di posisi yang sama (total 5 baris)
        const remainingEmptyLines = maxLines - linesUsedInPage;
        for (let i = 0; i < remainingEmptyLines; i++) {
          printString += "\n";
        }

        // Cek apakah ini halaman terakhir (produk normal terakhir DAN tidak ada barter)
        const isLastNormalProductPage = productIndex >= totalProducts;
        const isLastPage = isLastNormalProductPage && !hasBarterProducts;

        // Footer - SELALU TAMPIL di setiap kertas (dengan data lengkap hanya di halaman terakhir)
        printString += this.createFooterV3(data, printerSetting, colSize, isLastPage);

        // Form feed untuk halaman berikutnya (kecuali halaman terakhir)
        if (!isLastPage) {
          printString += "\n"; // 3 enter untuk ke kertas baru
        }

        currentPage++;
      }

      // Loop untuk setiap halaman BARANG BARTER (jika ada)
      if (hasBarterProducts) {
        let barterIndex = 0;

        // Header tabel untuk barter dengan label "PRODUK BARTER"
        const headerTableBarter = [
          justifyLeft("PRODUK BARTER", colSize.productName),
          justifyLeft("UNIT", colSize.unit),
          justifyRight("KUANTITI", colSize.quantity),
          justifyRight("HARGA", colSize.price),
          justifyRight("JUMLAH", colSize.total),
        ].join(" ");

        while (barterIndex < totalBarterProducts) {
          // Header untuk halaman barter (dengan header tabel "PRODUK BARTER")
          printString += this.createHeaderV3(data, companyInfo, printerSetting, colSize, headerTableBarter, currentPage, totalPages);

          // Body barter - maksimal 5 BARIS
          let linesUsedInPage = 0;
          const maxLines = 5;

          while (linesUsedInPage < maxLines && barterIndex < totalBarterProducts) {
            const item = data.listBarterProducts[barterIndex];

            let name = item.productName || "-";
            let unit = item.unitName || "-";
            const qtyStr = `${item.quantity}`;
            const harga = priceFormat(item.price);
            const total = priceFormat(item.subTotal);

            // Hitung berapa baris yang dibutuhkan produk ini
            const maxNameLength = colSize.productName;
            let linesNeeded = 1;

            if (name.length > maxNameLength) {
              linesNeeded = 2;
            }

            // Cek apakah masih cukup ruang
            if (linesUsedInPage + linesNeeded > maxLines) {
              break;
            }

            // Cetak produk barter
            if (name.length > maxNameLength) {
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

              printString += justifyLeft(firstName, colSize.productName) + " " +
                justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
                justifyRight(qtyStr, colSize.quantity) + " " +
                justifyRight(harga, colSize.price) + " " +
                justifyRight(total, colSize.total) + "\n";
              linesUsedInPage++;

              if (restName) {
                printString += justifyLeft(restName, colSize.productName) + "\n";
                linesUsedInPage++;
              }
            } else {
              printString += justifyLeft(name, colSize.productName) + " " +
                justifyLeft(unit.length > colSize.unit ? unit.substring(0, colSize.unit) : unit, colSize.unit) + " " +
                justifyRight(qtyStr, colSize.quantity) + " " +
                justifyRight(harga, colSize.price) + " " +
                justifyRight(total, colSize.total) + "\n";
              linesUsedInPage++;
            }

            barterIndex++;
          }

          // Isi sisa baris kosong (total harus 5 baris)
          const remainingEmptyLines = maxLines - linesUsedInPage;
          for (let i = 0; i < remainingEmptyLines; i++) {
            printString += "\n";
          }

          // Cek apakah ini halaman terakhir barter
          const isLastBarterPage = barterIndex >= totalBarterProducts;

          // Footer
          printString += this.createFooterV3(data, printerSetting, colSize, isLastBarterPage);

          // Form feed untuk halaman berikutnya (kecuali halaman terakhir)
          if (!isLastBarterPage) {
            printString += "\n";
          }

          currentPage++;
        }
      }

      return { string: printString, printerSetting };
    } catch (error) {
      console.log(error);
      throw error;
    }
  }
}

module.exports = PrintSalesOrderService;

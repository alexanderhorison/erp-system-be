

const wordingHistory = {
  "ADJUSTMENT STOCK": "Penyesuaian Stock",
  "DELIVERY ORDER CREATE": "Pembuatan Surat Jalan",
  "DELIVERY ORDER RECEIVE": "Penerimaan Surat Jalan",
  "GOODS IN": "Barang Masuk",
  "GOODS OUT": "Barang Keluar",
  "TRANSFORMATION PRODUCT": "Transformasi Produk",
  "TRANSFORMATION_PRODUCT": "Transformasi Produk",
  "OUTSTANDING": "Surat Jalan Outstanding",
}

const titleInfo = (item) => {
  let result = ""
  switch (item?.info) {
    case "TRANSFORMATION PRODUCT":
    case "TRANSFORMATION_PRODUCT":
      result = `Transformasi produk`
      break;
    case "DELIVERY ORDER CREATE":
      result = "Pembuatan Surat Jalan"
      break;
    case "DELIVERY ORDER RECEIVE":
      result = "Penerimaan Surat Jalan"
      break;
    case "GOODS IN":
      result = "Barang Masuk"
      break;
    case "GOODS OUT":
      result = "Barang Keluar"
      break;
    case "OUTSTANDING":
      result = "Surat Jalan Outstanding"
      break;
    case "SALES ORDER":
      result = "Sales Order"
      break;
    case "PURCHASE ORDER":
      result = "Purchase Order"
      break;
    case "POINT OF SALE":
      result = "Point Of Sale"
      break;
    default:
      result = "Penyesuaian Stock Product"
  }
  return result
}

const infoType = (item) => {
  let result = ""
  switch (item?.adjustmentType) {
    case "INITIATE":
      result = `Inisialisasi Stock`
      break;
    case "PLUS":
      result = "Penambahan Stock"
      break;
    case "MINUS":
      result = "Pengurangan Stock"
      break;
    default:
      result = ""
  }
  return result
}

module.exports = {
  wordingHistory,
  infoType,
  titleInfo
};



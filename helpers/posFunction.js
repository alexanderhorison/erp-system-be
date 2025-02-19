
const justifyLeft = (str, length) => {
  return str + ' '.repeat(length - str.length);  // Rata kiri
}

const justifyRight = (str, length) => {
  return ' '.repeat(length - str.length) + str;  // Rata kanan
}

const addLine = (length) => {
  return '-'.repeat(length);  // Menambahkan garis sesuai panjang yang diinginkan
}

const addSpace = (length) => {
  return ' '.repeat(length);
}

const justifyCenter = (str) => {
  return `\x1b\x61\x01\x1b\x21\x30${str}`
}

const addEnter = (length) => {
  return '\n'.repeat(length);
}
module.exports = {
  justifyLeft,
  justifyRight,
  addLine,
  addSpace,
  justifyCenter,
  addEnter
}

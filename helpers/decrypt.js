const CryptoJS = require("crypto-js");

function decrypt(data) {
  const b64 = CryptoJS.enc.Hex.parse(data);
  const bytes = b64.toString(CryptoJS.enc.Base64);
  const decode = CryptoJS.AES.decrypt(bytes, `${process.env.APP_SECRET_KEY}`);
  const decrypted = decode.toString(CryptoJS.enc.Utf8);
  return decrypted;
}
module.exports = decrypt;

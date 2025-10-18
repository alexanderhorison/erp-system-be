const CryptoJS = require("crypto-js");

function decrypt(data) {
  try {
    // Validate input
    if (!data || typeof data !== 'string') {
      throw new Error('Invalid encrypted data');
    }

    // Validate secret key
    if (!process.env.APP_SECRET_KEY) {
      throw new Error('APP_SECRET_KEY is not configured');
    }

    const b64 = CryptoJS.enc.Hex.parse(data);
    const bytes = b64.toString(CryptoJS.enc.Base64);
    const decode = CryptoJS.AES.decrypt(bytes, `${process.env.APP_SECRET_KEY}`);
    const decrypted = decode.toString(CryptoJS.enc.Utf8);
    
    // Validate decrypted result
    if (!decrypted) {
      throw new Error('Failed to decrypt data');
    }
    
    return decrypted;
  } catch (error) {
    console.error('Decrypt function error:', error);
    throw error;
  }
}
module.exports = decrypt;

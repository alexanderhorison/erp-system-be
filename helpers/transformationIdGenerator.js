const { Master_Product_Transformation } = require("../models");

async function generateProductTransformationId(digits = 8) {
  try {
    const minNumber = Math.pow(10, digits - 1);
    const maxNumber = Math.pow(10, digits) - 1;
    let notDuplicate = true;
    let code = "";
    do {
      let tempId = Math.floor(
        minNumber + Math.random() * (maxNumber - minNumber + 1)
      );
      code = `T-${tempId}`;
      const exsisting = await Master_Product_Transformation.findOne({
        where: { code: code },
      });
      exsisting ? (notDuplicate = true) : (notDuplicate = false);
    } while (notDuplicate);
    return code;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateProductTransformationId,
};

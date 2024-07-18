const { Master_Product_Transformation } = require("../models");

async function generateProductTransformationId(digits = 8) {
  try {
    const minNumber = Math.pow(10, digits - 1);
    const maxNumber = Math.pow(10, digits) - 1;
    let notDuplicate = true;
    let productTransformationId = "";
    do {
      let tempId = Math.floor(
        minNumber + Math.random() * (maxNumber - minNumber + 1)
      );
      productTransformationId = `T-${tempId}`;
      const exsisting = await Master_Product_Transformation.findOne({
        where: { productTransformationId: productTransformationId },
      });
      exsisting ? (notDuplicate = true) : (notDuplicate = false);
    } while (notDuplicate);
    return productTransformationId;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateProductTransformationId,
};

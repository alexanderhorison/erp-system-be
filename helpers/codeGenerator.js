const { Delivery_Order, Stock_Opname, Adjustment_Goods_Out } = require("../models");

async function codeGenerator(digits = 8, prefix = "TBA") {
  try {
    const minNumber = Math.pow(10, digits - 1);
    const maxNumber = Math.pow(10, digits) - 1;
    let notDuplicate = true;
    let generatedCode = "";
    do {
      let tempId = Math.floor(
        minNumber + Math.random() * (maxNumber - minNumber + 1)
      );
      let exsisting = false
      generatedCode = `${prefix}-${tempId}`;
      if (prefix === "TBA") {
        exsisting = await Delivery_Order.findOne({
          where: { deliveryOrderId: generatedCode },
        });
      }
      if (prefix === "STO") {
        exsisting = await Stock_Opname.findOne({
          where: { code: generatedCode },
        })
      }
      if (prefix === "GDO") {
        exsisting = await Adjustment_Goods_Out.findOne({
          where: { code: generatedCode },
        })
      }
      exsisting ? (notDuplicate = true) : (notDuplicate = false);
    } while (notDuplicate);
    return generatedCode;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  codeGenerator,
};

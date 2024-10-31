const {
  Delivery_Order,
  Stock_Opname,
  Adjustment_Goods_Out,
  Adjustment_Goods_In,
  Internal_Transfer,
  Delivery_Order_Receipt,
  Delivery_Order_Receipt_Outstanding,
  Sales_Order,
  Purchase_Order
} = require("../models");

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
      let exsisting = false;
      generatedCode = `${prefix}-${tempId}`;
      if (prefix === "TBA") {
        exsisting = await Delivery_Order.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "STO") {
        exsisting = await Stock_Opname.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "GDO") {
        exsisting = await Adjustment_Goods_Out.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "GDI") {
        exsisting = await Adjustment_Goods_In.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "IT") {
        exsisting = await Internal_Transfer.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "DOR") {
        exsisting = await Delivery_Order_Receipt.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "DOO") {
        exsisting = await Delivery_Order_Receipt_Outstanding.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "SO") {
        exsisting = await Sales_Order.findOne({
          where: { code: generatedCode },
        });
      }
      if (prefix === "PO") {
        exsisting = await Purchase_Order.findOne({
          where: { code: generatedCode },
        });
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

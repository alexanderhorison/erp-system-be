const { Delivery_Order, Stock_Opname } = require("../models");

async function generateDeliveryOrderId(digits = 8, prefix = "TBA") {
  try {
    const minNumber = Math.pow(10, digits - 1);
    const maxNumber = Math.pow(10, digits) - 1;
    let notDuplicate = true;
    let orderId = "";
    do {
      let tempId = Math.floor(
        minNumber + Math.random() * (maxNumber - minNumber + 1)
      );
      let exsisting = false
      orderId = `${prefix}-${tempId}`;
      if (prefix === "TBA") {
        exsisting = await Delivery_Order.findOne({
          where: { deliveryOrderId: orderId },
        });
      }
      if (prefix === "STO") {
        exsisting = await Stock_Opname.findOne({
          where: { code: orderId },
        })
      }
      exsisting ? (notDuplicate = true) : (notDuplicate = false);
    } while (notDuplicate);
    return orderId;
  } catch (error) {
    throw error;
  }
}

module.exports = {
  generateDeliveryOrderId,
};

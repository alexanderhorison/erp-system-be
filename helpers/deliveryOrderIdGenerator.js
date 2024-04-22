const { Delivery_Order } = require("../models");

async function generateDeliveryOrderId(digits = 8) {
  try {
    const minNumber = Math.pow(10, digits - 1);
    const maxNumber = Math.pow(10, digits) - 1;
    let notDuplicate = true;
    let orderId = "";
    do {
      let tempId = Math.floor(
        minNumber + Math.random() * (maxNumber - minNumber + 1)
      );
      orderId = `TBA-${tempId}`;
      const exsisting = await Delivery_Order.findOne({
        where: { delivery_order_id: orderId },
      });
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

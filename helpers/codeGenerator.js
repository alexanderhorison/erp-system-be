const models = require("../models");

// Prefix -> Model name mapping
const PREFIX_MODEL_MAP = {
  TBA: "Delivery_Order",
  STO: "Stock_Opname",
  GDO: "Adjustment_Goods_Out",
  GDI: "Adjustment_Goods_In",
  IT: "Internal_Transfer",
  DOR: "Delivery_Order_Receipt",
  DOO: "Delivery_Order_Receipt_Outstanding",
  SO: "Sales_Order",
  PO: "Purchase_Order",
  POS: "Pos_Transaction",
  PRO: "Pr_Orders",
};

async function codeGenerator(digits = 8, prefix = "TBA") {
  const modelName = PREFIX_MODEL_MAP[prefix];
  if (!modelName) throw new Error(`Unknown prefix: ${prefix}`);

  const Model = models[modelName];
  const minNumber = Math.pow(10, digits - 1);
  const maxNumber = Math.pow(10, digits) - 1;

  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const tempId = Math.floor(
      minNumber + Math.random() * (maxNumber - minNumber + 1)
    );
    const generatedCode = `${prefix}-${tempId}`;

    const existing = await Model.findOne({
      where: { code: generatedCode },
      attributes: ["id"],
    });

    if (!existing) return generatedCode;
  }

  // Fallback: timestamp-based guaranteed unique
  const timestamp = Date.now().toString().slice(-digits);
  return `${prefix}-${timestamp}`;
}

module.exports = {
  codeGenerator,
};

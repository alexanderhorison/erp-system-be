const router = require("express").Router();
const routerMasterDataProduct = require("./masterDataProductRouter");
const routerMasterDataCategory = require("./masterDataCategoryRouter");
const routerMasterDataType = require("./masterDataTypeRouter");
const routerMasterDataUnit = require("./masterDataUnitRouter");
const routerMasterDataWarehouse = require("./masterDataWarehouseRouter");
const Auth = require("../../helpers/auth");

// router.use(Auth.KepalaGudang);
router.use("/product", routerMasterDataProduct);
router.use("/category", routerMasterDataCategory);
router.use("/type", routerMasterDataType);
router.use("/unit", routerMasterDataUnit);
router.use("/warehouse", routerMasterDataWarehouse);

module.exports = router;

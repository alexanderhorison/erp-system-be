const router = require("express").Router();
const routerMasterDataProduct = require("./masterDataProductRouter");
const routerMasterDataProductPrice = require("./masterDataProductPriceRouter");
const routerMasterDataCategory = require("./masterDataCategoryRouter");
const routerMasterDataType = require("./masterDataTypeRouter");
const routerMasterDataUnit = require("./masterDataUnitRouter");
const routerMasterDataWarehouse = require("./masterDataWarehouseRouter");
const routerMasterDataCompany = require("./masterDataCompanyRouter");
const routerMasterDataRank = require("./masterDataRankRouter");
const routerMasterDataCustomer = require("./masterDataCustomerRouter");
const routerMasterDataVendor = require("./masterDataVendorRouter");
const Auth = require("../../helpers/auth");

// router.use(Auth.KepalaGudang);
router.use("/product", routerMasterDataProduct);
router.use("/category", routerMasterDataCategory);
router.use("/type", routerMasterDataType);
router.use("/unit", routerMasterDataUnit);
router.use("/warehouse", routerMasterDataWarehouse);
router.use("/company", routerMasterDataCompany);
router.use("/rank", routerMasterDataRank)
router.use("/customer", routerMasterDataCustomer)
router.use("/product-price", routerMasterDataProductPrice)
router.use("/vendor", routerMasterDataVendor)

module.exports = router;

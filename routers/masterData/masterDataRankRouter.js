const router = require("express").Router();
const MasterDataRankController = require("../../controllers/masterData/MasterDataRankController");

router.get("/all", MasterDataRankController.getAllRank);
router.post("/create", MasterDataRankController.createRank);

router.put("/:id", MasterDataRankController.updateRank);
router.get("/:id", MasterDataRankController.getDetailRank);
router.delete("/:id", MasterDataRankController.deleteRank);

module.exports = router;

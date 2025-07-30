// ba-worldcup/server/routes/waifus.js
const express = require("express");
const router = express.Router();
const waifusController = require("../controllers/waifusController");

router.get("/waifus", waifusController.getWaifus);
router.get("/rankings", waifusController.getRankings);

module.exports = router;

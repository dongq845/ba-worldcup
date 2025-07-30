// ba-worldcup/server/routes/submissions.js
const express = require("express");
const router = express.Router();
const submissionsController = require("../controllers/submissionsController");

router.post("/submit", submissionsController.submit);

module.exports = router;

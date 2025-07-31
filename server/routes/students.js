// ba-worldcup/server/routes/students.js
const express = require("express");
const router = express.Router();
const studentsController = require("../controllers/studentsController");

router.get("/students", studentsController.getStudents);
router.get("/rankings", studentsController.getRankings);

module.exports = router;
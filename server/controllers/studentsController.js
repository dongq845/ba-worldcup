// ba-worldcup/server/controllers/studentsController.js
const { pool } = require("../db");
const fs = require("fs").promises;
const path = require("path");

const STUDENTS_JSON = path.join(__dirname, "..", "students.json");

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

exports.getStudents = async (req, res) => {
  try {
    const characters = await pool.query("SELECT id, name, image FROM students");
    res.json(characters.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch characters." });
  }
};

exports.getRankings = async (req, res) => {
  try {
    const allStudentsRes = await pool.query("SELECT * FROM students");
    const allSubmissionsRes = await pool.query("SELECT * FROM submissions");

    const allStudents = allStudentsRes.rows;
    const allSubmissions = allSubmissionsRes.rows;

    const points = Object.fromEntries(allStudents.map((s) => [s.id, 0]));
    const wins = Object.fromEntries(allStudents.map((s) => [s.id, 0]));

    for (const sub of allSubmissions) {
      if (sub.winnerid) {
        points[sub.winnerid] += POINTS.WINNER;
        wins[sub.winnerid] += 1;
      }
      if (sub.runnerupid) {
        points[sub.runnerupid] += POINTS.RUNNER_UP;
      }
      if (sub.semifinalistids) {
        for (const id of sub.semifinalistids) {
          if (points[id] !== undefined) points[id] += POINTS.SEMI_FINALIST;
        }
      }
      if (sub.quarterfinalistids) {
        for (const id of sub.quarterfinalistids) {
          if (points[id] !== undefined) points[id] += POINTS.QUARTER_FINALIST;
        }
      }
    }

    const totalSubmissions = allSubmissions.length;
    const rankings = allStudents.map((student) => ({
      ...student,
      totalPoints: points[student.id],
      winCount: wins[student.id],
      rank1Ratio:
        totalSubmissions > 0 ? (wins[student.id] / totalSubmissions) * 100 : 0,
    }));

    rankings.sort((a, b) => b.totalPoints - a.totalPoints);

    const stats = await fs.stat(STUDENTS_JSON);
    const lastUpdated = new Date(stats.mtime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.json({
      rankings: rankings,
      lastUpdated: lastUpdated,
      totalStudents: allStudents.length,
    });
  } catch (err) {
    console.error("Failed to generate rankings:", err);
    res.status(500).json({ error: "Failed to generate rankings." });
  }
};
// ba-worldcup/server/controllers/studentsController.js
const { pool } = require("../db");
const fs = require("fs").promises;
const path = require("path");

const STUDENTS_JSON = path.join(__dirname, "..", "students.json");

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
    const studentsRes = await pool.query(
      "SELECT * FROM students ORDER BY points DESC"
    );
    const allStudents = studentsRes.rows;

    const submissionsRes = await pool.query(
      "SELECT placements FROM submissions"
    );
    const allSubmissions = submissionsRes.rows;
    const totalSubmissions = allSubmissions.length;

    const winCounts = Object.fromEntries(allStudents.map((s) => [s.id, 0]));

    for (const sub of allSubmissions) {
      const placements = sub.placements;
      if (placements && placements.length > 0) {
        const winnerId = placements[placements.length - 1][0];
        if (winCounts[winnerId] !== undefined) {
          winCounts[winnerId]++;
        }
      }
    }

    const rankings = allStudents.map((student) => ({
      id: student.id,
      name: student.name,
      image: student.image,
      totalPoints: student.points,
      winCount: winCounts[student.id],
      rank1Ratio:
        totalSubmissions > 0
          ? (winCounts[student.id] / totalSubmissions) * 100
          : 0,
    }));

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

// ba-worldcup/server/controllers/studentsController.js
const { pool } = require("../db");
const fs = require("fs").promises;
const path = require("path");

const STUDENTS_JSON = path.join(__dirname, "..", "students.json");

// This old POINTS constant is no longer needed in this file.

exports.getStudents = async (req, res) => {
  try {
    // No changes needed here, this function is correct.
    const characters = await pool.query("SELECT id, name, image FROM students");
    res.json(characters.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch characters." });
  }
};

// ===================================================================
// Replace the entire getRankings function with this corrected version
// ===================================================================
exports.getRankings = async (req, res) => {
  try {
    // Step 1: Get all students directly from the database, already sorted by their stored points.
    // The 'points' column is the source of truth.
    const studentsRes = await pool.query(
      "SELECT * FROM students ORDER BY points DESC"
    );
    const allStudents = studentsRes.rows;

    // Step 2: Get all submissions to calculate the win rate.
    const submissionsRes = await pool.query(
      "SELECT placements FROM submissions"
    );
    const allSubmissions = submissionsRes.rows;
    const totalSubmissions = allSubmissions.length;

    // Step 3: Calculate the win count for each student.
    const winCounts = Object.fromEntries(allStudents.map((s) => [s.id, 0]));

    for (const sub of allSubmissions) {
      // The winner's ID is the last element in the placements array.
      const placements = sub.placements;
      if (placements && placements.length > 0) {
        const winnerId = placements[placements.length - 1][0];
        if (winCounts[winnerId] !== undefined) {
          winCounts[winnerId]++;
        }
      }
    }

    // Step 4: Combine the data into the final rankings structure.
    const rankings = allStudents.map((student) => ({
      id: student.id,
      name: student.name,
      image: student.image,
      // Use the 'points' value directly from the database
      totalPoints: student.points,
      winCount: winCounts[student.id],
      rank1Ratio:
        totalSubmissions > 0
          ? (winCounts[student.id] / totalSubmissions) * 100
          : 0,
    }));

    // Step 5: Get the 'last updated' timestamp.
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

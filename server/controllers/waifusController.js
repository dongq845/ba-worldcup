// ba-worldcup/server/controllers/waifusController.js
const { pool } = require("../db");
const fs = require("fs").promises;
const path = require("path");

const WAIFUS_JSON = path.join(__dirname, "..", "waifus.json");

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

exports.getWaifus = async (req, res) => {
  try {
    const characters = await pool.query("SELECT id, name, image FROM waifus");
    res.json(characters.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch characters." });
  }
};

exports.getRankings = async (req, res) => {
  try {
    const allWaifusRes = await pool.query("SELECT * FROM waifus");
    const allSubmissionsRes = await pool.query("SELECT * FROM submissions");

    const allWaifus = allWaifusRes.rows;
    const allSubmissions = allSubmissionsRes.rows;

    const points = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));
    const wins = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));

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
    const rankings = allWaifus.map((waifu) => ({
      ...waifu,
      totalPoints: points[waifu.id],
      winCount: wins[waifu.id],
      rank1Ratio:
        totalSubmissions > 0 ? (wins[waifu.id] / totalSubmissions) * 100 : 0,
    }));

    rankings.sort((a, b) => b.totalPoints - a.totalPoints);

    const stats = await fs.stat(WAIFUS_JSON);
    const lastUpdated = new Date(stats.mtime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    res.json({
      rankings: rankings,
      lastUpdated: lastUpdated,
      totalStudents: allWaifus.length,
    });
  } catch (err) {
    console.error("Failed to generate rankings:", err);
    res.status(500).json({ error: "Failed to generate rankings." });
  }
};

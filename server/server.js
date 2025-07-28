// ba-worldcup/server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs").promises;
const path = require("path");
const { Pool } = require("pg"); // --- MODIFICATION: Replaced 'sqlite3' and 'sqlite' with 'pg'

const app = express();

// --- CORS Configuration (No changes needed here) ---
const allowedOrigins = [
  "https://baworldcup.com", // <-- ADD YOUR NEW DOMAIN HERE
  process.env.FRONTEND_URL, // Keep the old one for a bit, just in case
  "http://localhost:5173", // Keep this for local development
];
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg =
        "The CORS policy for this site does not allow access from the specified Origin.";
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
};

app.use(cors(corsOptions));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const WAIFUS_JSON = path.join(__dirname, "waifus.json");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // When in production on Render, we need to use SSL but can allow self-signed certificates.
  // When running locally, we must also use SSL to connect to the remote Render DB.
  ssl: isProduction ? { rejectUnauthorized: false } : true,
});

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

// --- MODIFICATION: DATABASE SETUP AND INITIALIZATION for PostgreSQL ---
(async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database.");

    // Create waifus table
    await client.query(`
      CREATE TABLE IF NOT EXISTS waifus (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL
      )
    `);

    // Create submissions table with improved schema for PostgreSQL
    // We use INTEGER[] (an array of integers) which is more efficient than storing JSON strings.
    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
          userId TEXT PRIMARY KEY,
          winnerId INTEGER NOT NULL,
          runnerUpId INTEGER,
          semiFinalistIds INTEGER[],
          quarterFinalistIds INTEGER[]
      )
    `);

    // Check if the waifus table is empty and populate it
    const countResult = await client.query(
      "SELECT COUNT(id) as count FROM waifus"
    );
    if (countResult.rows[0].count === "0") {
      console.log("Database is empty. Populating from waifus.json...");
      const waifuFile = await fs.readFile(WAIFUS_JSON, "utf-8");
      const waifuData = JSON.parse(waifuFile);

      for (const waifu of waifuData) {
        // --- MODIFICATION: Using parameterized queries for PostgreSQL ($1, $2, etc.)
        await client.query(
          "INSERT INTO waifus (id, name, image) VALUES ($1, $2, $3)",
          [waifu.id, waifu.name, waifu.image]
        );
      }
      console.log("Database populated successfully.");
    }
    client.release();
  } catch (err) {
    console.error("Failed to connect or setup the database:", err);
    process.exit(1); // Exit if DB connection fails
  }
})();

// --- API ENDPOINTS ---

app.get("/api/waifus", async (req, res) => {
  try {
    const characters = await pool.query("SELECT id, name, image FROM waifus");
    res.json(characters.rows);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch characters." });
  }
});

app.post("/api/submit", async (req, res) => {
  const { userId, winner, runnerUp, semiFinalists, quarterFinalists } =
    req.body;

  if (!userId || !winner) {
    return res
      .status(400)
      .json({ error: "userId and winner data are required." });
  }

  // --- MODIFICATION: Prepare arrays directly for PostgreSQL INTEGER[] type
  const sfIds = semiFinalists.map((sf) => sf.id);
  const qfIds = quarterFinalists.map((qf) => qf.id);

  // --- MODIFICATION: This is the PostgreSQL equivalent of "INSERT OR REPLACE" ---
  // It attempts to INSERT, and if a row with the same userId already exists (ON CONFLICT),
  // it will UPDATE the existing row instead.
  const queryText = `
    INSERT INTO submissions (userId, winnerId, runnerUpId, semiFinalistIds, quarterFinalistIds)
    VALUES ($1, $2, $3, $4, $5)
    ON CONFLICT (userId) DO UPDATE SET
      winnerId = EXCLUDED.winnerId,
      runnerUpId = EXCLUDED.runnerUpId,
      semiFinalistIds = EXCLUDED.semiFinalistIds,
      quarterFinalistIds = EXCLUDED.quarterFinalistIds;
  `;

  try {
    await pool.query(queryText, [
      userId,
      winner.id,
      runnerUp ? runnerUp.id : null,
      sfIds,
      qfIds,
    ]);
    res.status(200).json({ message: "Submission saved successfully." });
  } catch (err) {
    console.error("Failed to save submission:", err);
    res.status(500).json({ error: "Failed to save submission." });
  }
});

app.get("/api/rankings", async (req, res) => {
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
      // PostgreSQL returns arrays directly, no need for JSON.parse
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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

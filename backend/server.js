// ba-worldcup/backend/server.js

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const fs = require("fs").promises;
const path = require("path");
const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;
const DB_FILE = path.join(__dirname, "waifus.db");
const WAIFUS_JSON = path.join(__dirname, "waifus.json");
let db;

// --- Point Distribution ---
const POINTS = {
  WINNER: 10,
  RUNNER_UP: 3,
  QUARTER_FINALIST: 1,
};

// --- DATABASE SETUP AND INITIALIZATION ---
(async () => {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  // --- MODIFICATION: waifus table is now for METADATA only ---
  // It no longer stores points or win counts.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS waifus (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT NOT NULL
    )
  `);

  // --- MODIFICATION: This new table holds all user votes ---
  // The userId is the PRIMARY KEY, ensuring one user can only have one entry.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
        userId TEXT PRIMARY KEY,
        winnerId INTEGER NOT NULL,
        runnerUpId INTEGER,
        quarterFinalistIds TEXT
    )
  `);

  const count = await db.get("SELECT COUNT(id) as count FROM waifus");
  if (count.count === 0) {
    console.log("Database is empty. Populating from waifus.json...");
    const waifuFile = await fs.readFile(WAIFUS_JSON, "utf-8");
    const waifuData = JSON.parse(waifuFile);
    const stmt = await db.prepare(
      "INSERT INTO waifus (id, name, image) VALUES (?, ?, ?)"
    );
    for (const waifu of waifuData) {
      await stmt.run(waifu.id, waifu.name, waifu.image);
    }
    await stmt.finalize();
    console.log("Database populated successfully.");
  }
})();

// --- API ENDPOINTS ---

app.get("/api/waifus", async (req, res) => {
  const characters = await db.all("SELECT id, name, image FROM waifus");
  res.json(characters);
});

// --- MODIFICATION: Handles overwriting user submissions ---
app.post("/api/submit", async (req, res) => {
  const { userId, winner, runnerUp, quarterFinalists } = req.body;

  if (!userId || !winner) {
    return res
      .status(400)
      .json({ error: "userId and winner data are required." });
  }

  // Stringify the array of quarter-finalist IDs for storage
  const qfIds = JSON.stringify(quarterFinalists.map((qf) => qf.id));

  // "INSERT OR REPLACE" is the key to overwriting previous submissions.
  const stmt = await db.prepare(
    "INSERT OR REPLACE INTO submissions (userId, winnerId, runnerUpId, quarterFinalistIds) VALUES (?, ?, ?, ?)"
  );
  await stmt.run(userId, winner.id, runnerUp ? runnerUp.id : null, qfIds);

  res.status(200).json({ message: "Submission saved successfully." });
});

// --- MODIFICATION: Calculates rankings dynamically from submissions ---
app.get("/api/rankings", async (req, res) => {
  const allWaifus = await db.all("SELECT * FROM waifus");
  const allSubmissions = await db.all("SELECT * FROM submissions");

  const points = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));
  const wins = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));

  for (const sub of allSubmissions) {
    // Award points for winner
    if (sub.winnerId) {
      points[sub.winnerId] += POINTS.WINNER;
      wins[sub.winnerId] += 1;
    }
    // Award points for runner-up
    if (sub.runnerUpId) {
      points[sub.runnerUpId] += POINTS.RUNNER_UP;
    }
    // Award points for quarter-finalists
    if (sub.quarterFinalistIds) {
      const qfIds = JSON.parse(sub.quarterFinalistIds);
      for (const id of qfIds) {
        points[id] += POINTS.QUARTER_FINALIST;
      }
    }
  }

  const totalVotes = allSubmissions.length;
  const rankings = allWaifus.map((waifu) => ({
    ...waifu,
    totalPoints: points[waifu.id],
    winCount: wins[waifu.id],
    rank1Ratio: totalVotes > 0 ? (wins[waifu.id] / totalVotes) * 100 : 0,
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
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

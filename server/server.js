// ba-worldcup/server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const fs = require("fs").promises;
const path = require("path");
const app = express();

// --- CORS Configuration ---
const allowedOrigins = [
  process.env.FRONTEND_URL, // The URL of your deployed frontend on Render
  "http://localhost:5173", // Keep this for local development
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
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
const DB_FILE = path.join(__dirname, "waifus.db");
const WAIFUS_JSON = path.join(__dirname, "waifus.json");
let db;

const POINTS = {
  WINNER: 5,
  RUNNER_UP: 3,
  SEMI_FINALIST: 2,
  QUARTER_FINALIST: 1,
};

// --- DATABASE SETUP AND INITIALIZATION ---
(async () => {
  db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS waifus (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      image TEXT NOT NULL
    )
  `);

  // If you are running this on an existing database, you may need to delete
  // the waifus.db file to allow the server to recreate it with the new column.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS submissions (
        userId TEXT PRIMARY KEY,
        winnerId INTEGER NOT NULL,
        runnerUpId INTEGER,
        semiFinalistIds TEXT,
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

app.post("/api/submit", async (req, res) => {
  const { userId, winner, runnerUp, semiFinalists, quarterFinalists } =
    req.body;

  if (!userId || !winner) {
    return res
      .status(400)
      .json({ error: "userId and winner data are required." });
  }

  const sfIds = JSON.stringify(semiFinalists.map((sf) => sf.id));
  const qfIds = JSON.stringify(quarterFinalists.map((qf) => qf.id));

  const stmt = await db.prepare(
    "INSERT OR REPLACE INTO submissions (userId, winnerId, runnerUpId, semiFinalistIds, quarterFinalistIds) VALUES (?, ?, ?, ?, ?)"
  );
  await stmt.run(
    userId,
    winner.id,
    runnerUp ? runnerUp.id : null,
    sfIds,
    qfIds
  );

  res.status(200).json({ message: "Submission saved successfully." });
});

app.get("/api/rankings", async (req, res) => {
  const allWaifus = await db.all("SELECT * FROM waifus");
  const allSubmissions = await db.all("SELECT * FROM submissions");

  const points = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));
  const wins = Object.fromEntries(allWaifus.map((w) => [w.id, 0]));

  for (const sub of allSubmissions) {
    if (sub.winnerId) {
      points[sub.winnerId] += POINTS.WINNER;
      wins[sub.winnerId] += 1;
    }
    if (sub.runnerUpId) {
      points[sub.runnerUpId] += POINTS.RUNNER_UP;
    }
    if (sub.semiFinalistIds) {
      const sfIds = JSON.parse(sub.semiFinalistIds);
      for (const id of sfIds) {
        if (points[id] !== undefined) points[id] += POINTS.SEMI_FINALIST;
      }
    }
    if (sub.quarterFinalistIds) {
      const qfIds = JSON.parse(sub.quarterFinalistIds);
      for (const id of qfIds) {
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
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

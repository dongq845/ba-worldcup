// ba-worldcup/backend/server.js

const express = require("express");
const cors = require("cors");
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const fs = require("fs");
const path = require("path");
const app = express();
app.use(cors()); // Allow requests from your frontend
app.use(express.json()); // Allow server to read JSON from requests

const PORT = 3001;
let db;

// --- DATABASE SETUP ---
// Connect to SQLite database
(async () => {
  db = await open({
    filename: "./waifus.db",
    driver: sqlite3.Database,
  });

  // Create submissions table if it doesn't exist
  // The userId is UNIQUE, so we can use INSERT OR REPLACE to handle new/updated votes
  await db.exec(`
        CREATE TABLE IF NOT EXISTS submissions (
            userId TEXT PRIMARY KEY,
            waifuId INTEGER NOT NULL
        )
    `);
})();

// --- REUSABLE FUNCTION TO GET WAIFU DATA ---
const getWaifuData = () => {
  const waifusPath = path.join(__dirname, "waifus.json");
  const waifuFile = fs.readFileSync(waifusPath, "utf-8");
  const waifuData = JSON.parse(waifuFile);

  // Get the file's metadata, including its modification time
  const stats = fs.statSync(waifusPath);
  const lastUpdated = new Date(stats.mtime);

  return {
    characters: waifuData,
    // Format the date nicely
    lastUpdated: lastUpdated.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
  };
};

// --- API ENDPOINTS ---

// MODIFICATION: New endpoint to serve the character list
app.get("/api/waifus", (req, res) => {
  const { characters } = getWaifuData();
  res.json(characters);
});

// 1. Endpoint to submit a vote
app.post("/api/submit", async (req, res) => {
  const { userId, waifuId } = req.body;

  if (!userId || !waifuId) {
    return res.status(400).json({ error: "userId and waifuId are required." });
  }

  // "INSERT OR REPLACE" will UPDATE the record if userId already exists, or INSERT if not.
  // This perfectly handles the "override their previous result" requirement.
  const stmt = await db.prepare(
    "INSERT OR REPLACE INTO submissions (userId, waifuId) VALUES (?, ?)"
  );
  await stmt.run(userId, waifuId);

  res.status(200).json({ message: "Submission saved successfully." });
});

// 2. Endpoint to get the rankings
app.get("/api/rankings", async (req, res) => {
  // MODIFICATION: Reads data from the local file system now
  const { characters, lastUpdated } = getWaifuData();

  const totalSubmissions = await db.get(
    "SELECT COUNT(*) as count FROM submissions"
  );
  const totalVotes = totalSubmissions.count;

  // Get the win count for each waifu
  const winners = await db.all(
    "SELECT waifuId, COUNT(waifuId) as wins FROM submissions GROUP BY waifuId"
  );

  const rankings = characters.map((waifu) => {
    const winnerData = winners.find((w) => w.waifuId === waifu.id);
    const winCount = winnerData ? winnerData.wins : 0;

    // Calculate Rank #1 Ratio
    const rank1Ratio = totalVotes > 0 ? (winCount / totalVotes) * 100 : 0;

    // MODIFICATION: Removed the redundant 'winRate' property.
    return {
      ...waifu,
      winCount: winCount,
      rank1Ratio: rank1Ratio,
    };
  });

  rankings.sort((a, b) => b.rank1Ratio - a.rank1Ratio);

  // MODIFICATION: Send the new object shape
  res.json({
    rankings: rankings,
    lastUpdated: lastUpdated,
  });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

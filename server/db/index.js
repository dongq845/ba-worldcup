// ba-worldcup/server/db/index.js
const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : true,
});

const WAIFUS_JSON = path.join(__dirname, "..", "waifus.json");

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS waifus (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
          userId TEXT PRIMARY KEY,
          winnerId INTEGER NOT NULL,
          runnerUpId INTEGER,
          semiFinalistIds INTEGER[],
          quarterFinalistIds INTEGER[]
      )
    `);

    const countResult = await client.query(
      "SELECT COUNT(id) as count FROM waifus"
    );
    if (countResult.rows[0].count === "0") {
      console.log("Database is empty. Populating from waifus.json...");
      const waifuFile = await fs.readFile(WAIFUS_JSON, "utf-8");
      const waifuData = JSON.parse(waifuFile);

      for (const waifu of waifuData) {
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
    process.exit(1);
  }
};

module.exports = { pool, initializeDatabase };

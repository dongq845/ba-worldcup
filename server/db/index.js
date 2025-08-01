// ba-worldcup/server/db/index.js
const { Pool } = require("pg");
const fs = require("fs").promises;
const path = require("path");

const isProduction = process.env.NODE_ENV === "production";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
});

const STUDENTS_JSON = path.join(__dirname, "..", "students.json");

const initializeDatabase = async () => {
  try {
    const client = await pool.connect();
    console.log("Successfully connected to PostgreSQL database.");

    await client.query(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        image TEXT NOT NULL,
        points INTEGER DEFAULT 0
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS submissions (
          userId TEXT PRIMARY KEY,
          placements JSONB
      )
    `);

    const countResult = await client.query(
      "SELECT COUNT(id) as count FROM students"
    );
    if (countResult.rows[0].count === "0") {
      console.log("Database is empty. Populating from students.json...");
      const studentFile = await fs.readFile(STUDENTS_JSON, "utf-8");
      const studentData = JSON.parse(studentFile);

      for (const student of studentData) {
        await client.query(
          "INSERT INTO students (id, name, image, points) VALUES ($1, $2, $3, 0)",
          [student.id, student.name, student.image]
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
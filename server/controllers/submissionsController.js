// ba-worldcup/server/controllers/submissionsController.js
const { pool } = require("../db");

const pointMap = [0, 1, 3, 5, 8, 12, 18, 25];

exports.submit = async (req, res) => {
  const { userId, placements } = req.body;

  if (!userId || !Array.isArray(placements)) {
    return res
      .status(400)
      .json({ error: "userId and valid placements array are required." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const previousSubmission = await client.query(
      "SELECT placements FROM submissions WHERE userId = $1",
      [userId]
    );

    if (previousSubmission.rows.length > 0) {
      let previousPlacementsData = previousSubmission.rows[0].placements;

      if (typeof previousPlacementsData === "string") {
        try {
          previousPlacementsData = JSON.parse(previousPlacementsData);
        } catch (e) {
          console.error(
            "Could not parse previous submission JSON, skipping point revert.",
            e
          );
          previousPlacementsData = [];
        }
      }

      if (Array.isArray(previousPlacementsData)) {
        for (let i = 0; i < previousPlacementsData.length; i++) {
          const points = pointMap[i] || 0;
          const studentIds = previousPlacementsData[i];

          if (studentIds && studentIds.length > 0 && points > 0) {
            await client.query(
              `UPDATE students SET points = points - $1 WHERE id = ANY($2::int[])`,
              [points, studentIds]
            );
          }
        }
      }
    }

    for (let i = 0; i < placements.length; i++) {
      const points = pointMap[i] || 0;
      const studentIds = placements[i];

      if (studentIds && studentIds.length > 0 && points > 0) {
        await client.query(
          `UPDATE students SET points = points + $1 WHERE id = ANY($2::int[])`,
          [points, studentIds]
        );
      }
    }

    const queryText = `
      INSERT INTO submissions (userId, placements)
      VALUES ($1, $2)
      ON CONFLICT (userId) DO UPDATE SET
        placements = EXCLUDED.placements;
    `;

    await client.query(queryText, [userId, JSON.stringify(placements)]);

    await client.query("COMMIT");
    res.status(200).json({ message: "Submission saved successfully." });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Failed to save submission:", err);
    res.status(500).json({ error: "Failed to save submission.", details: err });
  } finally {
    client.release();
  }
};

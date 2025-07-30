// ba-worldcup/server/controllers/submissionsController.js
const { pool } = require("../db");

exports.submit = async (req, res) => {
  const { userId, winner, runnerUp, semiFinalists, quarterFinalists } =
    req.body;

  if (!userId || !winner) {
    return res
      .status(400)
      .json({ error: "userId and winner data are required." });
  }

  const sfIds = semiFinalists.map((sf) => sf.id);
  const qfIds = quarterFinalists.map((qf) => qf.id);

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
};

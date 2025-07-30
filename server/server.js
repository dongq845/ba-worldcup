// ba-worldcup/server/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { initializeDatabase } = require("./db");
const waifusRoutes = require("./routes/waifus");
const submissionsRoutes = require("./routes/submissions");

const app = express();

const allowedOrigins = [
  "https://baworldcup.com",
  process.env.FRONTEND_URL,
  "http://localhost:5173",
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

initializeDatabase();

app.use("/api", waifusRoutes);
app.use("/api", submissionsRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

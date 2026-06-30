require("dotenv").config();

const express = require("express");
const cors = require("cors");

const PORT = process.env.PORT || 3001;

const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];

const app = express();

app.use(
  cors({
    origin: allowedOrigins,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/abel", (_req, res) => {
  res.json({ message: "ABEL not yet implemented" });
});

app.listen(PORT, () => {
  console.log(`ABEL proxy server listening on port ${PORT}`);
});

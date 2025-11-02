const express = require("express");
const { spawn } = require("child_process");
const router = express.Router();
const path = require("path");

// POST /analyze
router.post("/analyze", async (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).json({ error: "No text provided" });

  const py = spawn("python3", ["predict.py"], {
    cwd: path.join(__dirname, ".."),
  });

  let output = "";
  let error = "";

  py.stdout.on("data", (data) => {
    output += data.toString();
  });

  py.stderr.on("data", (data) => {
    error += data.toString();
  });

  py.on("close", (code) => {
    if (error) {
      console.error("Python error:", error);
    }
    try {
      const parsed = JSON.parse(output || "{}");
      return res.json(parsed);
    } catch (e) {
      console.error("Failed to parse python output", e, output);
      return res.status(500).json({ error: "Prediction failed" });
    }
  });

  // Send input JSON via stdin
  py.stdin.write(JSON.stringify({ text }));
  py.stdin.end();
});

module.exports = router;

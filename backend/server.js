const express = require("express");
const { Pool } = require("pg");
const { localToUtc, format, isValidTz } = require("./timezone");

const app = express();
const pool = new Pool();

app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res.status(500).json({ status: "error", db: err.message });
  }
});

app.get("/api/convert", (req, res) => {
  const { time, from, to } = req.query;

  if (!isValidTz(from) || !isValidTz(to)) {
    return res.status(400).json({ error: "Неизвестный часовой пояс" });
  }

  try {
    const utc = localToUtc(time, from);
    res.json({
      utc: new Date(utc).toISOString(),
      from: { tz: from, ...format(utc, from) },
      to: { tz: to, ...format(utc, to) },
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/api/meetings", async (req, res) => {
  const tz = req.query.tz || "UTC";
  if (!isValidTz(tz)) {
    return res.status(400).json({ error: "Неизвестный часовой пояс" });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM meetings ORDER BY starts_at",
    );
    res.json(
      result.rows.map((r) => {
        const ts = new Date(r.starts_at).getTime();
        return {
          id: r.id,
          title: r.title,
          organizer: r.organizer,
          city: r.city,
          duration_min: r.duration_min,
          organizer_time: { tz: r.timezone, ...format(ts, r.timezone) },
          your_time: { tz, ...format(ts, tz) },
        };
      }),
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend запущен на порту ${port}`));

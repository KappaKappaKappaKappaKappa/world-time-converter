const express = require('express');
const { localToUtc, format, isValidTz } = require('./timezone');

const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/convert', (req, res) => {
  const { time, from, to } = req.query;

  if (!isValidTz(from) || !isValidTz(to)) {
    return res.status(400).json({ error: 'Неизвестный часовой пояс' });
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

app.post('/format', (req, res) => {
  const items = req.body.items;
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Нужен массив items' });
  }

  const result = [];
  for (const item of items) {
    if (!isValidTz(item.tz)) {
      return res.status(400).json({ error: `Неизвестный часовой пояс: ${item.tz}` });
    }
    const ts = new Date(item.utc).getTime();
    if (isNaN(ts)) {
      return res.status(400).json({ error: `Неверное время: ${item.utc}` });
    }
    result.push({ tz: item.tz, ...format(ts, item.tz) });
  }
  res.json(result);
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Web-service запущен на порту ${port}`));
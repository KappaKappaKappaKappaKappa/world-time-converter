const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool();
const WEB_SERVICE = process.env.WEB_SERVICE_URL || 'http://web-service:4000';

async function callWebService(path, options) {
  let response;
  try {
    response = await fetch(WEB_SERVICE + path, options);
  } catch {
    const err = new Error('Веб-сервис недоступен');
    err.status = 502;
    throw err;
  }
  const data = await response.json();
  if (!response.ok) {
    const err = new Error(data.error || 'Ошибка веб-сервиса');
    err.status = response.status;
    throw err;
  }
  return data;
}

const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

function checkMeeting(body) {
  for (const field of ['title', 'organizer', 'city', 'timezone', 'local_time']) {
    if (!body[field] || typeof body[field] !== 'string') {
      const err = new Error(`Поле ${field} обязательно`);
      err.status = 400;
      throw err;
    }
  }
  const duration = body.duration_min === undefined ? 60 : Number(body.duration_min);
  if (!Number.isInteger(duration) || duration <= 0) {
    const err = new Error('duration_min должно быть положительным целым числом');
    err.status = 400;
    throw err;
  }
  return duration;
}

async function toUtc(localTime, timezone) {
  const query = new URLSearchParams({ time: localTime, from: timezone, to: 'UTC' });
  const data = await callWebService('/convert?' + query);
  return data.utc;
}

function parseId(req) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    const err = new Error('Неверный id');
    err.status = 400;
    throw err;
  }
  return id;
}

app.get('/api/health', handle(async (req, res) => {
  await pool.query('SELECT 1');
  await callWebService('/health');
  res.json({ status: 'ok', db: 'connected', webService: 'connected' });
}));

app.get('/api/convert', handle(async (req, res) => {
  const { time, from, to } = req.query;
  const query = new URLSearchParams({ time: time || '', from: from || '', to: to || '' });
  res.json(await callWebService('/convert?' + query));
}));

app.get('/api/meetings', handle(async (req, res) => {
  const tz = req.query.tz || 'UTC';
  const { rows } = await pool.query('SELECT * FROM meetings ORDER BY starts_at');

  let formatted = [];
  if (rows.length > 0) {
    const items = rows.flatMap((r) => {
      const utc = r.starts_at.toISOString();
      return [{ utc, tz: r.timezone }, { utc, tz }];
    });
    formatted = await callWebService('/format', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
  }

  res.json(rows.map((r, i) => ({
    id: r.id,
    title: r.title,
    organizer: r.organizer,
    city: r.city,
    duration_min: r.duration_min,
    organizer_time: formatted[i * 2],
    your_time: formatted[i * 2 + 1],
  })));
}));

app.post('/api/meetings', handle(async (req, res) => {
  const duration = checkMeeting(req.body);
  const { title, organizer, city, timezone, local_time } = req.body;
  const startsAt = await toUtc(local_time, timezone);

  const { rows } = await pool.query(
    `INSERT INTO meetings (title, organizer, city, timezone, starts_at, duration_min)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [title, organizer, city, timezone, startsAt, duration]
  );
  res.status(201).json(rows[0]);
}));

app.put('/api/meetings/:id', handle(async (req, res) => {
  const id = parseId(req);
  const duration = checkMeeting(req.body);
  const { title, organizer, city, timezone, local_time } = req.body;
  const startsAt = await toUtc(local_time, timezone);

  const { rows } = await pool.query(
    `UPDATE meetings
     SET title = $1, organizer = $2, city = $3, timezone = $4, starts_at = $5, duration_min = $6
     WHERE id = $7 RETURNING *`,
    [title, organizer, city, timezone, startsAt, duration, id]
  );
  if (rows.length === 0) return res.status(404).json({ error: 'Встреча не найдена' });
  res.json(rows[0]);
}));

app.delete('/api/meetings/:id', handle(async (req, res) => {
  const id = parseId(req);
  const { rowCount } = await pool.query('DELETE FROM meetings WHERE id = $1', [id]);
  if (rowCount === 0) return res.status(404).json({ error: 'Встреча не найдена' });
  res.status(204).end();
}));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Backend запущен на порту ${port}`));
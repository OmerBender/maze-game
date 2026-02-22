const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

/* =======================
   API ROUTES
======================= */

/**
 * POST /api/score
 * מוסיף תוצאה חדשה (stage, name, time),
 * ואז משאיר רק את Top 3 (הזמנים הכי נמוכים) עבור אותו stage.
 * מחזיר את ה-Top 3 המעודכן לאותו stage.
 */
app.post('/api/score', (req, res) => {
  const stage = Number(req.body.stage);
  const name = String(req.body.name || '').trim();
  const time = Number(req.body.time);

  if (!Number.isFinite(stage) || stage <= 0) {
    return res.status(400).json({ error: 'Invalid stage' });
  }
  if (name.length < 2) {
    return res.status(400).json({ error: 'Invalid name' });
  }
  if (!Number.isFinite(time) || time <= 0) {
    return res.status(400).json({ error: 'Invalid time' });
  }

  db.serialize(() => {
    // 1) תמיד מכניסים את התוצאה החדשה
    db.run(
      'INSERT INTO records (stage, name, time) VALUES (?, ?, ?)',
      [stage, name, time],
      function (err) {
        if (err) return res.status(500).json({ error: err.message });

        // 2) מוחקים כל רשומה שלא ב-Top 3 של אותו stage
        db.run(
          `
          DELETE FROM records
          WHERE stage = ?
            AND id NOT IN (
              SELECT id
              FROM records
              WHERE stage = ?
              ORDER BY time ASC, created_at ASC
              LIMIT 3
            )
          `,
          [stage, stage],
          (err2) => {
            if (err2) return res.status(500).json({ error: err2.message });

            // 3) מחזירים Top 3 מעודכן לאותו stage
            db.all(
              `
              SELECT stage, name, time
              FROM records
              WHERE stage = ?
              ORDER BY time ASC, created_at ASC
              LIMIT 3
              `,
              [stage],
              (err3, rows) => {
                if (err3) return res.status(500).json({ error: err3.message });
                return res.json({ ok: true, stage, top3: rows });
              }
            );
          }
        );
      }
    );
  });
});

/**
 * GET /api/records
 * מחזיר Top 3 לכל stage (ממויין לפי stage ואז time).
 */
app.get('/api/records', (req, res) => {
  db.all(
    `
    SELECT r1.stage, r1.name, r1.time
    FROM records r1
    WHERE (
      SELECT COUNT(*)
      FROM records r2
      WHERE r2.stage = r1.stage
        AND (
          r2.time < r1.time OR
          (r2.time = r1.time AND r2.created_at <= r1.created_at)
        )
    ) < 3
    ORDER BY r1.stage ASC, r1.time ASC, r1.created_at ASC
    `,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      return res.json(rows);
    }
  );
});

/* =======================
   SERVE REACT BUILD
======================= */
const clientBuildPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuildPath));

// כל נתיב שלא מתחיל ב-/api → React Router
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuildPath, 'index.html'));
});

/* =======================
   START SERVER
======================= */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('Server running on', PORT));

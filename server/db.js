const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'maze_records.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stage INTEGER NOT NULL,
    name TEXT NOT NULL,
    time REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // אינדקס שיעזור לשליפות Top 3 מהירות
  db.run(`CREATE INDEX IF NOT EXISTS idx_records_stage_time
          ON records(stage, time)`);
});

module.exports = db;

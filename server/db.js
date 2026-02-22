const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// יוצר נתיב מוחלט לקובץ בתוך תיקיית server
const dbPath = path.join(__dirname, 'maze_records.db');

console.log("Using DB at:", dbPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS records (
        stage INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        time REAL NOT NULL
    )`);
});

module.exports = db;

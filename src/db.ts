import Database from 'better-sqlite3';

const db = new Database('app.db');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    gender TEXT CHECK(gender IN ('male', 'female')) NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS profiles (
    user_id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    bio TEXT,
    course TEXT,
    year TEXT,
    interests TEXT, -- JSON string
    ai_enhanced_bio TEXT,
    ai_tags TEXT, -- JSON string
    profile_pic_url TEXT,
    social_links TEXT, -- JSON string { instagram, facebook, linkedin, etc. }
    nicknames TEXT,
    habits TEXT,
    department TEXT,
    class_section TEXT,
    location TEXT,
    dob TEXT,
    hometown TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

// Migration for existing tables (if any)
try {
  db.exec("ALTER TABLE profiles ADD COLUMN profile_pic_url TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN social_links TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN nicknames TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN habits TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN department TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN class_section TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN location TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN dob TEXT");
} catch (e) {}
try {
  db.exec("ALTER TABLE profiles ADD COLUMN hometown TEXT");
} catch (e) {}

// Create messages table
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS connections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(sender_id, receiver_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reporter_id INTEGER NOT NULL,
    reported_id INTEGER NOT NULL,
    reason TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporter_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (reported_id) REFERENCES users (id) ON DELETE CASCADE
  );
`);

export default db;

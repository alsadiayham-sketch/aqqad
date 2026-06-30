-- aqqad secure backend — Cloudflare D1 schema
-- All admin/POS data lives here (server-only). The browser and the POS terminal
-- never read credentials directly; everything goes through authenticated Pages
-- Functions at /api/*. Passwords (admin AND cashier) are PBKDF2-SHA256 salted
-- hashes, verified server-side. No plaintext, no client-readable hashes.

-- Admin/back-office AND POS cashier users — SINGLE source of truth.
-- Both /api/login (back-office) and /api/pos-login (POS terminal) authenticate
-- against this one table. role 'admin' = manager, 'worker' = cashier/employee.
CREATE TABLE IF NOT EXISTS users (
  username   TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'admin',
  salt       TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 100000,
  hash       TEXT NOT NULL,
  algo       TEXT NOT NULL DEFAULT 'PBKDF2-SHA256',
  created_at INTEGER NOT NULL DEFAULT 0
);

-- DEPRECATED: legacy separate cashier table. No longer read or written — the
-- /api/pos-users and /api/pos-login endpoints now use the unified `users` table.
-- Kept only so existing databases don't error; safe to drop after migration.
CREATE TABLE IF NOT EXISTS pos_users (
  username   TEXT PRIMARY KEY,
  name       TEXT NOT NULL DEFAULT '',
  role       TEXT NOT NULL DEFAULT 'worker',
  salt       TEXT NOT NULL,
  iterations INTEGER NOT NULL DEFAULT 100000,
  hash       TEXT NOT NULL,
  algo       TEXT NOT NULL DEFAULT 'PBKDF2-SHA256',
  active     INTEGER NOT NULL DEFAULT 1,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS products (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- orders: order_number is a queryable column for public tracking and POS bills
CREATE TABLE IF NOT EXISTS orders (
  id           TEXT PRIMARY KEY,
  order_number TEXT,
  data         TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'new',
  source       TEXT NOT NULL DEFAULT 'web',
  created_at   INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE TABLE IF NOT EXISTS discounts (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT 0
);

-- hero kept for template parity (aqqad stores hero in settings/heroSlides)
CREATE TABLE IF NOT EXISTS hero (
  id   TEXT PRIMARY KEY,
  data TEXT NOT NULL,
  ord  INTEGER NOT NULL DEFAULT 0
);

-- settings holds named docs: 'config' (store settings) and 'heroSlides' (public)
CREATE TABLE IF NOT EXISTS settings (
  key  TEXT PRIMARY KEY,
  data TEXT NOT NULL
);

-- POS activity log (read by admin, appended by the POS terminal)
CREATE TABLE IF NOT EXISTS pos_logs (
  id        TEXT PRIMARY KEY,
  data      TEXT NOT NULL,
  timestamp INTEGER NOT NULL DEFAULT 0
);

-- POS damaged/written-off stock entries
CREATE TABLE IF NOT EXISTS pos_damage (
  id         TEXT PRIMARY KEY,
  data       TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

INSERT OR IGNORE INTO meta (key, value) VALUES ('sessionVersion', '1');
INSERT OR IGNORE INTO meta (key, value) VALUES ('posSessionVersion', '1');

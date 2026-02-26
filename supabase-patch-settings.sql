-- ════════════════════════════════════════════════════
--  PATCH: Tambah tabel settings
--  Jalankan di Supabase SQL Editor (tidak merusak data lain)
-- ════════════════════════════════════════════════════

-- Buat tabel settings jika belum ada
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Disable RLS (konsisten dengan tabel lain)
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- Seed data awal (PIN default & nama toko default)
INSERT INTO settings (key, value) VALUES
  ('access_pin',  '1234'),
  ('store_name', 'Toko Mbak Atria')
ON CONFLICT (key) DO NOTHING;

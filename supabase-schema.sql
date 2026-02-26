-- ════════════════════════════════════════════════════
--  TOKO MBAK ATRIA — Supabase Schema
--  Jalankan file ini di Supabase SQL Editor
-- ════════════════════════════════════════════════════

-- Produk
CREATE TABLE IF NOT EXISTS products (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name          TEXT NOT NULL,
  sku           TEXT DEFAULT '',
  category      TEXT DEFAULT '',
  cost_price    NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  stock         INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Transaksi Penjualan
CREATE TABLE IF NOT EXISTS sales (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gross_revenue NUMERIC(12,2) DEFAULT 0,
  cogs          NUMERIC(12,2) DEFAULT 0,
  gross_profit  NUMERIC(12,2) DEFAULT 0,
  cash_received NUMERIC(12,2) DEFAULT 0,
  change_amount NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Item dalam setiap transaksi
CREATE TABLE IF NOT EXISTS sale_items (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  sale_id       TEXT REFERENCES sales(id) ON DELETE CASCADE,
  product_id    TEXT,
  product_name  TEXT,
  quantity      INTEGER DEFAULT 1,
  cost_price    NUMERIC(12,2) DEFAULT 0,
  selling_price NUMERIC(12,2) DEFAULT 0,
  subtotal      NUMERIC(12,2) DEFAULT 0
);

-- Penambahan Stok
CREATE TABLE IF NOT EXISTS stock_additions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  product_id    TEXT,
  product_name  TEXT,
  quantity      INTEGER DEFAULT 0,
  cost_per_unit NUMERIC(12,2) DEFAULT 0,
  total_cost    NUMERIC(12,2) DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Pengeluaran Operasional
CREATE TABLE IF NOT EXISTS expenses (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  description TEXT NOT NULL,
  amount      NUMERIC(12,2) DEFAULT 0,
  category    TEXT DEFAULT 'Operasional',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Pengaturan Toko (nama & PIN)
CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- ── Enable Realtime ───────────────────────────────────
-- Jalankan setelah tabel dibuat
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;
ALTER PUBLICATION supabase_realtime ADD TABLE sale_items;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_additions;
ALTER PUBLICATION supabase_realtime ADD TABLE expenses;

-- ── Row Level Security (disable for simplicity) ───────
-- Untuk toko kecil, RLS disabled cukup karena dilindungi PIN
ALTER TABLE products        DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales           DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items      DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_additions DISABLE ROW LEVEL SECURITY;
ALTER TABLE expenses        DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings        DISABLE ROW LEVEL SECURITY;

-- ── Seed: Produk Awal ─────────────────────────────────
INSERT INTO products (id, name, sku, category, cost_price, selling_price, stock, low_stock_threshold) VALUES
  ('p1', 'Gas LPG 3 Kg',      'LPG-3',  'Gas',       15000, 18000,  30, 10),
  ('p2', 'Brightgas 5 Kg',    'BG-5',   'Gas',       65000, 75000,  20,  5),
  ('p3', 'Brightgas 12.5 Kg', 'BG-125', 'Gas',      155000, 170000, 10,  3),
  ('p4', 'Cleo Botol',        'CL-BOT', 'Air Minum',  2500,  4000,  50, 12),
  ('p5', 'Cleo Galon Mini',   'CL-GLN', 'Air Minum',  8000, 11000,  25,  8),
  ('p6', 'Cleo Isi Ulang',    'CL-ISI', 'Air Minum',  3500,  5000,  40, 10),
  ('p7', 'Cleo Gelas Mini',   'CL-GLS', 'Air Minum', 18000, 24000,  35, 10),
  ('p8', 'Aqua Gelas Mini',   'AQ-GLS', 'Air Minum', 19000, 25000,  30, 10)
ON CONFLICT (id) DO NOTHING;

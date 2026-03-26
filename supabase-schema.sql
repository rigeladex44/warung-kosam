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

-- ── Seed: Produk Awal (Warkop Version) ─────────────────
INSERT INTO products (id, name, sku, category, cost_price, selling_price, stock, low_stock_threshold) VALUES
  ('p1', 'Kopi Hitam',         'KH-01', 'Minuman', 0, 5000, 999, 0),
  ('p2', 'Kopi Susu Es',       'KS-02', 'Minuman', 0, 8000, 999, 0),
  ('p3', 'Es Teh Manis',       'ET-03', 'Minuman', 0, 5000, 999, 0),
  ('p4', 'Indomie Goreng',     'IG-04', 'Makanan', 0, 8000, 999, 0),
  ('p5', 'Indomie Kuah',       'IK-05', 'Makanan', 0, 8000, 999, 0),
  ('p6', 'Roti Bakar Coklat',  'RB-06', 'Makanan', 0, 12000, 999, 0),
  ('p7', 'Pisang Goreng (5pc)', 'PG-07', 'Makanan', 0, 10000, 999, 0),
  ('p8', 'Air Mineral Botol',  'AM-08', 'Minuman', 0, 4000, 999, 0);

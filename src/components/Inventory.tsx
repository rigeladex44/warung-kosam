'use client';

import { useState, useMemo } from 'react';
import {
    Search, Plus, Edit2, Trash2, X, Save, PackagePlus, ChevronDown,
    Package, Flame, Droplets,
} from 'lucide-react';
import { useStore, type Product } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';

type InventoryView = 'list' | 'add-product' | 'edit-product' | 'add-stock';

const CATEGORIES = ['Gas', 'Air Minum', 'Lainnya'];

function getCategoryIcon(category: string) {
    const map: Record<string, React.ReactNode> = {
        Gas: <Flame size={16} />,
        'Air Minum': <Droplets size={16} />,
        Lainnya: <Package size={16} />,
    };
    return map[category] ?? <Package size={16} />;
}

const emptyForm = {
    name: '', sku: '', category: 'Gas', costPrice: '', sellingPrice: '', stock: '', lowStockThreshold: '10',
};

export default function Inventory() {
    const products = useStore((s) => s.products);
    const addProduct = useStore((s) => s.addProduct);
    const updateProduct = useStore((s) => s.updateProduct);
    const deleteProduct = useStore((s) => s.deleteProduct);
    const addStockAddition = useStore((s) => s.addStockAddition);

    const [view, setView] = useState<InventoryView>('list');
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [stockForm, setStockForm] = useState({ productId: '', quantity: '', costPerUnit: '' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const filtered = useMemo(() =>
        products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        ), [products, search]);

    const handleField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const openEdit = (product: Product) => {
        setSelectedProduct(product);
        setForm({
            name: product.name,
            sku: product.sku,
            category: product.category,
            costPrice: String(product.costPrice),
            sellingPrice: String(product.sellingPrice),
            stock: String(product.stock),
            lowStockThreshold: String(product.lowStockThreshold),
        });
        setView('edit-product');
    };

    const handleSaveProduct = () => {
        if (!form.name || !form.sellingPrice) return;
        const data = {
            name: form.name,
            sku: form.sku,
            category: form.category,
            costPrice: parseFloat(form.costPrice) || 0,
            sellingPrice: parseFloat(form.sellingPrice) || 0,
            stock: parseInt(form.stock) || 0,
            lowStockThreshold: parseInt(form.lowStockThreshold) || 10,
        };
        if (view === 'add-product') {
            addProduct(data);
        } else if (selectedProduct) {
            updateProduct(selectedProduct.id, data);
        }
        setForm(emptyForm);
        setView('list');
    };

    const handleAddStock = () => {
        const product = products.find((p) => p.id === stockForm.productId);
        if (!product || !stockForm.quantity) return;
        const qty = parseInt(stockForm.quantity);
        const cost = parseFloat(stockForm.costPerUnit) || product.costPrice;
        addStockAddition({
            productId: product.id,
            productName: product.name,
            quantity: qty,
            costPerUnit: cost,
            totalCost: qty * cost,
        });
        setStockForm({ productId: '', quantity: '', costPerUnit: '' });
        setView('list');
    };

    // ─── Add Stock View ──────────────────────────────────────────────────────────
    if (view === 'add-stock') {
        const selProduct = products.find((p) => p.id === stockForm.productId);
        return (
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => setView('list')}>
                        <X size={20} />
                    </button>
                    <h1 className="page-title">Tambah Stok</h1>
                </div>
                <div className="form-card">
                    <div className="form-group">
                        <label className="form-label">Pilih Produk</label>
                        <div className="select-wrapper">
                            <select
                                className="form-select"
                                value={stockForm.productId}
                                onChange={(e) => setStockForm((f) => ({
                                    ...f,
                                    productId: e.target.value,
                                    costPerUnit: products.find((p) => p.id === e.target.value)?.costPrice.toString() || '',
                                }))}
                            >
                                <option value="">-- Pilih Produk --</option>
                                {products.map((p) => (
                                    <option key={p.id} value={p.id}>{p.name} (stok: {p.stock})</option>
                                ))}
                            </select>
                            <ChevronDown size={16} className="select-icon" />
                        </div>
                    </div>
                    {selProduct && (
                        <div className="product-info-box">
                            <span className="flex items-center gap-2">{getCategoryIcon(selProduct.category)} {selProduct.name}</span>
                            <span className="muted-text">Stok saat ini: <strong>{selProduct.stock}</strong></span>
                        </div>
                    )}
                    <div className="form-group">
                        <label className="form-label">Jumlah Masuk</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="0"
                            value={stockForm.quantity}
                            onChange={(e) => setStockForm((f) => ({ ...f, quantity: e.target.value }))}
                            inputMode="numeric"
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Harga Beli per Unit (Rp)</label>
                        <input
                            className="form-input"
                            type="number"
                            placeholder="0"
                            value={stockForm.costPerUnit}
                            onChange={(e) => setStockForm((f) => ({ ...f, costPerUnit: e.target.value }))}
                            inputMode="numeric"
                        />
                    </div>
                    {stockForm.quantity && stockForm.costPerUnit && (
                        <div className="total-cost-box">
                            <span>Total Pengeluaran:</span>
                            <strong>{formatRupiah(parseInt(stockForm.quantity || '0') * parseFloat(stockForm.costPerUnit || '0'))}</strong>
                        </div>
                    )}
                    <button
                        className="btn-primary full-width"
                        disabled={!stockForm.productId || !stockForm.quantity}
                        onClick={handleAddStock}
                    >
                        <Save size={16} /> Simpan Penambahan Stok
                    </button>
                </div>
            </div>
        );
    }

    // ─── Add / Edit Product View ─────────────────────────────────────────────────
    if (view === 'add-product' || view === 'edit-product') {
        return (
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => setView('list')}>
                        <X size={20} />
                    </button>
                    <h1 className="page-title">{view === 'add-product' ? 'Produk Baru' : 'Edit Produk'}</h1>
                </div>
                <div className="form-card">
                    <div className="form-group">
                        <label className="form-label">Nama Produk *</label>
                        <input className="form-input" placeholder="Contoh: Aqua 600ml" value={form.name} onChange={(e) => handleField('name', e.target.value)} />
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">SKU / Kode</label>
                            <input className="form-input" placeholder="AQ-600" value={form.sku} onChange={(e) => handleField('sku', e.target.value)} />
                        </div>
                        <div className="form-group flex-1">
                            <label className="form-label">Kategori</label>
                            <div className="select-wrapper">
                                <select className="form-select" value={form.category} onChange={(e) => handleField('category', e.target.value)}>
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={16} className="select-icon" />
                            </div>
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">Harga Beli (Rp)</label>
                            <input className="form-input" type="number" placeholder="0" value={form.costPrice} onChange={(e) => handleField('costPrice', e.target.value)} inputMode="numeric" />
                        </div>
                        <div className="form-group flex-1">
                            <label className="form-label">Harga Jual (Rp) *</label>
                            <input className="form-input" type="number" placeholder="0" value={form.sellingPrice} onChange={(e) => handleField('sellingPrice', e.target.value)} inputMode="numeric" />
                        </div>
                    </div>
                    {form.costPrice && form.sellingPrice && (
                        <div className="margin-info">
                            Margin: {formatRupiah(parseFloat(form.sellingPrice || '0') - parseFloat(form.costPrice || '0'))} per unit
                        </div>
                    )}
                    <div className="form-row">
                        <div className="form-group flex-1">
                            <label className="form-label">Stok Awal</label>
                            <input className="form-input" type="number" placeholder="0" value={form.stock} onChange={(e) => handleField('stock', e.target.value)} inputMode="numeric" />
                        </div>
                        <div className="form-group flex-1">
                            <label className="form-label">Batas Stok Rendah</label>
                            <input className="form-input" type="number" placeholder="10" value={form.lowStockThreshold} onChange={(e) => handleField('lowStockThreshold', e.target.value)} inputMode="numeric" />
                        </div>
                    </div>
                    <button className="btn-primary full-width" disabled={!form.name || !form.sellingPrice} onClick={handleSaveProduct}>
                        <Save size={16} /> Simpan Produk
                    </button>
                </div>
            </div>
        );
    }

    // ─── Product List View ───────────────────────────────────────────────────────
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Inventaris</h1>
                <div className="header-actions">
                    <button className="btn-icon-secondary" onClick={() => { setStockForm({ productId: '', quantity: '', costPerUnit: '' }); setView('add-stock'); }}>
                        <PackagePlus size={18} />
                    </button>
                    <button className="btn-icon-primary" onClick={() => { setForm(emptyForm); setView('add-product'); }}>
                        <Plus size={18} />
                    </button>
                </div>
            </div>

            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input
                    className="search-input"
                    placeholder="Cari produk, SKU, kategori..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="inv-summary">
                <span>{products.length} produk</span>
                <span>·</span>
                <span className="text-amber-600">{products.filter((p) => p.stock <= p.lowStockThreshold).length} stok menipis</span>
            </div>

            <div className="inventory-list">
                {filtered.length === 0 ? (
                    <div className="empty-state">
                        <Package size={40} className="empty-icon-muted" />
                        <p>Produk tidak ditemukan</p>
                        <button className="btn-secondary" onClick={() => { setForm(emptyForm); setView('add-product'); }}>
                            <Plus size={16} /> Tambah Produk
                        </button>
                    </div>
                ) : (
                    filtered.map((product) => {
                        const isLow = product.stock <= product.lowStockThreshold;
                        const isOut = product.stock === 0;
                        return (
                            <div key={product.id} className="inv-card">
                                <div className="inv-card-left">
                                    <span className="inv-emoji">{getCategoryIcon(product.category)}</span>
                                    <div className="inv-info">
                                        <div className="inv-name">{product.name}</div>
                                        <div className="inv-sku">{product.sku || product.category}</div>
                                        <div className="inv-prices">
                                            <span className="inv-buy">Beli: {formatRupiah(product.costPrice)}</span>
                                            <span className="inv-sell">Jual: {formatRupiah(product.sellingPrice)}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="inv-card-right">
                                    <div className={`inv-stock ${isOut ? 'out' : isLow ? 'low' : 'ok'}`}>
                                        {product.stock}
                                    </div>
                                    <div className="inv-stock-label">
                                        {isOut ? 'Habis' : isLow ? 'Menipis' : 'Tersedia'}
                                    </div>
                                    <div className="inv-actions">
                                        <button className="inv-btn-edit" onClick={() => openEdit(product)}>
                                            <Edit2 size={14} />
                                        </button>
                                        <button className="inv-btn-delete" onClick={() => setDeleteConfirm(product.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Hapus Produk?</h3>
                        <p className="modal-body">
                            Produk <strong>{products.find((p) => p.id === deleteConfirm)?.name}</strong> akan dihapus permanen.
                        </p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            <button className="btn-danger" onClick={() => { deleteProduct(deleteConfirm); setDeleteConfirm(null); }}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

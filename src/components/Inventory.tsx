'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Search, Plus, Edit2, Trash2, X, Save, ChevronDown,
    Package, Coffee, Utensils, Image as ImageIcon
} from 'lucide-react';
import { useStore, type Product } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import { getActiveUser } from '@/lib/users';

type InventoryView = 'list' | 'add-product' | 'edit-product';

const CATEGORIES = ['Kopi & Minuman', 'Makanan', 'Rokok', 'Lainnya'];

function getCategoryIcon(category: string) {
    const map: Record<string, React.ReactNode> = {
        'Kopi & Minuman': <Coffee size={16} />,
        'Makanan': <Utensils size={16} />,
        'Lainnya': <Package size={16} />,
    };
    return map[category] ?? <Package size={16} />;
}

const emptyForm = {
    name: '', sku: '', category: 'Kopi & Minuman', sellingPrice: '', image: ''
};

export default function Inventory() {
    const products = useStore((s) => s.products);
    const addProduct = useStore((s) => s.addProduct);
    const updateProduct = useStore((s) => s.updateProduct);
    const deleteProduct = useStore((s) => s.deleteProduct);

    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const [view, setView] = useState<InventoryView>('list');
    const [search, setSearch] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const activeUser = mounted ? getActiveUser() : null;
    const isOwner = activeUser?.role === 'owner';

    const filtered = useMemo(() =>
        products.filter((p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.sku.toLowerCase().includes(search.toLowerCase()) ||
            p.category.toLowerCase().includes(search.toLowerCase())
        ), [products, search]);

    const handleField = (field: string, value: string) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const openEdit = (product: Product) => {
        if (!isOwner) return;
        setSelectedProduct(product);
        setForm({
            name: product.name,
            sku: product.sku,
            category: product.category,
            sellingPrice: String(product.sellingPrice),
            image: product.image || ''
        });
        setView('edit-product');
    };

    const handleSaveProduct = () => {
        if (!isOwner || !form.name || !form.sellingPrice) return;
        
        let finalImage = form.image;
        
        // Jika tidak ada foto yang diunggah, buat path otomatis berdasarkan nama
        if (!finalImage) {
            const fileName = form.name.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
            finalImage = `/katalog/${fileName}.jpg`;
        }

        const data = {
            name: form.name,
            sku: form.sku,
            category: form.category,
            sellingPrice: parseFloat(form.sellingPrice) || 0,
            stock: 999999, // Selalu ada
            lowStockThreshold: 0,
            image: finalImage || undefined
        };
        if (view === 'add-product') {
            addProduct(data);
        } else if (selectedProduct) {
            updateProduct(selectedProduct.id, data);
        }
        setForm(emptyForm);
        setView('list');
    };

    // ─── Add / Edit Product View ─────────────────────────────────────────────────
    if (view === 'add-product' || view === 'edit-product') {
        const isEdit = view === 'edit-product';
        return (
            <div className="page-container fade-in">
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button className="back-btn" onClick={() => setView('list')} style={{ background: '#f8fafc', padding: '10px', borderRadius: '14px' }}>
                        <X size={20} />
                    </button>
                    <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 900 }}>{isEdit ? 'Ubah Menu' : 'Menu Baru'}</h1>
                </div>

                <div className="form-card" style={{ 
                    background: 'white', 
                    borderRadius: '28px', 
                    padding: '32px 24px', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f5f9'
                }}>
                    
                    {/* Centered Image Preview Block */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <label 
                            htmlFor="product-image-upload"
                            className="image-edit-container" 
                            style={{ 
                                width: '140px', 
                                height: '140px', 
                                background: '#f8fafc', 
                                borderRadius: '36px', 
                                margin: '0 auto',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                border: '3px solid #fff',
                                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease'
                            }}
                        >
                            {form.image ? (
                                <img src={form.image} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
                                    <ImageIcon size={40} style={{ opacity: 0.5, marginBottom: '4px' }} />
                                    <div style={{ fontSize: '10px', fontWeight: 800 }}>UNGGAH FOTO</div>
                                </div>
                            )}
                            <input 
                                id="product-image-upload"
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            handleField('image', reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                        <div style={{ marginTop: '14px', fontSize: '13px', fontWeight: 800, color: '#64748b' }}>
                            {form.image ? 'Foto Terpasang' : 'Ketuk untuk Unggah'}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>NAMA MENU</label>
                        <div style={{ position: 'relative' }}>
                            <input 
                                className="form-input" 
                                placeholder="Contoh: Kopi Susu Aren" 
                                style={{ paddingLeft: '16px', borderRadius: '18px', background: '#f8fafc', border: '1.5px solid #f1f5f9', height: '52px' }} 
                                value={form.name} 
                                onChange={(e) => handleField('name', e.target.value)} 
                            />
                        </div>
                    </div>

                    <div className="form-row" style={{ display: 'flex', gap: '16px', marginBottom: '32px' }}>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>KATEGORI</label>
                            <div className="select-wrapper" style={{ height: '48px' }}>
                                <select className="form-select" style={{ borderRadius: '16px', background: '#f8fafc', border: '1.5px solid #f1f5f9', fontWeight: 700 }} value={form.category} onChange={(e) => handleField('category', e.target.value)}>
                                    {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                                </select>
                                <ChevronDown size={16} className="select-icon" />
                            </div>
                        </div>
                        <div className="form-group" style={{ flex: 1 }}>
                            <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>HARGA JUAL</label>
                            <div style={{ position: 'relative' }}>
                                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#f59e0b' }}>Rp</div>
                                <input className="form-input" type="number" placeholder="0" style={{ paddingLeft: '44px', borderRadius: '16px', background: '#f8fafc', border: '1.5px solid #f1f5f9', fontWeight: 900, color: '#0f172a' }} value={form.sellingPrice} onChange={(e) => handleField('sellingPrice', e.target.value)} inputMode="numeric" />
                            </div>
                        </div>
                    </div>
                    
                    <button className="btn-primary full-width" style={{ height: '60px', borderRadius: '20px', fontSize: '16px', fontWeight: 900, boxShadow: '0 10px 25px rgba(245, 158, 11, 0.3)' }} disabled={!form.name || !form.sellingPrice} onClick={handleSaveProduct}>
                        <Save size={20} style={{ marginRight: '8px' }} /> {isEdit ? 'Simpan Perubahan' : 'Tambah Menu'}
                    </button>
                </div>
            </div>
        );
    }

    // ─── Product List View ───────────────────────────────────────────────────────
    return (
        <div className="page-container fade-in">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Katalog Menu</h1>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{products.length} item menu tersedia</p>
                </div>
                {isOwner && (
                    <button className="btn-icon-primary" onClick={() => { setForm(emptyForm); setView('add-product'); }}>
                        <Plus size={20} />
                    </button>
                )}
            </div>

            <div className="search-bar" style={{ 
                background: 'white', 
                border: '1.5px solid #f1f5f9', 
                borderRadius: '16px', 
                padding: '0 16px', 
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px'
            }}>
                <Search size={18} style={{ color: '#94a3b8' }} />
                <input
                    className="search-input"
                    placeholder="Cari menu, kategori..."
                    style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '15px' }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="inventory-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {filtered.length === 0 ? (
                    <div className="empty-state" style={{ padding: '60px 0' }}>
                        <Package size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                        <p style={{ fontWeight: 600, color: '#94a3b8' }}>Menu tidak ditemukan</p>
                    </div>
                ) : (
                    filtered.map((product) => {
                        return (
                            <div key={product.id} className="inv-card" style={{ 
                                background: 'white', 
                                padding: '12px', 
                                borderRadius: '16px', 
                                border: '1px solid #f1f5f9',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between'
                            }}>
                                <div className="inv-card-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ 
                                        width: '48px', 
                                        height: '48px', 
                                        borderRadius: '12px', 
                                        background: '#f8fafc', 
                                        overflow: 'hidden',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {product.image ? (
                                            <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            <div style={{ color: '#cbd5e1' }}>{getCategoryIcon(product.category)}</div>
                                        )}
                                    </div>
                                    <div className="inv-info">
                                        <div className="inv-name" style={{ fontWeight: 800, fontSize: '16px' }}>{product.name}</div>
                                    </div>
                                </div>
                                <div className="inv-card-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div className="inv-price-tag" style={{ fontWeight: 800 }}>
                                        {formatRupiah(product.sellingPrice)}
                                    </div>
                                    {isOwner && (
                                        <div className="inv-actions" style={{ display: 'flex', gap: '4px' }}>
                                            <button className="btn-icon-secondary" style={{ width: '32px', height: '32px' }} onClick={() => openEdit(product)}>
                                                <Edit2 size={14} />
                                            </button>
                                            <button className="btn-icon-secondary" style={{ width: '32px', height: '32px', color: '#ef4444' }} onClick={() => setDeleteConfirm(product.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" style={{ padding: '24px', background: 'white', borderRadius: '24px', maxWidth: '320px', width: '90%', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ background: '#fee2e2', color: '#ef4444', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifySelf: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <Trash2 size={24} />
                        </div>
                        <h3 className="modal-title" style={{ marginBottom: '8px', fontSize: '18px' }}>Hapus Menu?</h3>
                        <p className="modal-body" style={{ color: '#666', marginBottom: '24px', fontSize: '14px' }}>
                            Menu <strong>{products.find((p) => p.id === deleteConfirm)?.name}</strong> akan dihapus permanen.
                        </p>
                        <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <button className="btn-primary" style={{ background: '#ef4444' }} onClick={() => { deleteProduct(deleteConfirm); setDeleteConfirm(null); }}>Hapus Menu</button>
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

'use client';

import { useState, useMemo } from 'react';
import {
    Search, ShoppingCart, Trash2, Plus, Minus, X, CheckCircle, ChevronLeft,
    Package, Flame, Droplets, AlertTriangle,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah } from '@/lib/utils';
import type { Sale } from '@/lib/store';

const CATEGORIES = ['Semua', 'Gas', 'Air Minum'];

type PosView = 'catalog' | 'cart' | 'success';

function getCategoryIcon(category: string) {
    const map: Record<string, React.ReactNode> = {
        Gas: <Flame size={20} />,
        'Air Minum': <Droplets size={20} />,
    };
    return map[category] ?? <Package size={20} />;
}

export default function POS() {
    const products = useStore((s) => s.products);
    const cart = useStore((s) => s.cart);
    const addToCart = useStore((s) => s.addToCart);
    const removeFromCart = useStore((s) => s.removeFromCart);
    const updateCartQty = useStore((s) => s.updateCartQty);
    const clearCart = useStore((s) => s.clearCart);
    const completeSale = useStore((s) => s.completeSale);
    const getCartTotal = useStore((s) => s.getCartTotal);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Semua');
    const [view, setView] = useState<PosView>('catalog');
    const [cashInput, setCashInput] = useState('');
    const [lastSale, setLastSale] = useState<Sale | null>(null);

    const cartTotal = getCartTotal();
    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase());
            const matchesCategory = category === 'Semua' || p.category === category;
            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    const cash = parseFloat(cashInput) || 0;
    const change = cash - cartTotal;

    const handleCheckout = () => {
        if (cart.length === 0 || cash < cartTotal) return;
        const sale = completeSale(cash);
        if (sale) {
            setLastSale(sale);
            setCashInput('');
            setView('success');
        }
    };

    const handleNewSale = () => {
        setLastSale(null);
        setView('catalog');
    };

    // Success screen
    if (view === 'success' && lastSale) {
        return (
            <div className="page-container success-screen">
                <div className="success-card">
                    <div className="success-icon">
                        <CheckCircle size={56} />
                    </div>
                    <h2 className="success-title">Transaksi Berhasil!</h2>
                    <div className="receipt">
                        <div className="receipt-row">
                            <span>Total Belanja</span>
                            <strong>{formatRupiah(lastSale.grossRevenue)}</strong>
                        </div>
                        <div className="receipt-row">
                            <span>Uang Diterima</span>
                            <strong>{formatRupiah(lastSale.cashReceived)}</strong>
                        </div>
                        <div className="receipt-divider" />
                        <div className="receipt-row highlight">
                            <span>Kembalian</span>
                            <strong className="change-amount">{formatRupiah(lastSale.change)}</strong>
                        </div>
                        <div className="receipt-row muted">
                            <span>Laba Kotor</span>
                            <span>{formatRupiah(lastSale.grossProfit)}</span>
                        </div>
                    </div>
                    <div className="receipt-items">
                        {lastSale.items.map((item) => (
                            <div key={item.productId} className="receipt-item">
                                <span>{item.productName}</span>
                                <span>x{item.quantity}</span>
                                <span>{formatRupiah(item.subtotal)}</span>
                            </div>
                        ))}
                    </div>
                    <button className="btn-primary full-width mt-6" onClick={handleNewSale}>
                        Transaksi Baru
                    </button>
                </div>
            </div>
        );
    }

    // Cart view
    if (view === 'cart') {
        return (
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => setView('catalog')}>
                        <ChevronLeft size={20} />
                        <span>Katalog</span>
                    </button>
                    <h1 className="page-title">Keranjang</h1>
                    {cart.length > 0 && (
                        <button className="text-btn-red" onClick={clearCart}>
                            <Trash2 size={16} />
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="empty-state">
                        <ShoppingCart size={56} />
                        <p>Keranjang kosong</p>
                        <button className="btn-secondary" onClick={() => setView('catalog')}>Pilih Produk</button>
                    </div>
                ) : (
                    <>
                        <div className="cart-items">
                            {cart.map((item) => {
                                const stockOk = item.product.stock >= item.quantity;
                                return (
                                    <div key={item.product.id} className="cart-item">
                                        <div className="cart-item-body">
                                            <div className="cart-item-name">{item.product.name}</div>
                                            <div className="cart-item-price">{formatRupiah(item.product.sellingPrice)}</div>
                                            {!stockOk && (
                                                <div className="cart-item-warn"><AlertTriangle size={12} /> Stok tidak cukup</div>
                                            )}
                                        </div>
                                        <div className="qty-control">
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="qty-value">{item.quantity}</span>
                                            <button
                                                className="qty-btn"
                                                onClick={() => updateCartQty(item.product.id, item.quantity + 1)}
                                                disabled={item.quantity >= item.product.stock}
                                            >
                                                <Plus size={14} />
                                            </button>
                                            <button
                                                className="qty-btn remove"
                                                onClick={() => removeFromCart(item.product.id)}
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <div className="cart-item-subtotal">
                                            {formatRupiah(item.product.sellingPrice * item.quantity)}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Checkout Panel */}
                        <div className="checkout-panel">
                            <div className="checkout-total">
                                <span>Total</span>
                                <strong>{formatRupiah(cartTotal)}</strong>
                            </div>
                            <div className="cash-input-group">
                                <label className="cash-label">Uang Diterima (Rp)</label>
                                <input
                                    className="cash-input"
                                    type="number"
                                    placeholder="0"
                                    value={cashInput}
                                    onChange={(e) => setCashInput(e.target.value)}
                                    inputMode="numeric"
                                />
                            </div>
                            {cash > 0 && (
                                <div className={`change-row ${change >= 0 ? 'ok' : 'err'}`}>
                                    <span>{change >= 0 ? 'Kembalian' : 'Kurang'}</span>
                                    <strong>{formatRupiah(Math.abs(change))}</strong>
                                </div>
                            )}

                            {/* Quick Cash Buttons */}
                            <div className="quick-cash-grid">
                                {[5000, 10000, 20000, 50000, 100000].map((amount) => (
                                    <button
                                        key={amount}
                                        className="quick-cash-btn"
                                        onClick={() => setCashInput(String(amount))}
                                    >
                                        {`${amount >= 1000 ? `${amount / 1000}rb` : amount}`}
                                    </button>
                                ))}
                                <button
                                    className="quick-cash-btn"
                                    onClick={() => setCashInput(String(cartTotal))}
                                >
                                    Pas
                                </button>
                            </div>

                            <button
                                className="btn-primary full-width"
                                disabled={cash < cartTotal || cart.length === 0}
                                onClick={handleCheckout}
                            >
                                Selesaikan Transaksi
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Catalog view (default)
    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Kasir (POS)</h1>
            </div>

            {/* Search */}
            <div className="search-bar">
                <Search size={16} className="search-icon" />
                <input
                    className="search-input"
                    placeholder="Cari produk atau SKU..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Categories */}
            <div className="category-scroll">
                {CATEGORIES.map((cat) => (
                    <button
                        key={cat}
                        className={`category-chip ${category === cat ? 'active' : ''}`}
                        onClick={() => setCategory(cat)}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="product-grid">
                {filteredProducts.length === 0 ? (
                    <div className="empty-state col-span-2">
                        <Package size={40} />
                        <p>Produk tidak ditemukan</p>
                    </div>
                ) : (
                    filteredProducts.map((product) => {
                        const inCart = cart.find((c) => c.product.id === product.id);
                        const outOfStock = product.stock === 0;
                        return (
                            <div
                                key={product.id}
                                className={`product-card ${outOfStock ? 'out-of-stock' : ''}`}
                                onClick={() => !outOfStock && addToCart(product)}
                            >
                                <div className="product-emoji">
                                    {getCategoryIcon(product.category)}
                                </div>
                                <div className="product-name">{product.name}</div>
                                <div className="product-price">{formatRupiah(product.sellingPrice)}</div>
                                <div className="product-stock-info">
                                    <span className={`mini-stock ${product.stock <= product.lowStockThreshold ? 'low' : ''} ${outOfStock ? 'out' : ''}`}>
                                        {outOfStock ? 'Habis' : `Stok: ${product.stock}`}
                                    </span>
                                    {inCart && (
                                        <span className="in-cart-badge">+{inCart.quantity}</span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Cart Bottom Bar */}
            {cart.length > 0 && (
                <div className="cart-bottom-bar">
                    <button className="cart-bottom-btn" onClick={() => setView('cart')}>
                        <ShoppingCart size={20} />
                        <span>{cartCount} item · {formatRupiah(cartTotal)}</span>
                        <span className="cart-arrow">→</span>
                    </button>
                </div>
            )}
        </div>
    );
}

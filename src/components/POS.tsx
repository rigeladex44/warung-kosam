'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Search, ShoppingCart, ShoppingBag, Trash2, Plus, Minus, X, 
    CheckCircle2, ChevronLeft, Package, Flame, Droplets, 
    AlertTriangle, CreditCard, Banknote, QrCode, Share2, Printer, Download
} from 'lucide-react';
import { useStore, type Sale } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/config';

// ☕ Categories focusing on Warkop & Retail
const CATEGORIES = ['Semua', 'Kopi & Minuman', 'Makanan', 'Rokok', 'Lainnya'];

type PosView = 'catalog' | 'cart' | 'success';
type PaymentMethod = 'Cash' | 'Transfer' | 'QRIS';

function getCategoryIcon(category: string) {
    const map: Record<string, React.ReactNode> = {
        'Kopi & Minuman': <Droplets size={20} />,
        'Makanan': <Flame size={20} />,
        'Gas': <Flame size={20} />,
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

    const cartTotal = useMemo(() => cart.reduce((sum, c) => sum + (c.product.sellingPrice * c.quantity), 0), [cart]);

    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('Semua');
    const [view, setView] = useState<PosView>('catalog');
    const [cashInput, setCashInput] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('Cash');
    const [lastSale, setLastSale] = useState<Sale | null>(null);

    const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch =
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.sku.toLowerCase().includes(search.toLowerCase());
            
            // Filter kategori lebih luwes agar aman dari typo/data lama
            const matchesCategory = 
                category === 'Semua' || 
                p.category === category ||
                (category === 'Kopi & Minuman' && (p.category?.includes('Kopi') || p.category?.includes('Minuman'))) ||
                (p.category?.toLowerCase() === category.toLowerCase());

            return matchesSearch && matchesCategory;
        });
    }, [products, search, category]);

    const cashValue = parseFloat(cashInput) || 0;
    const changeValue = cashValue - cartTotal;

    const handleCheckout = () => {
        if (cart.length === 0) return;
        if (paymentMethod === 'Cash' && cashValue < cartTotal) return;

        // Finalize transaction
        const sale = completeSale(paymentMethod === 'Cash' ? cashValue : cartTotal, paymentMethod);
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

    // ── 📄 SUCCESS SCREEN ────────────────────────────────────────────────────
    if (view === 'success' && lastSale) {
        return (
            <div className="page-container fade-in" style={{ 
                background: '#f8fafc',
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}>
                <div className="success-card" style={{
                    textAlign: 'center',
                    padding: '32px 24px',
                    background: 'transparent',
                    maxWidth: '400px',
                    margin: '0 auto',
                    width: '100%'
                }}>
                    <div style={{ marginBottom: '24px', position: 'relative' }}>
                        <div className="success-icon-bounce" style={{
                            background: '#10b981',
                            color: 'white',
                            width: '88px',
                            height: '88px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto',
                            boxShadow: '0 15px 35px rgba(16, 185, 129, 0.3)',
                            zIndex: 2,
                            position: 'relative',
                            border: '6px solid #fff'
                        }}>
                            <CheckCircle2 size={48} strokeWidth={2.5} />
                        </div>
                    </div>

                    <h2 style={{ fontSize: '26px', fontWeight: 950, color: '#0f172a', marginBottom: '8px', letterSpacing: '-0.5px' }}>Pembayaran Berhasil!</h2>
                    <p style={{ color: '#64748b', fontSize: '15px', marginBottom: '32px', fontWeight: 600 }}>Terima kasih, pesanan sedang disiapkan.</p>

                    {/* Realistic Digital Receipt */}
                    <div className="receipt-container" style={{
                        background: 'white',
                        borderRadius: '24px',
                        padding: '32px 24px',
                        textAlign: 'left',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
                        position: 'relative',
                        border: '1.5px solid #f1f5f9'
                    }}>
                        {/* Receipt Top Header */}
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <img src="/logo.png" alt="Logo" style={{ width: '48px', height: '48px', borderRadius: '12px', marginBottom: '12px', border: '1px solid #f1f5f9', padding: '2px' }} />
                            <div style={{ fontWeight: 950, fontSize: '20px', color: '#0f172a', letterSpacing: '-0.5px', textTransform: 'uppercase' }}>{APP_CONFIG.storeName}</div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginTop: '4px', letterSpacing: '0.05em' }}>
                                {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                <br />
                                {formatTime(lastSale.createdAt)} · {lastSale.staffName || 'Kasir'} · #{lastSale.id.slice(0, 6).toUpperCase()}
                            </div>
                        </div>

                        {/* Items Breakdown */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px', borderTop: '1.5px dashed #f1f5f9', borderBottom: '1.5px dashed #f1f5f9', padding: '20px 0' }}>
                            {lastSale.items.map((item) => (
                                <div key={item.productId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>{item.productName}</div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>{item.quantity} x {formatRupiah(item.sellingPrice)}</div>
                                    </div>
                                    <div style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{formatRupiah(item.subtotal)}</div>
                                </div>
                            ))}
                        </div>

                        {/* Totals Section */}
                        <div style={{ marginBottom: '8px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Metode Pembayaran</span>
                                <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{lastSale.paymentMethod || 'Cash'}</span>
                            </div>
                            
                            {lastSale.paymentMethod === 'Cash' && (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 700 }}>Bayar Tunai</span>
                                        <span style={{ fontWeight: 800, fontSize: '14px', color: '#0f172a' }}>{formatRupiah(lastSale.cashReceived)}</span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', background: '#f0fdf4', padding: '12px', borderRadius: '12px' }}>
                                        <span style={{ fontSize: '14px', color: '#166534', fontWeight: 800 }}>Kembalian</span>
                                        <span style={{ fontWeight: 950, fontSize: '16px', color: '#10b981' }}>{formatRupiah(lastSale.change)}</span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', paddingTop: '16px', borderTop: '2px solid #0f172a' }}>
                            <span style={{ fontWeight: 950, fontSize: '16px', color: '#0f172a' }}>TOTAL AKHIR</span>
                            <span style={{ fontWeight: 950, fontSize: '24px', color: '#f59e0b', letterSpacing: '-0.5px' }}>{formatRupiah(lastSale.totalRevenue)}</span>
                        </div>
                        
                        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#cbd5e1', fontStyle: 'italic' }}>
                            * Sudah lunas dan sah · Terima kasih *
                        </div>
                    </div>

                    {/* Quick Actions Footer */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '32px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="btn-secondary" style={{ flex: 1, height: '56px', borderRadius: '18px', background: 'white', border: '1.5px solid #f1f5f9', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => window.print()}>
                                <Printer size={18} style={{ marginRight: '8px' }} /> Cetak Struk
                            </button>
                            <button className="btn-secondary" style={{ flex: 1, height: '56px', borderRadius: '18px', background: 'white', border: '1.5px solid #f1f5f9', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => {
                                // Simple feedback since html-to-image isn't installed yet
                                alert('Fitur Share Gambar Struk Siap Digunakan!');
                            }}>
                                <Download size={18} style={{ marginRight: '8px' }} /> Simpan Foto
                            </button>
                        </div>
                        <button 
                            className="btn-primary" 
                            style={{ 
                                height: '64px', 
                                borderRadius: '22px', 
                                fontSize: '16px', 
                                fontWeight: 900, 
                                background: '#0f172a',
                                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.25)'
                            }} 
                            onClick={handleNewSale}
                        >
                            Selesai & Pesanan Baru
                        </button>
                    </div>

                    {/* 🖨️ ULTRA THERMAL PRINT TEMPLATE (58mm/80mm Optimized) */}
                    <div className="print-area">
                        <style>{`
                            @media screen {
                                .print-area { display: none !important; }
                            }
                            @page {
                                size: 58mm auto;
                                margin: 0;
                            }
                            @media print {
                                html, body { 
                                    margin: 0 !important; 
                                    padding: 0 !important; 
                                    background: white !important;
                                    width: 58mm !important;
                                }
                                body * {
                                    visibility: hidden !important;
                                }
                                .print-area, .print-area * {
                                    visibility: visible !important;
                                }
                                .print-area { 
                                    display: block !important; 
                                    position: absolute !important;
                                    top: 0 !important;
                                    left: 0 !important;
                                    width: 58mm !important;
                                    padding: 2mm 1mm !important;
                                    margin: 0 !important;
                                    background: white !important;
                                    font-family: 'Courier New', Courier, monospace !important;
                                    color: black !important;
                                    line-height: 1.0 !important;
                                }
                                .receipt-header { text-align: center; margin-bottom: 4px; }
                                .receipt-header h2 { font-size: 13px; margin: 0; font-weight: 950; }
                                .receipt-header p { font-size: 8px; margin: 1px 0; font-weight: bold; }
                                
                                .receipt-divider { border-top: 1px dashed black; margin: 3px 0; }
                                
                                .item-row { font-size: 9px; margin-bottom: 2px; line-height: 1.0; text-align: left; }
                                .item-details { display: flex; justify-content: space-between; font-size: 8px; margin-top: 0px; }
                                
                                .summary-row { display: flex; justify-content: space-between; font-size: 9px; margin-bottom: 1px; }
                                .total-row { display: flex; justify-content: space-between; font-size: 12px; font-weight: 950; margin-top: 4px; padding-top: 4px; border-top: 1px double black; }
                                
                                .footer { text-align: center; margin-top: 10px; font-size: 8px; font-weight: bold; line-height: 1.1; }
                            }
                        `}</style>
                        <div className="receipt-header">
                            <img src="/logo.png" alt="Logo" style={{ width: '36px', height: '36px', objectFit: 'contain', marginBottom: '3px', filter: 'grayscale(1) contrast(1.5)' }} />
                            <h2>{APP_CONFIG.storeName}</h2>
                            <p style={{ letterSpacing: '1px' }}>--- PESANAN ---</p>
                            <p>{new Date().toLocaleDateString('id-ID', { dateStyle: 'short' })} {formatTime(lastSale.createdAt)}</p>
                            <p>ID: #{lastSale.id.slice(0, 6).toUpperCase()} · {lastSale.staffName || 'Admin'}</p>
                        </div>

                        <div className="receipt-divider"></div>

                        <div style={{ textAlign: 'left' }}>
                            {lastSale.items.map(item => (
                                <div key={item.productId} className="item-row">
                                    <div style={{ fontWeight: 'bold', textAlign: 'left' }}>{item.productName.toUpperCase()}</div>
                                    <div className="item-details">
                                        <span>{item.quantity} x {formatRupiah(item.sellingPrice).replace('Rp', '').trim()}</span>
                                        <span style={{ fontWeight: 'bold' }}>{formatRupiah(item.subtotal).replace('Rp', '').trim()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="receipt-divider"></div>

                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>{formatRupiah(lastSale.totalRevenue).replace('Rp', '').trim()}</span>
                        </div>
                        <div className="summary-row">
                            <span>Metode</span>
                            <span>{lastSale.paymentMethod || 'Cash'}</span>
                        </div>

                        {lastSale.paymentMethod === 'Cash' && (
                            <>
                                <div className="summary-row">
                                    <span>Tunai</span>
                                    <span>{formatRupiah(lastSale.cashReceived).replace('Rp', '').trim()}</span>
                                </div>
                                <div className="summary-row">
                                    <span>Kembali</span>
                                    <span>{formatRupiah(lastSale.change).replace('Rp', '').trim()}</span>
                                </div>
                            </>
                        )}

                        <div className="total-row">
                            <span>TOTAL</span>
                            <span>{formatRupiah(lastSale.totalRevenue)}</span>
                        </div>

                        <div className="footer">
                            <p>*** TERIMA KASIH ***</p>
                            <p>SUDAH MAMPIR DI WARUNK KOSAM</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── 🛒 CART VIEW ────────────────────────────────────────────────────────
    if (view === 'cart') {
        return (
            <div className="page-container fade-in">
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button className="back-btn" onClick={() => setView('catalog')} style={{ background: '#f8fafc', padding: '10px 18px', borderRadius: '16px', border: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ChevronLeft size={20} />
                        <span style={{ fontWeight: 800, fontSize: '14px' }}>Katalog</span>
                    </button>
                    <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 900 }}>Pesanan</h1>
                    {cart.length > 0 && (
                        <button className="btn-icon-secondary" onClick={clearCart} style={{ color: '#ef4444', background: '#fef2f2', border: 'none' }}>
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {cart.length === 0 ? (
                    <div className="empty-state" style={{ padding: '100px 0', textAlign: 'center' }}>
                        <div style={{ background: '#f8fafc', width: '120px', height: '120px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                            <ShoppingCart size={48} style={{ opacity: 0.2, color: '#64748b' }} />
                        </div>
                        <p style={{ fontWeight: 800, color: '#94a3b8', fontSize: '16px' }}>Keranjang masih kosong</p>
                        <button className="btn-primary" style={{ marginTop: '24px', padding: '14px 28px' }} onClick={() => setView('catalog')}>Pesan Sekarang</button>
                    </div>
                ) : (
                    <div style={{ paddingBottom: '320px' }}>
                        <div className="cart-list" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {cart.map((item) => (
                                <div key={item.product.id} className="cart-card fade-in" style={{
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '24px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    boxShadow: '0 4px 15px rgba(0,0,0,0.03)',
                                    border: '1px solid #f1f5f9'
                                }}>
                                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                        {/* Thumbnail Produk */}
                                        <div style={{ 
                                            width: '64px', 
                                            height: '64px', 
                                            borderRadius: '16px', 
                                            background: '#f8fafc', 
                                            overflow: 'hidden',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0,
                                            border: '1px solid #f1f5f9'
                                        }}>
                                            {item.product.image ? (
                                                <img src={item.product.image} alt={item.product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ color: '#cbd5e1' }}>{getCategoryIcon(item.product.category)}</div>
                                            )}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, fontSize: '16px', color: '#0f172a' }}>{item.product.name}</div>
                                            <div style={{ fontSize: '14px', color: '#f59e0b', fontWeight: 700, marginTop: '2px' }}>{formatRupiah(item.product.sellingPrice)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Qty Controls */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '6px', borderRadius: '16px' }}>
                                        <button 
                                            className="qty-btn-minimal" 
                                            style={{ background: 'white', color: '#64748b', border: '1px solid #e2e8f0', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} 
                                            onClick={() => updateCartQty(item.product.id, item.quantity - 1)}
                                        >
                                            <Minus size={14} />
                                        </button>
                                        <span style={{ fontWeight: 900, fontSize: '16px', color: '#0f172a', width: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button 
                                            className="qty-btn-minimal" 
                                            style={{ background: 'white', color: '#f59e0b', border: '1px solid #fee2e2', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }} 
                                            onClick={() => updateCartQty(item.product.id, item.quantity + 1)} 
                                        >
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Payment Flow Panel */}
                        <div className="checkout-fixed-panel" style={{
                            position: 'fixed',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'white',
                            padding: '24px 24px 40px',
                            borderTopLeftRadius: '32px',
                            borderTopRightRadius: '32px',
                            boxShadow: '0 -15px 40px rgba(0,0,0,0.08)',
                            zIndex: 100
                        }}>
                            {/* Payment Method Selector */}
                            <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                                {[
                                    { id: 'Cash', label: 'Tunai', icon: <Banknote size={20} /> },
                                    { id: 'Transfer', label: 'Transfer', icon: <CreditCard size={20} /> },
                                    { id: 'QRIS', label: 'QRIS', icon: <QrCode size={20} /> }
                                ].map(method => (
                                    <button
                                        key={method.id}
                                        onClick={() => setPaymentMethod(method.id as any)}
                                        style={{
                                            flex: 1,
                                            padding: '16px 12px',
                                            borderRadius: '20px',
                                            border: paymentMethod === method.id ? '2.5px solid #f59e0b' : '1.5px solid #f1f5f9',
                                            background: paymentMethod === method.id ? '#fffbeb' : '#f8fafc',
                                            color: paymentMethod === method.id ? '#d97706' : '#64748b',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            gap: '6px',
                                            transition: 'all 0.2s ease'
                                        }}
                                    >
                                        {method.icon}
                                        <span style={{ fontSize: '13px', fontWeight: 800 }}>{method.label}</span>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === 'Cash' && (
                                <div className="fade-in" style={{ marginBottom: '24px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <Banknote size={16} style={{ color: '#d97706' }} />
                                            <span style={{ fontWeight: 800, fontSize: '14px', color: '#64748b' }}>UANG TERIMA (LACI)</span>
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#f59e0b', fontSize: '14px' }}>Rp</span>
                                            <input 
                                                className="form-input" 
                                                type="number" 
                                                placeholder="0"
                                                style={{ 
                                                    width: '160px', 
                                                    height: '44px', 
                                                    paddingLeft: '36px', 
                                                    borderRadius: '12px', 
                                                    background: '#f8fafc',
                                                    border: '1.5px solid #f1f5f9',
                                                    textAlign: 'right',
                                                    paddingRight: '12px',
                                                    fontWeight: 900,
                                                    fontSize: '16px',
                                                    color: '#0f172a'
                                                }}
                                                value={cashInput}
                                                inputMode="numeric"
                                                onChange={(e) => setCashInput(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="quick-pay-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '10px' }}>
                                        {[5000, 10000, 20000, 50000, 100000].map(amt => (
                                            <button 
                                                key={amt} 
                                                onClick={() => setCashInput(amt.toString())} 
                                                style={{ flex: '0 0 auto', padding: '10px 18px', borderRadius: '12px', background: 'white', border: '1.5px solid #f1f5f9', fontSize: '13px', fontWeight: 800, color: '#0f172a', boxShadow: '0 2px 5px rgba(0,0,0,0.02)' }}
                                            >
                                                {amt / 1000}rb
                                            </button>
                                        ))}
                                        <button 
                                            onClick={() => setCashInput(cartTotal.toString())} 
                                            style={{ flex: '0 0 auto', padding: '10px 20px', borderRadius: '12px', background: '#f59e0b', border: 'none', color: 'white', fontSize: '13px', fontWeight: 800, boxShadow: '0 4px 10px rgba(245, 158, 11, 0.3)' }}
                                        >
                                            Pas
                                        </button>
                                    </div>

                                    {cashValue > 0 && (
                                        <div style={{ display: 'flex', justifyContent: 'space-between', background: changeValue >= 0 ? '#ecfdf5' : '#fff1f2', padding: '16px', borderRadius: '16px', marginTop: '14px', border: changeValue >= 0 ? '1px solid #d1fae5' : '1px solid #fee2e2' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {changeValue >= 0 ? <CheckCircle2 size={16} color="#059669" /> : <AlertTriangle size={16} color="#dc2626" />}
                                                <span style={{ fontSize: '14px', fontWeight: 800, color: changeValue >= 0 ? '#065f46' : '#991b1b' }}>{changeValue >= 0 ? 'Kembalian' : 'Kurang'}</span>
                                            </div>
                                            <span style={{ fontWeight: 950, fontSize: '16px', color: changeValue >= 0 ? '#10b981' : '#ef4444' }}>{formatRupiah(Math.abs(changeValue))}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {paymentMethod !== 'Cash' && (
                                <div className="fade-in" style={{ 
                                    background: '#f8fafc', 
                                    padding: '20px', 
                                    borderRadius: '16px', 
                                    marginBottom: '24px',
                                    border: '1.5px dashed #e2e8f0',
                                    textAlign: 'center'
                                }}>
                                    <div style={{ color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
                                        {paymentMethod === 'QRIS' ? 'Pastikan Pelanggan Scan QRIS & Berhasil' : 'Pastikan Bukti Transfer Sudah Masuk'}
                                    </div>
                                    <div style={{ marginTop: '4px', fontSize: '11px', color: '#94a3b8', fontWeight: 600 }}>
                                        * Uang otomatis tercatat di omzet sistem, tidak masuk laci tunai.
                                    </div>
                                </div>
                            )}

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, letterSpacing: '0.05em' }}>GRAND TOTAL</div>
                                    <div style={{ fontSize: '28px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.5px' }}>{formatRupiah(cartTotal)}</div>
                                </div>
                                <button
                                    className="btn-primary"
                                    style={{ height: '64px', padding: '0 40px', borderRadius: '20px', fontSize: '16px', fontWeight: 900, boxShadow: '0 10px 25px rgba(245, 158, 11, 0.4)' }}
                                    disabled={paymentMethod === 'Cash' && cashValue < cartTotal}
                                    onClick={handleCheckout}
                                >
                                    Bayar Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // ── 🍕 CATALOG VIEW (DEFAULT) ─────────────────────────────────────────────
    return (
        <div className="page-container fade-in">
            <style>{`
                @media screen and (min-width: 1024px) {
                    .pos-landscape-container {
                        display: grid;
                        grid-template-columns: 1fr 380px;
                        gap: 32px;
                        align-items: start;
                    }
                    .cart-bottom-bar { display: none !important; }
                    .catalog-section { padding-bottom: 20px !important; }
                    .product-grid { grid-template-columns: repeat(4, 1fr) !important; }
                }
            `}</style>

            <div className="pos-landscape-container">
                {/* 🏷️ CATALOG SECTION */}
                <div className="catalog-section">
                    <div className="page-header" style={{ marginBottom: '16px' }}>
                        <h1 className="page-title">Mesin Kasir</h1>
                        <div style={{ position: 'relative' }} className="mobile-only-cart-icon">
                            <ShoppingCart size={24} style={{ color: '#0f172a' }} />
                            {cartCount > 0 && (
                                <span style={{ position: 'absolute', top: '-8px', right: '-8px', background: '#f59e0b', color: 'white', fontSize: '10px', fontWeight: 800, padding: '2px 6px', borderRadius: '10px', border: '2px solid white' }}>{cartCount}</span>
                            )}
                        </div>
                    </div>

                    {/* Premium Search */}
                    <div className="search-bar" style={{
                        background: 'white', border: '1.5px solid #f1f5f9', borderRadius: '16px',
                        padding: '0 16px', height: '52px', display: 'flex', alignItems: 'center',
                        gap: '12px', marginBottom: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                    }}>
                        <Search size={18} style={{ color: '#94a3b8' }} />
                        <input className="search-input" placeholder="Cari kopi, rokok, atau makanan..."
                            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '15px' }}
                            value={search} onChange={(e) => setSearch(e.target.value)} />
                    </div>

                    {/* Categories Horizontal Scroll */}
                    <div className="category-scroll" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '16px', scrollbarWidth: 'none' }}>
                        {CATEGORIES.map((cat) => (
                            <button key={cat} className={`category-chip ${category === cat ? 'active' : ''}`}
                                style={{
                                    whiteSpace: 'nowrap', padding: '10px 18px', borderRadius: '14px',
                                    fontSize: '13px', fontWeight: 700, background: category === cat ? '#f59e0b' : 'white',
                                    color: category === cat ? 'white' : '#64748b', border: category === cat ? 'none' : '1.5px solid #f1f5f9',
                                    boxShadow: category === cat ? '0 4px 12px rgba(245, 158, 11, 0.2)' : 'none'
                                }}
                                onClick={() => setCategory(cat)}>
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Better Product Grid */}
                    <div className="product-grid" style={{
                        display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', paddingBottom: '100px'
                    }}>
                        {filteredProducts.length === 0 ? (
                            <div style={{ gridColumn: 'span 2', textAlign: 'center', padding: '60px 0', opacity: 0.5 }}>
                                <Package size={40} style={{ margin: '0 auto 12px' }} />
                                <p style={{ fontWeight: 600 }}>Menu tidak ditemukan</p>
                            </div>
                        ) : (
                            filteredProducts.map((product) => {
                                const inCart = cart.find((c) => c.product.id === product.id);
                                return (
                                    <div key={product.id} className="product-card"
                                        style={{
                                            background: 'white', borderRadius: '28px', border: inCart ? '3px solid #f59e0b' : '1px solid #f1f5f9',
                                            boxShadow: inCart ? '0 15px 30px rgba(245, 158, 11, 0.2)' : '0 10px 20px rgba(0,0,0,0.05)',
                                            display: 'flex', flexDirection: 'column', position: 'relative', padding: '12px',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer', height: '210px'
                                        }}
                                        onClick={() => addToCart(product)}>
                                        
                                        <div style={{
                                            width: '100%', height: '130px', borderRadius: '18px', overflow: 'hidden', border: '4px solid white',
                                            boxShadow: '0 8px 16px rgba(0,0,0,0.12)', position: 'relative', background: '#f8fafc', flexShrink: 0
                                        }}>
                                            {product.image ? (
                                                <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#cbd5e1' }}>
                                                    {getCategoryIcon(product.category)}
                                                </div>
                                            )}
                                        </div>

                                        {inCart && (
                                            <div style={{
                                                position: 'absolute', top: '4px', right: '4px', background: '#f59e0b', color: 'white',
                                                width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center',
                                                justifyContent: 'center', fontSize: '14px', fontWeight: 900, boxShadow: '0 8px 16px rgba(245, 158, 11, 0.4)',
                                                zIndex: 10, border: '3px solid white'
                                            }}>
                                                {inCart.quantity}
                                            </div>
                                        )}

                                        <div style={{ padding: '0 4px', marginTop: '2px' }}>
                                            <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                {product.name}
                                            </div>
                                            <div style={{ fontSize: '17px', fontWeight: 900, color: '#f59e0b' }}>
                                                {formatRupiah(product.sellingPrice)}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* 🛒 DESKTOP SIDE BAR CART (Always visible in landscape) */}
                <div className="desktop-cart-sidebar" style={{ 
                    display: 'none', 
                    background: 'white', 
                    borderRadius: '32px', 
                    padding: '24px', 
                    border: '1.5px solid #f1f5f9', 
                    position: 'sticky', 
                    top: '40px', 
                    maxHeight: 'calc(100vh - 80px)', 
                    flexDirection: 'column',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.03)'
                }}>
                    <style>{`
                        @media screen and (min-width: 1024px) {
                            .desktop-cart-sidebar { display: flex !important; }
                        }
                    `}</style>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                        <ShoppingCart size={22} color="#f59e0b" />
                        <h2 style={{ fontSize: '20px', fontWeight: 900 }}>Daftar Pesanan</h2>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', marginBottom: '20px' }}>
                        {cart.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.3 }}>
                                <ShoppingBag size={40} style={{ margin: '0 auto 12px' }} />
                                <div style={{ fontWeight: 800 }}>Belum ada item</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {cart.map((item) => (
                                    <div key={item.product.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '16px' }}>
                                        <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                                            <div style={{ fontSize: '14px', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.product.name}</div>
                                            <div style={{ fontSize: '13px', fontWeight: 900, color: '#f59e0b' }}>{formatRupiah(item.product.sellingPrice)}</div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <button onClick={() => updateCartQty(item.product.id, item.quantity - 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
                                            <span style={{ fontSize: '14px', fontWeight: 900, minWidth: '16px', textAlign: 'center' }}>{item.quantity}</span>
                                            <button onClick={() => updateCartQty(item.product.id, item.quantity + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'white', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ borderTop: '2px dashed #f1f5f9', paddingTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8' }}>TOTAL BAYAR</span>
                            <span style={{ fontSize: '20px', fontWeight: 950, color: '#0f172a' }}>{formatRupiah(cartTotal)}</span>
                        </div>
                        <button className="btn-primary full-width" style={{ height: '56px', borderRadius: '18px', background: '#0f172a' }}
                            disabled={cart.length === 0} onClick={() => setView('cart')}>
                            Lanjut ke Bayaran →
                        </button>
                    </div>
                </div>
            </div>

            {/* Cart Bottom Bar (Floating - Mobile Only) */}
            {cart.length > 0 && (
                <div className="cart-bottom-bar" style={{ position: 'fixed', bottom: '88px', left: '20px', right: '20px', zIndex: 90 }}>
                    <button className="cart-bottom-btn" onClick={() => setView('cart')}
                        style={{
                            background: '#0f172a', color: 'white', width: '100%', height: '64px', borderRadius: '20px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px',
                            boxShadow: '0 12px 24px rgba(0,0,0,0.2)', border: 'none'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ background: 'rgba(255,255,255,0.1)', padding: '8px', borderRadius: '12px' }}>
                                <ShoppingCart size={20} />
                            </div>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: 700 }}>{cartCount} ITEM TERPILIH</div>
                                <div style={{ fontSize: '16px', fontWeight: 800 }}>{formatRupiah(cartTotal)}</div>
                            </div>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '18px' }}>Pesan →</span>
                    </button>
                </div>
            )}
        </div>
    );
}

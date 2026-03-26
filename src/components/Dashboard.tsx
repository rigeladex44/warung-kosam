'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    ArrowUpRight, TrendingUp, ShoppingBag, Plus, ClipboardList, Store, LogOut, ChevronRight,
    Zap, Calendar, Wallet, Banknote
} from 'lucide-react';
import { useStore, type Sale } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/config';
import { getActiveUser, clearActiveUser } from '@/lib/users';
import TransactionDetailModal from './TransactionDetailModal';

// Helper to check if date is today
const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    return (
        d.getDate() === today.getDate() &&
        d.getMonth() === today.getMonth() &&
        d.getFullYear() === today.getFullYear()
    );
};

interface DashboardProps {
    onNavigate: (tab: 'dashboard' | 'pos' | 'inventory' | 'finance' | 'karyawan') => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const sales = useStore((s) => s.sales);
    const expenses = useStore((s) => s.expenses);
    const cancelSale = useStore((s) => s.cancelSale);

    // Filter secara lokal dengan useMemo agar stabil
    const todaySales = useMemo(() => sales.filter(s => isToday(s.createdAt)), [sales]);
    const todayExpenses = useMemo(() => expenses.filter(e => isToday(e.createdAt)), [expenses]);

    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeUser, setActiveUser] = useState<any>(null);

    useEffect(() => {
        setActiveUser(getActiveUser());
    }, []);

    // ── Metrics Calculation ───────────────────────────────────────────────────
    const totalRevenue = useMemo(() => todaySales.reduce((sum, s) => sum + s.totalRevenue, 0), [todaySales]);
    const totalExp = useMemo(() => todayExpenses.reduce((sum, e) => sum + e.amount, 0), [todayExpenses]);
    const netProfit = totalRevenue - totalExp;
    const isProfit = netProfit >= 0;
    const transactionCount = todaySales.length;

    const cashRevenue = useMemo(() =>
        todaySales
            .filter(s => !s.paymentMethod || s.paymentMethod === 'Cash')
            .reduce((sum, s) => sum + s.totalRevenue, 0),
        [todaySales]);

    const cashInDrawer = cashRevenue - totalExp;

    const handleLogout = () => {
        clearActiveUser();
        sessionStorage.removeItem('toko_pin_verified');
        window.location.reload();
    };

    return (
        <div className="page-container">
            {/* ── Dashboard Header ── */}
            <div className="page-header" style={{ marginBottom: '32px', alignItems: 'flex-start' }}>
                <div className="fade-in" style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <img
                        src="/logo.png"
                        alt="Logo"
                        style={{
                            width: '72px',
                            height: '72px',
                            borderRadius: '20px',
                            objectFit: 'contain',
                            background: 'white',
                            padding: '6px',
                            boxShadow: '0 8px 20px rgba(0,0,0,0.06)',
                            border: '2px solid #f1f5f9'
                        }}
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                    <div>
                        <h1 className="page-title" style={{ fontSize: '26px', letterSpacing: '-1.2px', lineHeight: 1 }}>{APP_CONFIG.storeName}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <div className="live-dot" />
                            <p className="page-subtitle" style={{ fontSize: '14px', fontWeight: 500 }}>Halo, {activeUser?.name || 'Kasir'} · {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        </div>
                    </div>
                </div>
                <button
                    className="logout-header-btn"
                    onClick={() => setShowLogoutConfirm(true)}
                    style={{ background: '#f3f4f6', padding: '10px', borderRadius: '12px', color: '#666', border: 'none' }}
                >
                    <LogOut size={20} />
                </button>
            </div>

            {/* ── Premium Hero Card with Background Logo ── */}
            <div className="bento-hero fade-in" style={{
                animationDelay: '0.1s',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                boxShadow: '0 12px 32px rgba(245, 158, 11, 0.4)',
                padding: '32px 24px',
                marginBottom: '24px',
                border: 'none',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* 🎨 Background Logo (Cut off on the right) */}
                {APP_CONFIG.logo && (
                    <img
                        src={APP_CONFIG.logo}
                        alt="logo-bg"
                        style={{
                            position: 'absolute',
                            right: '-40px',
                            top: '-10px',
                            height: '130%',
                            width: 'auto',
                            opacity: 0.25,
                            pointerEvents: 'none',
                            transform: 'rotate(12deg)',
                            filter: 'brightness(0) invert(1)' // White-ish logo for dark yellow background
                        }}
                    />
                )}

                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div className="bento-label" style={{ color: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Zap size={14} fill="white" />
                            Total Omzet Hari Ini
                        </div>
                    </div>

                    <div className="bento-value" style={{ fontSize: '38px', margin: '12px 0 8px', letterSpacing: '-1.5px' }}>{formatRupiah(totalRevenue)}</div>
                    <div className="bento-sub" style={{ opacity: 0.9, fontWeight: 500 }}>{transactionCount} transaksi pesanan masuk</div>
                </div>
            </div>

            {/* ── Stats Grid ── */}
            <div className="bento-grid fade-in" style={{ animationDelay: '0.2s', marginBottom: '24px' }}>
                {/* 1. Saldo Tunai: Paling penting buat operasional laci */}
                <div className="bento-mini" style={{ padding: '18px', background: '#fffbeb', border: '1.5px solid #fde68a', position: 'relative', overflow: 'hidden' }}>
                    {/* Background Logo subtle */}
                    {APP_CONFIG.logo && (
                        <img src={APP_CONFIG.logo} alt="l" style={{ position: 'absolute', right: '-15px', bottom: '-40px', height: '130%', opacity: 0.25, filter: 'grayscale(1)', pointerEvents: 'none' }} />
                    )}

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ background: '#fef3c7', color: '#d97706', padding: '8px', borderRadius: '10px' }}>
                                <Banknote size={18} />
                            </div>
                            <div className="bento-mini-label" style={{ margin: 0, fontSize: '11px', color: '#92400e' }}>Uang di Laci</div>
                        </div>
                        <div className="bento-mini-value" style={{ fontSize: '18px', fontWeight: 800, color: '#92400e' }}>{formatRupiah(cashInDrawer)}</div>
                        <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 700, color: '#b45309', opacity: 0.8 }}>
                            {formatRupiah(cashRevenue)} Tn - {formatRupiah(totalExp)} Ex
                        </div>
                    </div>
                </div>

                {/* 2. Saldo Bersih (Accounting) */}
                <div className="bento-mini" style={{ padding: '18px', position: 'relative', overflow: 'hidden' }}>
                    {/* Background Logo subtle */}
                    {APP_CONFIG.logo && (
                        <img src={APP_CONFIG.logo} alt="l" style={{ position: 'absolute', right: '-15px', bottom: '-40px', height: '130%', opacity: 0.25, filter: 'grayscale(1)', pointerEvents: 'none' }} />
                    )}

                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '8px', borderRadius: '10px' }}>
                                <TrendingUp size={18} />
                            </div>
                            <div className="bento-mini-label" style={{ margin: 0 }}>Laba Berjalan</div>
                        </div>
                        <div className="bento-mini-value" style={{ fontSize: '18px' }}>{formatRupiah(netProfit)}</div>
                        <div style={{ marginTop: '4px', fontSize: '10px', fontWeight: 700, color: isProfit ? '#10b981' : '#ef4444' }}>
                            {isProfit ? '↑ Laba' : '↓ Rugi'}
                        </div>
                    </div>
                </div>

                {/* 3. Transaksi (Full width) */}
                <div className="bento-mini" style={{ padding: '18px', gridColumn: 'span 2', position: 'relative', overflow: 'hidden' }}>
                    {/* Background Logo subtle wide */}
                    {APP_CONFIG.logo && (
                        <img src={APP_CONFIG.logo} alt="l" style={{ position: 'absolute', right: '-30px', top: '-10px', height: '140%', opacity: 0.05, filter: 'grayscale(1)', pointerEvents: 'none' }} />
                    )}

                    <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#f1f5f9', color: '#64748b', padding: '8px', borderRadius: '10px' }}>
                                <ShoppingBag size={18} />
                            </div>
                            <div className="bento-mini-label" style={{ margin: 0 }}>Jumlah Transaksi</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
                            <span className="bento-mini-value" style={{ fontSize: '20px' }}>{transactionCount}</span>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>Pesanan</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Quick Actions ── */}
            <div className="section-card fade-in" style={{ animationDelay: '0.3s', border: 'none', background: 'transparent', padding: 0 }}>
                <h2 className="section-title" style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>AKSI CEPAT</h2>
                <div className="quick-actions-row" style={{ display: 'flex', gap: '12px' }}>
                    <button className="btn-primary" style={{
                        flex: 1,
                        height: '68px',
                        background: '#f59e0b',
                        boxShadow: '0 8px 16px rgba(245, 158, 11, 0.25)',
                        borderRadius: '20px'
                    }} onClick={() => onNavigate('pos')}>
                        <Plus size={24} style={{ marginRight: '8px' }} />
                        <span style={{ fontSize: '15px', fontWeight: 800 }}>Kasir POS</span>
                    </button>
                    {activeUser?.role === 'owner' && (
                        <button className="btn-secondary" style={{
                            flex: 1,
                            height: '68px',
                            background: 'white',
                            border: '1.5px solid #f1f5f9',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                            borderRadius: '20px',
                            color: '#0f172a'
                        }} onClick={() => onNavigate('inventory')}>
                            <Store size={22} style={{ marginRight: '8px', color: '#64748b' }} />
                            <span style={{ fontSize: '15px', fontWeight: 800 }}>Katalog</span>
                        </button>
                    )}
                </div>
            </div>

            {/* ── Recent Transactions ── */}
            <div className="section-card fade-in" style={{ animationDelay: '0.4s', border: 'none', boxShadow: 'none', background: 'transparent', padding: '32px 0 0' }}>
                <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>TRANSAKSI TERAKHIR</span>
                    {todaySales.length > 0 && (
                        <button className="text-btn" style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>LIHAT SEMUA</button>
                    )}
                </div>

                <div className="transaction-list-container" style={{
                    background: 'white',
                    borderRadius: '24px',
                    padding: '8px',
                    marginTop: '12px',
                    border: '1px solid #f3f4f6'
                }}>
                    {todaySales.length === 0 ? (
                        <div className="empty-state-small" style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
                            <ShoppingBag size={32} style={{ marginBottom: '12px', opacity: 0.3 }} />
                            <p style={{ fontWeight: 600 }}>Belum ada transaksi hari ini</p>
                            <p style={{ fontSize: '12px', marginTop: '4px' }}>Buka Kasir untuk melayani pesanan</p>
                        </div>
                    ) : (
                        <div className="transaction-list" style={{ display: 'flex', flexDirection: 'column' }}>
                            {[...todaySales].reverse().slice(0, 5).map((sale, idx) => (
                                <div
                                    key={sale.id}
                                    className="inv-card"
                                    onClick={() => setSelectedSale(sale)}
                                    style={{
                                        cursor: 'pointer',
                                        border: 'none',
                                        borderBottom: idx === Math.min(todaySales.length, 5) - 1 ? 'none' : '1px solid #f3f4f6',
                                        padding: '16px'
                                    }}
                                >
                                    <div className="inv-card-left">
                                        <div className="inv-emoji" style={{ borderRadius: '12px', background: '#fef3c7', color: '#d97706' }}>
                                            <Calendar size={18} />
                                        </div>
                                        <div className="inv-info">
                                            <div className="inv-name" style={{ fontSize: '14px', fontWeight: 700 }}>{sale.items.length} item pesanan</div>
                                            <div className="inv-sku" style={{ marginTop: '2px' }}>{formatTime(sale.createdAt)} · {sale.paymentMethod || 'Cash'}</div>
                                        </div>
                                    </div>
                                    <div className="inv-card-right">
                                        <div className="inv-price-tag" style={{ fontSize: '16px' }}>{formatRupiah(sale.totalRevenue)}</div>
                                        <ChevronRight size={14} className="muted-text" style={{ marginLeft: '4px' }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {selectedSale && (
                <TransactionDetailModal
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                    onDelete={(id) => cancelSale(id)}
                />
            )}

            {/* Logout Confirm Modal */}
            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-card" style={{ padding: '32px 24px', textAlign: 'center' }}>
                        <div style={{ background: '#fee2e2', color: '#ef4444', width: '56px', height: '56px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <LogOut size={28} />
                        </div>
                        <h3 className="modal-title" style={{ marginBottom: '10px', fontSize: '20px', fontWeight: 900 }}>Keluar Sesi Kasir?</h3>
                        <p className="modal-body" style={{ color: '#64748b', marginBottom: '32px', fontSize: '14px', lineHeight: '1.6' }}>Sesi kerja hari ini akan berakhir. Anda harus masuk kembali dengan PIN untuk melayani pelanggan.</p>
                        <div className="modal-actions" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="btn-primary" style={{ background: '#ef4444', height: '52px', border: 'none', borderRadius: '16px' }} onClick={handleLogout}>Ya, Keluar Akun</button>
                            <button className="btn-secondary" style={{ height: '52px', border: 'none', borderRadius: '16px' }} onClick={() => setShowLogoutConfirm(false)}>Lanjutkan Kerja</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
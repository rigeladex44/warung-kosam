'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ShoppingBag, Plus, TrendingUp, Store, ClipboardList } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import type { TabName } from './BottomNav';
import StoreSettingsModal from './StoreSettingsModal';
import { fetchStoreName } from '@/lib/pin-manager';
import { getActiveUser, clearActiveUser } from '@/lib/users';
import { User, LogOut } from 'lucide-react';
import TransactionDetailModal from './TransactionDetailModal';
import { APP_CONFIG } from '@/lib/config';
import type { Sale } from '@/lib/store';

interface DashboardProps {
    onNavigate: (tab: TabName) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const [mounted, setMounted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [storeName, setStoreName] = useState(APP_CONFIG.storeName);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    useEffect(() => {
        setMounted(true);
        fetchStoreName().then(setStoreName);
    }, []);

    const handleLogout = () => {
        clearActiveUser();
        sessionStorage.removeItem('toko_pin_verified');
        window.location.href = '/';
    };

    const activeUser = mounted ? getActiveUser() : null;

    const getTodaySales = useStore((s) => s.getTodaySales);
    const getTodayExpenses = useStore((s) => s.getTodayExpenses);
    const cancelSale = useStore((s) => s.cancelSale);

    const todaySales = mounted ? getTodaySales() : [];
    const todayExpenses = mounted ? getTodayExpenses() : [];

    const totalRevenue = todaySales.reduce((sum, s) => sum + s.totalRevenue, 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const transactionCount = todaySales.length;
    const isProfit = netProfit >= 0;

    const today = new Date();
    const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="page-container">

            {/* ── Header ── */}
            <div className="dash-header" style={{ alignItems: 'flex-start', display: 'flex', gap: '16px' }}>
                {APP_CONFIG.logo && (
                    <img src={APP_CONFIG.logo} alt="Logo" style={{ width: 70, height: 70, borderRadius: '6px', objectFit: 'contain' }} />
                )}
                <div>
                    <h1 className="dash-date">{dateStr}</h1>
                    <div style={{ display: 'flex', gap: '12px', marginTop: 8 }}>
                        <button
                            className="store-badge store-badge-btn"
                            onClick={() => setShowSettings(true)}
                            title="Pengaturan Toko"
                        >
                            <Store size={12} />
                            <span>{storeName}</span>
                        </button>
                        {activeUser && (
                            <button className="store-badge store-badge-btn" style={{ background: '#fef3c7', color: '#d97706', borderColor: '#fcd34d' }} onClick={() => setShowLogoutConfirm(true)}>
                                <User size={12} />
                                <span>{activeUser.name}</span>
                                <LogOut size={12} style={{ marginLeft: 4 }} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {showSettings && (
                <StoreSettingsModal
                    onClose={() => setShowSettings(false)}
                    onNameChange={setStoreName}
                />
            )}

            {/* ── BENTO STAT CARDS ── */}
            <div className="bento-grid">

                {/* Hero Card — Total Penjualan */}
                <div className="bento-hero">
                    <div className="bento-blob blob-1" />
                    <div className="bento-blob blob-2" />

                    <div className="bento-hero-top">
                        <span className="bento-label">Total Penjualan Hari Ini</span>
                        <span className="bento-arrow-pill">
                            <ArrowUpRight size={14} />
                            Live
                        </span>
                    </div>
                    <div className="bento-hero-value">{formatRupiah(totalRevenue)}</div>
                    <div className="bento-hero-sub">{transactionCount} transaksi berhasil tercatat</div>

                    {/* mini bar viz */}
                    <div className="bento-bars">
                        {Array.from({ length: 7 }, (_, i) => (
                            <div
                                key={i}
                                className="bento-bar"
                                style={{ height: `${20 + Math.sin(i * 1.2 + totalRevenue) * 14 + (i === 6 && totalRevenue > 0 ? 20 : 0)}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Mini Card — Laba Bersih (Tema Dark Premium) */}
                <div className="bento-mini" style={{ background: '#1c1c1e', border: '1px solid #333' }}>
                    <div className="bento-mini-icon" style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' }}>
                        <TrendingUp size={16} />
                    </div>
                    <div className="bento-mini-body">
                        <div className="bento-mini-label" style={{ color: '#9ca3af' }}>Saldo Bersih</div>
                        <div className="bento-mini-value" style={{ color: 'white' }}>{formatRupiah(netProfit)}</div>
                        <div className="bento-mini-tag" style={{ background: isProfit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: isProfit ? '#34d399' : '#f87171' }}>
                            {isProfit ? 'Surplus' : 'Defisit'}
                        </div>
                    </div>
                </div>

                {/* Mini Card — Transaksi (Tema Light Amber) */}
                <div className="bento-mini" style={{ background: '#fffbeb', border: '1.5px solid #fde68a' }}>
                    <div className="bento-mini-icon" style={{ background: '#fef3c7', color: '#d97706' }}>
                        <ShoppingBag size={16} />
                    </div>
                    <div className="bento-mini-body">
                        <div className="bento-mini-label" style={{ color: '#d97706' }}>Transaksi</div>
                        <div className="bento-mini-value bento-mini-count" style={{ color: '#92400e' }}>{transactionCount}</div>
                        <div className="bento-mini-tag" style={{ background: '#fef3c7', color: '#d97706' }}>hari ini</div>
                    </div>
                </div>

            </div>

            {/* ── Quick Actions ── */}
            <div className="section-card">
                <h2 className="section-title">Aksi Cepat</h2>
                <div className="quick-actions-grid">
                    <button className="quick-action-btn primary" onClick={() => onNavigate('pos')}>
                        <Plus size={20} />
                        <span>Transaksi Baru</span>
                    </button>
                    {/* Mengubah tombol biru menjadi tombol gelap bernuansa Kopi */}
                    <button className="quick-action-btn" style={{ background: '#1c1c1e', color: '#f59e0b', border: '1px solid #333' }} onClick={() => onNavigate('inventory')}>
                        <Store size={20} />
                        <span>Inventaris Menu</span>
                    </button>
                </div>
            </div>


            {/* ── Recent Transactions ── */}
            <div className="section-card">
                <h2 className="section-title">Transaksi Terakhir</h2>
                {todaySales.length === 0 ? (
                    <div className="empty-state-small">
                        <ClipboardList size={20} className="empty-icon-muted" />
                        <p>Belum ada transaksi hari ini</p>
                    </div>
                ) : (
                    <div className="list-items">
                        {[...todaySales].reverse().slice(0, 5).map((sale) => (
                            <div key={sale.id} className="list-item-row" onClick={() => setSelectedSale(sale)} style={{ cursor: 'pointer' }}>
                                <div className="list-item-info">
                                    <span className="list-item-name">{sale.items.length} item terjual</span>
                                    <span className="list-item-sub">{formatTime(sale.createdAt)} · {sale.paymentMethod || 'Cash'} · {sale.staffName || 'Kasir'}</span>
                                </div>
                                <div className="text-right">
                                    <div className="amount-text">{formatRupiah(sale.totalRevenue)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Logout Confirm Modal ── */}
            {showLogoutConfirm && (
                <div className="modal-overlay" onClick={() => setShowLogoutConfirm(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Keluar Sesi</h3>
                        <p className="modal-body">Anda yakin ingin keluar (logout) dan mengganti kasir?</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setShowLogoutConfirm(false)}>Batal</button>
                            <button className="btn-primary" onClick={handleLogout}>Ya, Keluar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Transaction Detail Modal ── */}
            {selectedSale && (
                <TransactionDetailModal
                    sale={selectedSale}
                    onClose={() => setSelectedSale(null)}
                    onDelete={cancelSale}
                />
            )}

        </div>
    );
}
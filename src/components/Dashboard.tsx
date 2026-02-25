'use client';

import { useState, useEffect } from 'react';
import { ArrowUpRight, ShoppingBag, AlertTriangle, Plus, PackagePlus, TrendingUp, Store, CheckCircle, ClipboardList } from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import type { TabName } from './BottomNav';
import StoreSettingsModal from './StoreSettingsModal';
import { fetchStoreName } from '@/lib/pin-manager';

interface DashboardProps {
    onNavigate: (tab: TabName) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
    const [mounted, setMounted] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [storeName, setStoreName] = useState('Toko Mbak Atria');

    useEffect(() => {
        setMounted(true);
        fetchStoreName().then(setStoreName);
    }, []);

    const getTodaySales = useStore((s) => s.getTodaySales);
    const getTodayExpenses = useStore((s) => s.getTodayExpenses);
    const getLowStockProducts = useStore((s) => s.getLowStockProducts);

    const todaySales = mounted ? getTodaySales() : [];
    const todayExpenses = mounted ? getTodayExpenses() : [];
    const lowStockProducts = mounted ? getLowStockProducts() : [];

    const grossRevenue = todaySales.reduce((sum, s) => sum + s.grossRevenue, 0);
    const cogs = todaySales.reduce((sum, s) => sum + s.cogs, 0);
    const totalExpenses = todayExpenses.reduce((sum, e) => sum + e.amount, 0);
    const netProfit = grossRevenue - cogs - totalExpenses;
    const transactionCount = todaySales.length;
    const isProfit = netProfit >= 0;

    const today = new Date();
    const dayStr = today.toLocaleDateString('id-ID', { weekday: 'long' });
    const dateStr = today.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

    return (
        <div className="page-container">

            {/* ── Header ── */}
            <div className="dash-header">
                <div>
                    <p className="dash-day">{dayStr}</p>
                    <h1 className="dash-date">{dateStr}</h1>
                </div>
                <button
                    className="store-badge store-badge-btn"
                    onClick={() => setShowSettings(true)}
                    title="Pengaturan Toko"
                >
                    <Store size={14} />
                    <span>{storeName.toUpperCase()}</span>
                </button>
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
                    {/* decorative blobs */}
                    <div className="bento-blob blob-1" />
                    <div className="bento-blob blob-2" />

                    <div className="bento-hero-top">
                        <span className="bento-label">Total Penjualan Hari Ini</span>
                        <span className="bento-arrow-pill">
                            <ArrowUpRight size={14} />
                            Live
                        </span>
                    </div>
                    <div className="bento-hero-value">{formatRupiah(grossRevenue)}</div>
                    <div className="bento-hero-sub">{transactionCount} transaksi berhasil tercatat</div>

                    {/* mini bar viz */}
                    <div className="bento-bars">
                        {Array.from({ length: 7 }, (_, i) => (
                            <div
                                key={i}
                                className="bento-bar"
                                style={{ height: `${20 + Math.sin(i * 1.2 + grossRevenue) * 14 + (i === 6 && grossRevenue > 0 ? 20 : 0)}%` }}
                            />
                        ))}
                    </div>
                </div>

                {/* Mini Card — Laba Bersih */}
                <div className={`bento-mini ${isProfit ? 'bento-mini-blue' : 'bento-mini-red'}`}>
                    <div className="bento-mini-icon">
                        <TrendingUp size={16} />
                    </div>
                    <div className="bento-mini-body">
                        <div className="bento-mini-label">Laba Bersih</div>
                        <div className="bento-mini-value">{formatRupiah(netProfit)}</div>
                        <div className={`bento-mini-tag ${isProfit ? 'tag-profit' : 'tag-loss'}`}>
                            {isProfit ? 'Profit' : 'Rugi'}
                        </div>
                    </div>
                </div>

                {/* Mini Card — Transaksi */}
                <div className="bento-mini bento-mini-purple">
                    <div className="bento-mini-icon">
                        <ShoppingBag size={16} />
                    </div>
                    <div className="bento-mini-body">
                        <div className="bento-mini-label">Transaksi</div>
                        <div className="bento-mini-value bento-mini-count">{transactionCount}</div>
                        <div className="bento-mini-tag tag-neutral">hari ini</div>
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
                    <button className="quick-action-btn secondary" onClick={() => onNavigate('inventory')}>
                        <PackagePlus size={20} />
                        <span>Tambah Stok</span>
                    </button>
                </div>
            </div>

            {/* ── Low Stock Alerts ── */}
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        <AlertTriangle size={16} className="section-title-icon-amber" />
                        Stok Menipis
                    </h2>
                    <span className="badge-count">{lowStockProducts.length}</span>
                </div>
                {lowStockProducts.length === 0 ? (
                    <div className="empty-state-small">
                        <CheckCircle size={20} className="empty-icon-ok" />
                        <p>Semua stok aman</p>
                    </div>
                ) : (
                    <div className="list-items">
                        {lowStockProducts.map((product) => (
                            <div key={product.id} className="list-item-row">
                                <div className="list-item-info">
                                    <span className="list-item-name">{product.name}</span>
                                    <span className="list-item-sub">{product.category}</span>
                                </div>
                                <span className={`stock-badge ${product.stock === 0 ? 'out' : 'low'}`}>
                                    {product.stock === 0 ? 'Habis' : `${product.stock} sisa`}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
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
                            <div key={sale.id} className="list-item-row">
                                <div className="list-item-info">
                                    <span className="list-item-name">{sale.items.length} item terjual</span>
                                    <span className="list-item-sub">{formatTime(sale.createdAt)}</span>
                                </div>
                                <div className="text-right">
                                    <div className="amount-text">{formatRupiah(sale.grossRevenue)}</div>
                                    <div className="profit-text">+{formatRupiah(sale.grossProfit)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
}

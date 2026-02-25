'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp, TrendingDown, Plus, Trash2,
    ChevronLeft, ChevronRight, X, ArrowUpRight, ArrowDownRight,
    Wallet, ShoppingBag,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatTime, getMonthName } from '@/lib/utils';

type FinanceView = 'overview' | 'add-expense';

export default function Finance() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const getTodaySales = useStore((s) => s.getTodaySales);
    const getTodayExpenses = useStore((s) => s.getTodayExpenses);
    const getMonthSales = useStore((s) => s.getMonthSales);
    const getMonthExpenses = useStore((s) => s.getMonthExpenses);
    const addExpense = useStore((s) => s.addExpense);
    const deleteExpense = useStore((s) => s.deleteExpense);

    const [view, setView] = useState<FinanceView>('overview');
    const [period, setPeriod] = useState<'daily' | 'monthly'>('daily');
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Operasional' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());

    const todaySales = mounted ? getTodaySales() : [];
    const todayExpenses = mounted ? getTodayExpenses() : [];
    const monthSales = mounted ? getMonthSales(viewYear, viewMonth) : [];
    const monthExpenses = mounted ? getMonthExpenses(viewYear, viewMonth) : [];

    const computeMetrics = (sales: typeof todaySales, expenses: typeof todayExpenses) => {
        const grossRevenue = sales.reduce((s, sale) => s + sale.grossRevenue, 0);
        const cogs = sales.reduce((s, sale) => s + sale.cogs, 0);
        const opex = expenses.reduce((s, e) => s + e.amount, 0);
        const grossProfit = grossRevenue - cogs;
        const netProfit = grossProfit - opex;
        return { grossRevenue, cogs, opex, grossProfit, netProfit, transactionCount: sales.length };
    };

    const dailyMetrics = computeMetrics(todaySales, todayExpenses);
    const monthlyMetrics = computeMetrics(monthSales, monthExpenses);
    const metrics = period === 'daily' ? dailyMetrics : monthlyMetrics;
    const expenses = period === 'daily' ? todayExpenses : monthExpenses;
    const sales = period === 'daily' ? todaySales : monthSales;

    const grossMargin = metrics.grossRevenue > 0
        ? ((metrics.grossProfit / metrics.grossRevenue) * 100).toFixed(1)
        : '0.0';
    const netMargin = metrics.grossRevenue > 0
        ? ((metrics.netProfit / metrics.grossRevenue) * 100).toFixed(1)
        : '0.0';

    const isProfit = metrics.netProfit >= 0;

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
        else setViewMonth((m) => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
        else setViewMonth((m) => m + 1);
    };

    const handleAddExpense = () => {
        if (!expenseForm.description || !expenseForm.amount) return;
        addExpense({
            description: expenseForm.description,
            amount: parseFloat(expenseForm.amount),
            category: expenseForm.category,
        });
        setExpenseForm({ description: '', amount: '', category: 'Operasional' });
        setView('overview');
    };

    const EXPENSE_CATEGORIES = ['Operasional', 'Listrik & Air', 'Sewa', 'Gaji', 'Transportasi', 'Lainnya'];

    // ─── Add Expense View ────────────────────────────────────────────────────────
    if (view === 'add-expense') {
        return (
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => setView('overview')}><X size={20} /></button>
                    <h1 className="page-title">Tambah Pengeluaran</h1>
                </div>
                <div className="form-card">
                    <div className="form-group">
                        <label className="form-label">Keterangan</label>
                        <input className="form-input" placeholder="Contoh: Bayar listrik"
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kategori</label>
                        <div className="expense-category-grid">
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <button key={cat}
                                    className={`category-chip ${expenseForm.category === cat ? 'active' : ''}`}
                                    onClick={() => setExpenseForm((f) => ({ ...f, category: cat }))}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Jumlah (Rp)</label>
                        <input className="form-input" type="number" placeholder="0"
                            value={expenseForm.amount} inputMode="numeric"
                            onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} />
                    </div>
                    <button className="btn-primary full-width"
                        disabled={!expenseForm.description || !expenseForm.amount}
                        onClick={handleAddExpense}>
                        Simpan Pengeluaran
                    </button>
                </div>
            </div>
        );
    }

    // ─── Finance Overview ────────────────────────────────────────────────────────
    return (
        <div className="page-container">

            {/* ── Header ── */}
            <div className="page-header">
                <h1 className="page-title">Keuangan</h1>
                <button className="btn-icon-primary" onClick={() => setView('add-expense')}>
                    <Plus size={18} />
                </button>
            </div>

            {/* ── Period Toggle ── */}
            <div className="period-toggle">
                <button className={`period-btn ${period === 'daily' ? 'active' : ''}`} onClick={() => setPeriod('daily')}>Hari Ini</button>
                <button className={`period-btn ${period === 'monthly' ? 'active' : ''}`} onClick={() => setPeriod('monthly')}>Bulanan</button>
            </div>

            {/* ── Month Selector ── */}
            {period === 'monthly' && (
                <div className="month-nav">
                    <button className="month-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
                    <span className="month-label">{getMonthName(viewMonth)} {viewYear}</span>
                    <button className="month-nav-btn" onClick={nextMonth}
                        disabled={viewYear === now.getFullYear() && viewMonth === now.getMonth()}>
                        <ChevronRight size={18} />
                    </button>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════
                FINANCE BENTO — Net Profit hero + P&L breakdown strip
            ══════════════════════════════════════════════════════ */}

            {/* Hero: Laba Bersih */}
            <div className={`fin-hero ${isProfit ? 'fin-hero-profit' : 'fin-hero-loss'}`}>
                <div className="fin-hero-blob" />
                <div className="fin-hero-top">
                    <span className="fin-hero-eyebrow">
                        {isProfit ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                        {isProfit ? 'Profitable' : 'Rugi'}
                    </span>
                    <span className="fin-hero-tag">{period === 'daily' ? 'Hari ini' : `${getMonthName(viewMonth)}`}</span>
                </div>
                <div className="fin-hero-label">Laba Bersih</div>
                <div className="fin-hero-value">{formatRupiah(metrics.netProfit)}</div>
                <div className="fin-hero-margins">
                    <div className="fin-margin-pill">
                        <span>Gross Margin</span>
                        <strong>{grossMargin}%</strong>
                    </div>
                    <div className="fin-margin-divider" />
                    <div className="fin-margin-pill">
                        <span>Net Margin</span>
                        <strong>{netMargin}%</strong>
                    </div>
                </div>
            </div>

            {/* P&L Breakdown strip */}
            <div className="fin-pl-strip">
                {/* Omzet */}
                <div className="fin-pl-row fin-pl-omzet">
                    <div className="fin-pl-row-left">
                        <div className="fin-pl-dot dot-green" />
                        <div>
                            <div className="fin-pl-name">Omzet Kotor</div>
                            <div className="fin-pl-sub">{metrics.transactionCount} transaksi</div>
                        </div>
                    </div>
                    <div className="fin-pl-amount text-green">{formatRupiah(metrics.grossRevenue)}</div>
                </div>

                {/* HPP */}
                <div className="fin-pl-row">
                    <div className="fin-pl-row-left">
                        <div className="fin-pl-dot dot-orange" />
                        <div>
                            <div className="fin-pl-name">HPP / COGS</div>
                            <div className="fin-pl-sub">Harga pokok penjualan</div>
                        </div>
                    </div>
                    <div className="fin-pl-amount text-orange">− {formatRupiah(metrics.cogs)}</div>
                </div>

                {/* Divider gross */}
                <div className="fin-pl-divider">
                    <span>Laba Kotor</span>
                    <span className="fin-pl-divider-val">{formatRupiah(metrics.grossProfit)}</span>
                </div>

                {/* Opex */}
                <div className="fin-pl-row">
                    <div className="fin-pl-row-left">
                        <div className="fin-pl-dot dot-red" />
                        <div>
                            <div className="fin-pl-name">Pengeluaran Operasional</div>
                            <div className="fin-pl-sub">{expenses.length} item tercatat</div>
                        </div>
                    </div>
                    <div className="fin-pl-amount text-red">− {formatRupiah(metrics.opex)}</div>
                </div>
            </div>

            {/* ── Expenses List ── */}
            <div className="section-card">
                <div className="section-header">
                    <h2 className="section-title">
                        <TrendingDown size={16} className="section-title-icon-red" />
                        Pengeluaran Operasional
                    </h2>
                    <button className="btn-icon-primary small" onClick={() => setView('add-expense')}>
                        <Plus size={14} />
                    </button>
                </div>
                {expenses.length === 0 ? (
                    <div className="empty-state-small"><Wallet size={18} className="empty-icon-muted" /><p>Belum ada pengeluaran tercatat</p></div>
                ) : (
                    <div className="list-items">
                        {expenses.map((expense) => (
                            <div key={expense.id} className="list-item-row">
                                <div className="list-item-info">
                                    <span className="list-item-name">{expense.description}</span>
                                    <span className="list-item-sub">{expense.category} · {formatTime(expense.createdAt)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="amount-text-red">{formatRupiah(expense.amount)}</span>
                                    <button className="text-btn-red" onClick={() => setDeleteConfirm(expense.id)}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Sales Breakdown ── */}
            <div className="section-card">
                <h2 className="section-title">
                    <TrendingUp size={16} className="section-title-icon-green" />
                    Riwayat Penjualan
                </h2>
                {sales.length === 0 ? (
                    <div className="empty-state-small"><ShoppingBag size={18} className="empty-icon-muted" /><p>Belum ada penjualan</p></div>
                ) : (
                    <div className="list-items">
                        {[...sales].reverse().slice(0, 10).map((sale) => (
                            <div key={sale.id} className="list-item-row">
                                <div className="list-item-info">
                                    <span className="list-item-name">{sale.items.length} produk dijual</span>
                                    <span className="list-item-sub">HPP: {formatRupiah(sale.cogs)} · {formatTime(sale.createdAt)}</span>
                                </div>
                                <div>
                                    <div className="amount-text">{formatRupiah(sale.grossRevenue)}</div>
                                    <div className="profit-text">+{formatRupiah(sale.grossProfit)}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ── Delete Confirm Modal ── */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Hapus Pengeluaran?</h3>
                        <p className="modal-body">Data ini akan dihapus permanen.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            <button className="btn-danger" onClick={() => { deleteExpense(deleteConfirm); setDeleteConfirm(null); }}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

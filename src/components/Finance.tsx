'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Plus, Trash2,
    X, ArrowUpRight, ArrowDownRight,
    Wallet, ShoppingBag, Receipt, Calendar,
    PieChart, DollarSign, Download, Filter, Printer
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/config';

// Helper to check if date is within range
const isWithinRange = (dateStr: string, start: string, end: string) => {
    const d = new Date(dateStr).getTime();
    const s = new Date(start).setHours(0, 0, 0, 0);
    const e = new Date(end).setHours(23, 59, 59, 999);
    return d >= s && d <= e;
};

// Helper for today's date in YYYY-MM-DD
const getTodayStr = () => new Date().toISOString().split('T')[0];

type FinanceView = 'overview' | 'add-expense';

export default function Finance() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const sales = useStore((s) => s.sales);
    const expenses = useStore((s) => s.expenses);
    const addExpense = useStore((s) => s.addExpense);
    const deleteExpense = useStore((s) => s.deleteExpense);

    // Filters state
    const [startDate, setStartDate] = useState(getTodayStr());
    const [endDate, setEndDate] = useState(getTodayStr());
    const [showFilters, setShowFilters] = useState(false);

    // Filter results based on range
    const filteredSales = useMemo(() => 
        sales.filter(s => isWithinRange(s.createdAt, startDate, endDate)), 
        [sales, startDate, endDate]
    );
    const filteredExpenses = useMemo(() => 
        expenses.filter(e => isWithinRange(e.createdAt, startDate, endDate)), 
        [expenses, startDate, endDate]
    );

    const [view, setView] = useState<FinanceView>('overview');
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Operasional' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const totalRevenue = useMemo(() => filteredSales.reduce((sum, sale) => sum + sale.totalRevenue, 0), [filteredSales]);
    const totalCashRevenue = useMemo(() => 
        filteredSales.filter(s => !s.paymentMethod || s.paymentMethod === 'Cash')
                     .reduce((sum, s) => sum + s.totalRevenue, 0), 
        [filteredSales]
    );
    const totalDigitalRevenue = useMemo(() => 
        filteredSales.filter(s => s.paymentMethod && s.paymentMethod !== 'Cash')
                     .reduce((sum, s) => sum + s.totalRevenue, 0), 
        [filteredSales]
    );

    const totalExp = useMemo(() => filteredExpenses.reduce((sum, e) => sum + e.amount, 0), [filteredExpenses]);
    const netProfit = totalRevenue - totalExp;
    const isProfit = netProfit >= 0;

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

    const EXPENSE_CATEGORIES = ['Operasional', 'Bahan Baku', 'Gaji Staff', 'Lainnya'];

    if (view === 'add-expense') {
        return (
            <div className="page-container fade-in">
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button className="back-btn" onClick={() => setView('overview')} style={{ background: '#f8fafc', padding: '10px', borderRadius: '14px' }}>
                        <X size={20} />
                    </button>
                    <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 900 }}>Catat Pengeluaran</h1>
                </div>

                <div className="form-card" style={{ 
                    background: 'white', 
                    borderRadius: '28px', 
                    padding: '32px 24px', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f5f9'
                }}>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>KETERANGAN</label>
                        <input className="form-input" placeholder="Misal: Beli Kopi 2kg"
                            style={{ paddingLeft: '16px', borderRadius: '18px', background: '#f8fafc', border: '1.5px solid #f1f5f9', height: '52px' }}
                            value={expenseForm.description}
                            onChange={(e) => setExpenseForm((f) => ({ ...f, description: e.target.value }))} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>KATEGORI PENGELUARAN</label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                            {EXPENSE_CATEGORIES.map((cat) => (
                                <button key={cat}
                                    style={{ 
                                        padding: '12px', 
                                        borderRadius: '16px', 
                                        fontSize: '13px', 
                                        fontWeight: 800,
                                        border: expenseForm.category === cat ? '2px solid #ef4444' : '1.5px solid #f1f5f9',
                                        background: expenseForm.category === cat ? '#fef2f2' : 'white', 
                                        color: expenseForm.category === cat ? '#ef4444' : '#64748b',
                                        transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => setExpenseForm((f) => ({ ...f, category: cat }))}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '13px', color: '#94a3b8', marginLeft: '4px' }}>JUMLAH PENGELUARAN (RP)</label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: 800, color: '#ef4444' }}>Rp</div>
                            <input className="form-input" type="number" placeholder="0"
                                style={{ paddingLeft: '44px', borderRadius: '18px', background: '#f8fafc', border: '1.5px solid #f1f5f9', height: '56px', fontWeight: 900, fontSize: '18px' }}
                                value={expenseForm.amount} inputMode="numeric"
                                onChange={(e) => setExpenseForm((f) => ({ ...f, amount: e.target.value }))} />
                        </div>
                    </div>

                    <button className="btn-primary full-width" style={{ height: '60px', borderRadius: '20px', background: '#0f172a', color: 'white', border: 'none', fontSize: '16px', fontWeight: 900, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.25)' }}
                        disabled={!expenseForm.description || !expenseForm.amount}
                        onClick={handleAddExpense}>
                        <Receipt size={20} style={{ marginRight: '8px' }} /> Simpan Pengeluaran
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            {/* Main UI (Hidden on Print) */}
            <div className="finance-ui-content">
                <style>{`
                    @media print {
                        .finance-ui-content, .bottom-nav, .demo-reset-btn { display: none !important; }
                    }
                `}</style>
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 900 }}>Laporan Keuangan</h1>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn-icon-secondary" onClick={() => setShowFilters(!showFilters)} style={{ background: 'white', width: '44px', height: '44px', borderRadius: '14px', border: '1.5px solid #f1f5f9' }}>
                            <Filter size={20} color={showFilters ? '#f59e0b' : '#64748b'} />
                        </button>
                        <button className="btn-icon-primary" onClick={() => setView('add-expense')} style={{ background: '#0f172a', color: 'white', width: '44px', height: '44px', borderRadius: '14px' }}>
                            <Plus size={22} />
                        </button>
                    </div>
                </div>

                {/* Date Filters Panel */}
                {showFilters && (
                    <div className="fade-in" style={{ 
                        background: 'white', padding: '20px', borderRadius: '24px', marginBottom: '24px', 
                        border: '1.5px solid #f1f5f9', boxShadow: '0 8px 20px rgba(0,0,0,0.03)' 
                    }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>DARI TANGGAL</label>
                                <input type="date" className="form-input" value={startDate} onChange={e => setStartDate(e.target.value)} 
                                    style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '13px' }} />
                            </div>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', marginBottom: '6px', display: 'block' }}>SAMPAI TANGGAL</label>
                                <input type="date" className="form-input" value={endDate} onChange={e => setEndDate(e.target.value)}
                                    style={{ background: '#f8fafc', borderRadius: '12px', border: '1px solid #f1f5f9', fontSize: '13px' }} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Premium P&L Hero */}
                <div style={{ 
                    background: isProfit ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
                    padding: '32px 24px',
                    borderRadius: '32px',
                    color: 'white',
                    marginBottom: '24px',
                    boxShadow: isProfit ? '0 15px 35px rgba(16, 185, 129, 0.2)' : '0 15px 35px rgba(239, 68, 68, 0.2)',
                    position: 'relative',
                    overflow: 'hidden'
                }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', width: 'fit-content', padding: '6px 14px', borderRadius: '12px', fontSize: '11px', fontWeight: 800, marginBottom: '16px', letterSpacing: '0.05em' }}>
                            <Calendar size={14} />
                            {startDate === endDate ? 'LAPORAN HARI INI' : 'LAPORAN PERIODE'}
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.8, fontWeight: 700, marginBottom: '4px' }}>Saldo Bersih (Laba)</div>
                        <div style={{ fontSize: '36px', fontWeight: 950, letterSpacing: '-1.5px' }}>{formatRupiah(netProfit)}</div>
                    </div>
                    <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                        <PieChart size={160} />
                    </div>
                </div>

                {/* Metrics Row (Updated with split) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#10b981', background: '#ecfdf5', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <DollarSign size={20} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>OMZET TUNAI</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(totalCashRevenue)}</div>
                    </div>
                    <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                        <div style={{ color: '#f59e0b', background: '#fffbeb', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                            <PieChart size={20} />
                        </div>
                        <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>OMZET QRIS/DIR</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(totalDigitalRevenue)}</div>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ background: '#f8fafc', padding: '16px 20px', borderRadius: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #f1f5f9' }}>
                        <div>
                            <div style={{ fontSize: '10px', color: '#94a3b8', fontWeight: 800 }}>TOTAL PENGELUARAN</div>
                            <div style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444' }}>- {formatRupiah(totalExp)}</div>
                        </div>
                        <div style={{ color: '#ef4444', background: '#fef2f2', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowDownRight size={20} />
                        </div>
                    </div>
                </div>

                {/* Action: Export Report */}
                <button className="btn-secondary" onClick={() => window.print()} style={{ 
                    width: '100%', height: '56px', borderRadius: '18px', marginBottom: '32px', border: '1.5px solid #0f172a', 
                    background: 'white', color: '#0f172a', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' 
                }}>
                    <Download size={20} /> Ekspor Laporan Lengkap (PDF)
                </button>

                {/* Lists Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                    
                    {/* Section: Expenses */}
                    <div className="fade-in">
                        <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>RINCIAN PENGELUARAN</h2>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '10px', border: '1px solid #f1f5f9' }}>
                            {filteredExpenses.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.3 }}>
                                    <Receipt size={32} style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Tidak ada data pengeluaran</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {filteredExpenses.map((expense, idx) => (
                                        <div key={expense.id} className="inv-card" style={{ border: 'none', borderBottom: idx === filteredExpenses.length - 1 ? 'none' : '1px solid #f8fafc', padding: '14px' }}>
                                            <div className="inv-card-left">
                                                <div className="inv-emoji" style={{ background: '#fef2f2', color: '#ef4444', height: '40px', width: '40px', borderRadius: '12px' }}>
                                                    <Wallet size={18} />
                                                </div>
                                                <div className="inv-info">
                                                    <div className="inv-name" style={{ fontSize: '14px', fontWeight: 700 }}>{expense.description}</div>
                                                    <div className="inv-sku" style={{ marginTop: '2px' }}>{expense.category} · {new Date(expense.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="inv-card-right">
                                                <div className="inv-price-tag" style={{ color: '#ef4444', fontSize: '15px' }}>{formatRupiah(expense.amount)}</div>
                                                <button onClick={() => setDeleteConfirm(expense.id)} style={{ marginLeft: '12px', color: '#ef4444', background: 'transparent', border: 'none' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Section: Sales */}
                    <div className="fade-in">
                        <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '16px' }}>RIWAYAT PENJUALAN</h2>
                        <div style={{ background: 'white', borderRadius: '24px', padding: '10px', border: '1px solid #f1f5f9' }}>
                            {filteredSales.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.3 }}>
                                    <ShoppingBag size={32} style={{ margin: '0 auto 8px' }} />
                                    <div style={{ fontSize: '13px', fontWeight: 700 }}>Tidak ada data penjualan</div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    {[...filteredSales].reverse().map((sale, idx) => (
                                        <div key={sale.id} className="inv-card" style={{ border: 'none', borderBottom: idx === filteredSales.length - 1 ? 'none' : '1px solid #f8fafc', padding: '14px' }}>
                                            <div className="inv-card-left">
                                                <div className="inv-emoji" style={{ background: '#ecfdf5', color: '#10b981', height: '40px', width: '40px', borderRadius: '12px' }}>
                                                    <ShoppingBag size={18} />
                                                </div>
                                                <div className="inv-info">
                                                    <div className="inv-name" style={{ fontSize: '14px', fontWeight: 700 }}>{sale.items.length} Pesanan Berhasil</div>
                                                    <div className="inv-sku" style={{ marginTop: '2px' }}>{sale.paymentMethod || 'Cash'} · {new Date(sale.createdAt).toLocaleDateString()}</div>
                                                </div>
                                            </div>
                                            <div className="inv-card-right">
                                                <div className="inv-price-tag" style={{ color: '#10b981', fontSize: '15px' }}>{formatRupiah(sale.totalRevenue)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 🖨️ PRINT TEMPLATE (Purely for PDF/Print) */}
            <div className="finance-print-area">
                <style>{`
                    @media screen { .finance-print-area { display: none !important; } }
                    @media print {
                        .finance-print-area { 
                            display: block !important; 
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: white;
                            z-index: 99999;
                            padding: 40px; 
                            font-family: sans-serif; 
                            color: black; 
                        }
                        h1 { font-size: 24px; margin-bottom: 5px; }
                        .range { font-size: 14px; color: #666; margin-bottom: 30px; }
                        .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 30px; }
                        .summary-item { border: 1px solid #eee; padding: 12px; border-radius: 8px; }
                        .summary-label { font-size: 10px; font-weight: bold; color: #888; margin-bottom: 4px; }
                        .summary-val { font-size: 16px; font-weight: 800; }
                        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                        th { text-align: left; font-size: 11px; border-bottom: 2px solid #000; padding: 10px 5px; }
                        td { font-size: 11px; border-bottom: 1px solid #eee; padding: 10px 5px; }
                    }
                `}</style>
                <h1>LAPORAN KEUANGAN - {APP_CONFIG.storeName}</h1>
                <div className="range">Periode Laporan: {new Date(startDate).toLocaleDateString()} s/d {new Date(endDate).toLocaleDateString()}</div>
                
                <div className="summary-grid">
                    <div className="summary-item">
                        <div className="summary-label">OMZET TUNAI (CASH)</div>
                        <div className="summary-val">{formatRupiah(totalCashRevenue)}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">OMZET DIGITAL (QRIS)</div>
                        <div className="summary-val">{formatRupiah(totalDigitalRevenue)}</div>
                    </div>
                    <div className="summary-item">
                        <div className="summary-label">TOTAL PENGELUARAN</div>
                        <div className="summary-val" style={{ color: '#dc2626' }}>{formatRupiah(totalExp)}</div>
                    </div>
                    <div className="summary-item" style={{ background: '#f8fafc' }}>
                        <div className="summary-label">LABA BERSIH (NET PROFIT)</div>
                        <div className="summary-val" style={{ color: isProfit ? '#059669' : '#dc2626' }}>{formatRupiah(netProfit)}</div>
                    </div>
                </div>

                <h3 style={{ borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '14px' }}>Daftar Pengeluaran</h3>
                <table>
                    <thead>
                        <tr><th>Tanggal</th><th>Keterangan</th><th>Kategori</th><th>Jumlah</th></tr>
                    </thead>
                    <tbody>
                        {filteredExpenses.map(e => (
                            <tr key={e.id}>
                                <td>{new Date(e.createdAt).toLocaleDateString()}</td>
                                <td>{e.description}</td>
                                <td>{e.category}</td>
                                <td>{formatRupiah(e.amount)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <h3 style={{ marginTop: '30px', borderBottom: '1px solid #eee', paddingBottom: '8px', fontSize: '14px' }}>Ringkasan Penjualan</h3>
                <table>
                    <thead>
                        <tr><th>Tanggal</th><th>Ringkasan</th><th>Metode</th><th>Subtotal</th></tr>
                    </thead>
                    <tbody>
                        {filteredSales.map(s => (
                            <tr key={s.id}>
                                <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                <td>{s.items.length} Item Terjual</td>
                                <td>{s.paymentMethod || 'Cash'}</td>
                                <td>{formatRupiah(s.totalRevenue)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <div style={{ marginTop: '50px', textAlign: 'right', fontSize: '10px', color: '#666' }}>
                    Dicetak pada: {new Date().toLocaleString('id-ID')}
                </div>
            </div>

            {/* Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" style={{ padding: '32px 24px', background: 'white', borderRadius: '32px', maxWidth: '340px', width: '90%', margin: '0 auto', textAlign: 'center' }}>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, marginBottom: '8px' }}>Hapus Data?</h3>
                        <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '14px' }}>Tindakan ini tidak dapat dibatalkan.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="btn-primary" style={{ background: '#ef4444', color: 'white' }} onClick={() => { deleteExpense(deleteConfirm); setDeleteConfirm(null); }}>Hapus</button>
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

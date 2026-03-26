'use client';

import { useState, useEffect, useMemo } from 'react';
import {
    TrendingUp, TrendingDown, Plus, Trash2,
    X, ArrowUpRight, ArrowDownRight,
    Wallet, ShoppingBag, Receipt, Calendar,
    PieChart, DollarSign
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { formatRupiah, formatTime } from '@/lib/utils';
import { APP_CONFIG } from '@/lib/config';

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

type FinanceView = 'overview' | 'add-expense';

export default function Finance() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => { setMounted(true); }, []);

    const sales = useStore((s) => s.sales);
    const expenses = useStore((s) => s.expenses);
    const addExpense = useStore((s) => s.addExpense);
    const deleteExpense = useStore((s) => s.deleteExpense);

    const todaySales = useMemo(() => sales.filter(s => isToday(s.createdAt)), [sales]);
    const todayExpenses = useMemo(() => expenses.filter(e => isToday(e.createdAt)), [expenses]);

    const [view, setView] = useState<FinanceView>('overview');
    const [expenseForm, setExpenseForm] = useState({ description: '', amount: '', category: 'Operasional' });
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const totalRevenue = useMemo(() => todaySales.reduce((sum, sale) => sum + sale.totalRevenue, 0), [todaySales]);
    const totalExp = useMemo(() => todayExpenses.reduce((sum, e) => sum + e.amount, 0), [todayExpenses]);
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

                    <button className="btn-primary full-width" style={{ height: '60px', borderRadius: '20px', background: '#0f172a', color: 'white', border: 'none', fontSize: '16px', fontWeight: 900, boxShadow: '0 10px 25px rgba(15, 23, 42, 0.2)' }}
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
            <div className="page-header" style={{ marginBottom: '24px' }}>
                <h1 className="page-title" style={{ fontSize: '26px', fontWeight: 900 }}>Laporan Keuangan</h1>
                <button className="btn-icon-primary" onClick={() => setView('add-expense')} style={{ background: '#0f172a', color: 'white', width: '44px', height: '44px', borderRadius: '14px' }}>
                    <Plus size={22} />
                </button>
            </div>

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', width: 'fit-content', padding: '6px 14px', borderRadius: '12px', fontSize: '12px', fontWeight: 800, marginBottom: '16px' }}>
                        {isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                        {isProfit ? 'PROFIT HARI INI' : 'DEFISIT HARI INI'}
                    </div>
                    <div style={{ fontSize: '14px', opacity: 0.8, fontWeight: 700, marginBottom: '4px' }}>Saldo Bersih (Laba)</div>
                    <div style={{ fontSize: '36px', fontWeight: 950, letterSpacing: '-1.5px' }}>{formatRupiah(netProfit)}</div>
                </div>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-20px', opacity: 0.1 }}>
                    <PieChart size={160} />
                </div>
            </div>

            {/* Metrics Row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '32px' }}>
                <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ color: '#10b981', background: '#ecfdf5', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <ArrowUpRight size={20} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>PENDAPATAN</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(totalRevenue)}</div>
                </div>
                <div style={{ background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #f1f5f9', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
                    <div style={{ color: '#ef4444', background: '#fef2f2', width: '36px', height: '36px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <ArrowDownRight size={20} />
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 800, marginBottom: '4px' }}>PENGELUARAN</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: '#0f172a' }}>{formatRupiah(totalExp)}</div>
                </div>
            </div>

            {/* History Tabs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* Section: Expenses */}
                <div className="fade-in">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>DETAIL PENGELUARAN</h2>
                    </div>
                    
                    <div style={{ background: 'white', borderRadius: '24px', padding: '10px', border: '1px solid #f1f5f9' }}>
                        {todayExpenses.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.3 }}>
                                <Receipt size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>Belum ada pengeluaran</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {todayExpenses.map((expense, idx) => (
                                    <div key={expense.id} className="inv-card" style={{ border: 'none', borderBottom: idx === todayExpenses.length - 1 ? 'none' : '1px solid #f8fafc', padding: '14px' }}>
                                        <div className="inv-card-left">
                                            <div className="inv-emoji" style={{ background: '#fef2f2', color: '#ef4444', height: '40px', width: '40px', borderRadius: '12px' }}>
                                                <Wallet size={18} />
                                            </div>
                                            <div className="inv-info">
                                                <div className="inv-name" style={{ fontSize: '14px', fontWeight: 700 }}>{expense.description}</div>
                                                <div className="inv-sku" style={{ marginTop: '2px' }}>{expense.category} · {formatTime(expense.createdAt)}</div>
                                            </div>
                                        </div>
                                        <div className="inv-card-right">
                                            <div className="inv-price-tag" style={{ color: '#ef4444', fontSize: '15px' }}>{formatRupiah(expense.amount)}</div>
                                            <button 
                                                onClick={() => setDeleteConfirm(expense.id)} 
                                                style={{ marginLeft: '12px', background: '#fef2f2', color: '#ef4444', border: 'none', width: '30px', height: '30px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                            >
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
                        {todaySales.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '32px 0', opacity: 0.3 }}>
                                <ShoppingBag size={32} style={{ margin: '0 auto 8px' }} />
                                <div style={{ fontSize: '13px', fontWeight: 700 }}>Belum ada penjualan</div>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                {[...todaySales].reverse().slice(0, 10).map((sale, idx) => (
                                    <div key={sale.id} className="inv-card" style={{ border: 'none', borderBottom: idx === Math.min(todaySales.length, 10) - 1 ? 'none' : '1px solid #f8fafc', padding: '14px' }}>
                                        <div className="inv-card-left">
                                            <div className="inv-emoji" style={{ background: '#ecfdf5', color: '#10b981', height: '40px', width: '40px', borderRadius: '12px' }}>
                                                <ShoppingBag size={18} />
                                            </div>
                                            <div className="inv-info">
                                                <div className="inv-name" style={{ fontSize: '14px', fontWeight: 700 }}>{sale.items.length} Pesanan Berhasil</div>
                                                <div className="inv-sku" style={{ marginTop: '2px' }}>{sale.paymentMethod || 'Cash'} · {formatTime(sale.createdAt)}</div>
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

            {/* Premium Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" style={{ padding: '32px 24px', background: 'white', borderRadius: '32px', maxWidth: '340px', width: '90%', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ background: '#fef2f2', color: '#ef4444', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Hapus Catatan?</h3>
                        <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '14px', lineHeight: '1.5' }}>Data pengeluaran ini akan dihapus permanen dari laporan keuangan hari ini.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="btn-primary" style={{ background: '#ef4444', color: 'white', height: '52px', borderRadius: '16px' }} onClick={() => { deleteExpense(deleteConfirm); setDeleteConfirm(null); }}>Ya, Hapus Saja</button>
                            <button className="btn-secondary" style={{ height: '52px', border: 'none', borderRadius: '16px' }} onClick={() => setDeleteConfirm(null)}>Kembali</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

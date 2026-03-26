'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus, Trash2, Users, CheckCircle2,
    Edit2, X, Save, KeyRound, ShieldAlert,
    ChevronRight, Fingerprint, Lock, ShieldCheck,
    Delete
} from 'lucide-react';
import {
    getUsers, addUser, updateUser, deleteUser, getActiveUser,
    type AppUser,
} from '@/lib/users';

type KaryawanView = 'list' | 'add' | 'edit';

const SEED_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

const emptyForm = { name: '', role: 'karyawan' as AppUser['role'], pin: '', confirmPin: '', color: SEED_COLORS[1] };

export default function Karyawan() {
    const [mounted, setMounted] = useState(false);
    const [users, setUsers] = useState<AppUser[]>([]);
    const [view, setView] = useState<KaryawanView>('list');
    const [activeUser, setActiveUser] = useState<AppUser | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [editTarget, setEditTarget] = useState<AppUser | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
    const [pinError, setPinError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const refresh = () => {
        setUsers(getUsers());
        setActiveUser(getActiveUser());
    };

    useEffect(() => { 
        setMounted(true);
        refresh(); 
    }, []);

    if (!mounted) return null;

    // 🛡️ SECURITY GUARD: Owner Only
    if (activeUser?.role !== 'owner') {
        return (
            <div className="page-container fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ textAlign: 'center', padding: '40px 24px', background: 'white', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.05)', maxWidth: '340px' }}>
                    <div style={{ background: '#fef2f2', color: '#ef4444', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                        <ShieldAlert size={40} />
                    </div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#0f172a', marginBottom: '12px' }}>Akses Terbatas</h2>
                    <p style={{ color: '#64748b', fontSize: '15px', lineHeight: '1.6', marginBottom: '32px' }}>Halaman Manajemen Karyawan hanya dapat diakses oleh **Owner (Pemilik Toko)**.</p>
                    <div style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: '1px solid #f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center', color: '#64748b', fontSize: '13px', fontWeight: 700 }}>
                            <Lock size={14} /> Keamanan Terenkripsi
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ── PIN keypad handling ──────────────────────────────────────────────

    const handlePinDigit = (d: string) => {
        if (pinInput.length >= 4) return;
        const next = pinInput + d;
        setPinInput(next);
        setPinError('');

        if (next.length === 4) {
            if (pinStep === 'enter') {
                if (/^(.)\1+$/.test(next)) { setPinError('PIN terlalu mudah'); setPinInput(''); return; }
                setForm((f) => ({ ...f, pin: next }));
                setTimeout(() => { setPinInput(''); setPinStep('confirm'); }, 200);
            } else {
                if (next !== form.pin) { setPinError('PIN tidak cocok'); setPinInput(''); setPinStep('enter'); setForm(f => ({ ...f, pin: '' })); return; }
                setForm((f) => ({ ...f, confirmPin: next }));
            }
        }
    };
    
    const handlePinDel = () => { setPinInput((p) => p.slice(0, -1)); setPinError(''); };

    const resetPinForm = () => { setPinInput(''); setPinStep('enter'); setPinError(''); setForm((f) => ({ ...f, pin: '', confirmPin: '' })); };

    const handleSave = () => {
        if (!form.name.trim() || !form.pin) return;
        if (view === 'add') {
            addUser({ name: form.name.trim(), role: form.role, pin: form.pin, color: form.color });
        } else if (editTarget) {
            updateUser(editTarget.id, { name: form.name.trim(), role: form.role, pin: form.pin || editTarget.pin, color: form.color });
        }
        setForm(emptyForm);
        resetPinForm();
        setView('list');
        refresh();
    };

    const openEdit = (u: AppUser) => {
        setEditTarget(u);
        setForm({ name: u.name, role: u.role, pin: u.pin, confirmPin: u.pin, color: u.color ?? SEED_COLORS[0] });
        resetPinForm();
        setView('edit');
    };

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

    if (view === 'add' || view === 'edit') {
        const title = view === 'add' ? 'Tambah Staff' : 'Edit Profil Staff';
        const pinReady = form.pin && form.pin === form.confirmPin;
        const canSave = form.name.trim() && pinReady;

        return (
            <div className="page-container fade-in">
                <div className="page-header" style={{ marginBottom: '24px' }}>
                    <button className="back-btn" onClick={() => { setView('list'); resetPinForm(); }} style={{ background: '#f8fafc', padding: '10px', borderRadius: '14px' }}>
                        <X size={20} />
                    </button>
                    <h1 className="page-title" style={{ fontSize: '22px', fontWeight: 900 }}>{title}</h1>
                </div>

                <div className="form-card" style={{ background: 'white', borderRadius: '32px', padding: '32px 24px', border: '1px solid #f1f5f9' }}>
                    <div className="form-group" style={{ marginBottom: '24px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.05em' }}>NAMA LENGKAP</label>
                        <input className="form-input" placeholder="Masukkan nama staff..."
                            style={{ height: '56px', borderRadius: '18px', background: '#f8fafc', border: '1.5px solid #f1f5f9', paddingLeft: '20px', fontSize: '16px', fontWeight: 800 }}
                            value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))} />
                    </div>

                    <div className="form-group" style={{ marginBottom: '32px' }}>
                        <label className="form-label" style={{ fontWeight: 800, fontSize: '11px', color: '#94a3b8', letterSpacing: '0.05em', marginBottom: '12px', display: 'block' }}>AKSES PIN (4 DIGIT)</label>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '20px' }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} style={{ 
                                    width: '52px', height: '64px', borderRadius: '14px', border: '2px solid #f1f5f9', 
                                    background: pinInput.length > i ? '#0f172a' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}>
                                    {pinInput.length > i && <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'white' }} />}
                                </div>
                            ))}
                        </div>
                        {pinError && <div style={{ color: '#ef4444', textAlign: 'center', fontSize: '12px', fontWeight: 800, marginBottom: '12px' }}>{pinError}</div>}
                        <div style={{ textAlign: 'center', fontSize: '13px', fontWeight: 700, color: '#64748b' }}>
                            {pinStep === 'enter' ? 'Masukkan PIN Baru' : 'Konfirmasi PIN Sekali Lagi'}
                        </div>
                    </div>

                    {/* Numerical Keypad */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '32px' }}>
                        {digits.map((d, i) => (
                            d === null ? <div key={i} /> :
                            <button key={i} onClick={() => d === 'del' ? handlePinDel() : handlePinDigit(d.toString())}
                                style={{ 
                                    height: '60px', borderRadius: '18px', background: d === 'del' ? '#f8fafc' : 'white', border: '1.5px solid #f1f5f9', 
                                    fontSize: '20px', fontWeight: 900, color: d === 'del' ? '#ef4444' : '#0f172a',
                                    boxShadow: '0 4px 0 #f1f5f9' 
                                }}>
                                {d === 'del' ? <Delete size={20} style={{ margin: '0 auto' }} /> : d}
                            </button>
                        ))}
                    </div>

                    <button className="btn-primary full-width" style={{ height: '60px', borderRadius: '20px', background: '#0f172a', color: 'white', border: 'none', fontSize: '16px', fontWeight: 900 }}
                        disabled={!canSave} onClick={handleSave}>
                        <Save size={20} style={{ marginRight: '8px' }} /> Simpan Data Staff
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container fade-in">
            <div className="page-header" style={{ marginBottom: '32px' }}>
                <div>
                    <h1 className="page-title" style={{ fontSize: '28px', fontWeight: 950, letterSpacing: '-0.5px' }}>Team & Staff</h1>
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: 600 }}>Kelola akses karyawan Anda</p>
                </div>
                <button className="btn-icon-primary" onClick={() => { setForm(emptyForm); resetPinForm(); setView('add'); }} 
                    style={{ background: '#0f172a', color: 'white', width: '48px', height: '48px', borderRadius: '16px', boxShadow: '0 10px 20px rgba(15, 23, 42, 0.15)' }}>
                    <UserPlus size={22} />
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {users.map((u) => (
                    <div key={u.id} className="inv-card" style={{ 
                        background: 'white', padding: '20px', borderRadius: '28px', border: u.role === 'owner' ? '2px solid #f59e0b' : '1px solid #f1f5f9',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ 
                                width: '56px', height: '56px', borderRadius: '20px', background: u.color ? u.color + '15' : '#f8fafc', color: u.color || '#64748b', 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', fontWeight: 950, border: `2.5px solid ${u.color || '#f1f5f9'}`
                            }}>
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <h3 style={{ fontSize: '16px', fontWeight: 900, color: '#0f172a' }}>{u.name}</h3>
                                    {u.role === 'owner' && <ShieldCheck size={14} color="#f59e0b" />}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                                    <span style={{ fontSize: '10px', fontWeight: 900, background: u.role === 'owner' ? '#fffbeb' : '#f8fafc', color: u.role === 'owner' ? '#f59e0b' : '#64748b', padding: '4px 10px', borderRadius: '8px', border: '1px solid currentColor', letterSpacing: '0.05em' }}>
                                        {u.role.toUpperCase()}
                                    </span>
                                    <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 700 }}>PIN: {u.pin}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => openEdit(u)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f8fafc', color: '#64748b', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Edit2 size={16} />
                            </button>
                            {u.id !== 'owner' && (
                                <button onClick={() => setDeleteConfirm(u.id)} style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef2f2', color: '#ef4444', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Premium Delete Confirmation */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" style={{ padding: '32px 24px', background: 'white', borderRadius: '32px', maxWidth: '340px', width: '90%', margin: '0 auto', textAlign: 'center' }}>
                        <div style={{ background: '#fef2f2', color: '#ef4444', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <Trash2 size={28} />
                        </div>
                        <h3 style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', marginBottom: '8px' }}>Hapus Staff?</h3>
                        <p style={{ color: '#64748b', marginBottom: '28px', fontSize: '14px', lineHeight: '1.5' }}>Karyawan ini tidak akan lagi memiliki akses ke sistem kasir WARUNG KOSAM.</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button className="btn-primary" style={{ background: '#ef4444', color: 'white', height: '52px', borderRadius: '16px' }} onClick={() => { deleteUser(deleteConfirm); setDeleteConfirm(null); refresh(); }}>Ya, Hapus Akses</button>
                            <button className="btn-secondary" style={{ height: '52px', border: 'none', borderRadius: '16px' }} onClick={() => setDeleteConfirm(null)}>Kembali</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

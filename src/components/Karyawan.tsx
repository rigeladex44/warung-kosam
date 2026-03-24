'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus, Trash2, Users, CheckCircle2,
    Edit2, X, Save, Delete, LogOut, KeyRound,
} from 'lucide-react';
import {
    getUsers, addUser, updateUser, deleteUser, getActiveUser, clearActiveUser,
    type AppUser,
} from '@/lib/users';

type KaryawanView = 'list' | 'add' | 'edit';

const SEED_COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];

const emptyForm = { name: '', role: 'karyawan' as AppUser['role'], pin: '', confirmPin: '', color: SEED_COLORS[1] };

export default function Karyawan() {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [view, setView] = useState<KaryawanView>('list');
    const [activeUser] = useState<AppUser | null>(() => getActiveUser());
    const [form, setForm] = useState(emptyForm);
    const [editTarget, setEditTarget] = useState<AppUser | null>(null);
    const [pinInput, setPinInput] = useState('');
    const [pinStep, setPinStep] = useState<'enter' | 'confirm'>('enter');
    const [pinError, setPinError] = useState('');
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    const refresh = () => {
        setUsers(getUsers());
    };

    useEffect(() => { refresh(); }, []);

    // ── PIN keypad for add/edit ───────────────────────────────────────────────

    const handlePinDigit = (d: string) => {
        if (pinInput.length >= 6) return;
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

    // ── Save user ─────────────────────────────────────────────────────────────

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
        setPinInput('');
        setPinStep('enter');
        setPinError('');
        setView('edit');
    };

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

    // ── Add / Edit view ───────────────────────────────────────────────────────

    if (view === 'add' || view === 'edit') {
        const title = view === 'add' ? 'Tambah Karyawan' : 'Edit Karyawan';
        const pinReady = view === 'edit' ? true : (form.pin && form.pin === form.confirmPin);
        const canSave = form.name.trim() && pinReady;

        return (
            <div className="page-container">
                <div className="page-header">
                    <button className="back-btn" onClick={() => { setView('list'); resetPinForm(); }}><X size={20} /></button>
                    <h1 className="page-title">{title}</h1>
                </div>
                <div className="form-card">
                    {/* Nama */}
                    <div className="form-group">
                        <label className="form-label">Nama</label>
                        <input
                            className="form-input"
                            placeholder="Nama karyawan..."
                            value={form.name}
                            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                        />
                    </div>

                    {/* Role */}
                    <div className="form-group">
                        <label className="form-label">Role</label>
                        <div className="kar-role-row">
                            {(['owner', 'karyawan'] as AppUser['role'][]).map((r) => (
                                <button
                                    key={r}
                                    className={`kar-role-btn ${form.role === r ? 'active' : ''}`}
                                    onClick={() => setForm((f) => ({ ...f, role: r }))}
                                >
                                    {r === 'owner' ? 'Pemilik' : 'Karyawan'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Color */}
                    <div className="form-group">
                        <label className="form-label">Warna Avatar</label>
                        <div className="kar-color-row">
                            {SEED_COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={`kar-color-dot ${form.color === c ? 'selected' : ''}`}
                                    style={{ background: c }}
                                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                                />
                            ))}
                        </div>
                    </div>

                    {/* PIN setup */}
                    <div className="form-group">
                        <label className="form-label">
                            <KeyRound size={14} />
                            {view === 'edit' ? ' PIN (kosongkan jika tidak berubah)' : ` PIN ${pinStep === 'enter' ? '(masukkan 4 digit)' : '(konfirmasi PIN)'}`}
                        </label>

                        {view === 'edit' && (
                            <input
                                className="form-input"
                                type="password"
                                placeholder="PIN baru (4 digit)..."
                                maxLength={6}
                                inputMode="numeric"
                                value={form.pin}
                                onChange={(e) => {
                                    const v = e.target.value.replace(/\D/g, '');
                                    setForm((f) => ({ ...f, pin: v, confirmPin: v }));
                                }}
                            />
                        )}

                        {view === 'add' && (
                            <>
                                <div className={`sset-pin-dots`} style={{ marginBottom: 8 }}>
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className={`sset-dot ${i < pinInput.length ? 'filled' : ''} ${pinError ? 'error' : ''}`} />
                                    ))}
                                </div>
                                {pinError && <p className="sset-pin-error">{pinError}</p>}
                                {(form.pin && form.confirmPin) && (
                                    <div className="kar-pin-ok"><CheckCircle2 size={14} /> PIN dikonfirmasi</div>
                                )}
                                <div className="sset-keypad" style={{ maxWidth: 240, margin: '0 auto' }}>
                                    {digits.map((d, i) => {
                                        if (d === null) return <div key={i} />;
                                        if (d === 'del') return (
                                            <button key={i} className="sset-key del" onClick={handlePinDel} disabled={pinInput.length === 0}>
                                                <Delete size={18} />
                                            </button>
                                        );
                                        return (
                                            <button key={i} className="sset-key" onClick={() => handlePinDigit(String(d))}>{d}</button>
                                        );
                                    })}
                                </div>
                            </>
                        )}
                    </div>

                    <button className="btn-primary full-width" disabled={!canSave} onClick={handleSave}>
                        <Save size={16} /> Simpan
                    </button>
                </div>
            </div>
        );
    }

    // ── Main list view ────────────────────────────────────────────────────────

    const isOwner = activeUser?.role === 'owner';

    return (
        <div className="page-container">
            <div className="page-header">
                <h1 className="page-title">Karyawan</h1>
                <div className="header-actions">
                    <button className="btn-icon-secondary" title="Keluar Akun" onClick={() => {
                        if (typeof window !== 'undefined' && window.confirm('Keluar dari sesi ini?')) {
                            clearActiveUser();
                            sessionStorage.removeItem('toko_pin_verified');
                            window.location.href = '/';
                        }
                    }}>
                        <LogOut size={18} />
                    </button>
                    {isOwner && (
                        <button className="btn-icon-primary" onClick={() => { setForm(emptyForm); resetPinForm(); setView('add'); }}>
                            <UserPlus size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* User cards */}
            <div className="kar-user-list">
                {users.map((u) => {
                    return (
                        <div key={u.id} className="kar-user-card">
                            <div
                                className="user-avatar large"
                                style={{ background: u.color ?? '#f59e0b' }}
                            >
                                {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="kar-user-info">
                                <div className="kar-user-name">{u.name}</div>
                                <div className="kar-user-role">
                                    {u.role === 'owner' ? 'Pemilik' : 'Karyawan'}
                                </div>
                            </div>
                            <div className="kar-user-actions">
                                {isOwner && (
                                    <>
                                        <button className="inv-btn-edit" onClick={() => openEdit(u)}>
                                            <Edit2 size={14} />
                                        </button>
                                        {u.id !== 'owner' && (
                                            <button className="inv-btn-delete" onClick={() => setDeleteConfirm(u.id)}>
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        </div>
                    );
                })}

                {users.length === 0 && (
                    <div className="empty-state">
                        <Users size={40} className="empty-icon-muted" />
                        <p>Belum ada karyawan</p>
                    </div>
                )}
            </div>

            {/* Delete confirm */}
            {deleteConfirm && (
                <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Hapus Karyawan?</h3>
                        <p className="modal-body">Data karyawan <strong>{users.find((u) => u.id === deleteConfirm)?.name}</strong> akan dihapus.</p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Batal</button>
                            <button className="btn-danger" onClick={() => { deleteUser(deleteConfirm); setDeleteConfirm(null); refresh(); }}>Hapus</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

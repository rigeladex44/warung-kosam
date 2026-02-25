'use client';

import { useState, useEffect } from 'react';
import { Store, KeyRound, ChevronRight, CheckCircle, X, Delete, Pencil, ChevronLeft } from 'lucide-react';
import { fetchStoreName, updateStoreName, fetchPin, updatePin } from '@/lib/pin-manager';

const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';

interface Props {
    onClose: () => void;
    onNameChange?: (name: string) => void;
}

type View = 'main' | 'pin';
type PinStep = 'verify' | 'new' | 'confirm' | 'success';

export default function StoreSettingsModal({ onClose, onNameChange }: Props) {
    const [view, setView] = useState<View>('main');

    // ── Nama Toko ──────────────────────────────────────────────────────────────
    const [storeName, setStoreName] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        fetchStoreName().then((n) => { setStoreName(n); setNameInput(n); });
    }, []);

    const handleSaveName = async () => {
        const trimmed = nameInput.trim();
        if (!trimmed || trimmed === storeName) return;
        setSaving(true);
        const ok = await updateStoreName(trimmed);
        setSaving(false);
        if (ok) {
            setStoreName(trimmed);
            onNameChange?.(trimmed);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    // ── Ganti PIN ──────────────────────────────────────────────────────────────
    const PIN_LEN = 4;
    const [pinStep, setPinStep] = useState<PinStep>('verify');
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [shaking, setShaking] = useState(false);
    const [pinSaving, setPinSaving] = useState(false);

    const shake = (msg: string) => {
        setPinError(msg);
        setShaking(true);
        setTimeout(() => { setPin(''); setShaking(false); }, 650);
    };

    const handlePinDigit = async (d: string) => {
        const next = pin + d;
        if (next.length > 6) return;
        setPin(next);
        setPinError('');

        if (pinStep === 'verify' && next.length >= 4) {
            const correct = await fetchPin();
            if (next !== correct) { shake('PIN lama salah, coba lagi'); return; }
            setTimeout(() => { setPin(''); setPinStep('new'); }, 200);
        }
        if (pinStep === 'new' && next.length === PIN_LEN) {
            if (/^(.)\1+$/.test(next)) { shake('PIN terlalu mudah ditebak'); return; }
            setTimeout(() => { setNewPin(next); setPin(''); setPinStep('confirm'); }, 200);
        }
        if (pinStep === 'confirm' && next.length === PIN_LEN) {
            if (next !== newPin) { shake('PIN tidak cocok, ulangi'); return; }
            setPinSaving(true);
            await updatePin(newPin);
            setPinSaving(false);
            setPinStep('success');
        }
    };

    const handlePinDel = () => { setPin((p) => p.slice(0, -1)); setPinError(''); };

    const goBackToMain = () => {
        setView('main');
        setPinStep('verify');
        setPin('');
        setPinError('');
    };

    const pinStepLabels: Record<PinStep, string> = {
        verify: 'Masukkan PIN lama',
        new: 'Masukkan PIN baru (4 digit)',
        confirm: 'Konfirmasi PIN baru',
        success: '',
    };

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'] as const;

    // ── Render ─────────────────────────────────────────────────────────────────
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" style={{ gap: 0, padding: 0, overflow: 'hidden' }} onClick={(e) => e.stopPropagation()}>

                {/* ────── HEADER ────── */}
                <div className="sset-header">
                    {view === 'pin' && (
                        <button className="sset-back" onClick={goBackToMain}>
                            <ChevronLeft size={18} />
                        </button>
                    )}
                    <div className="sset-header-icon">
                        {view === 'main' ? <Store size={16} /> : <KeyRound size={16} />}
                    </div>
                    <span className="sset-header-title">
                        {view === 'main' ? 'Pengaturan Toko' : 'Ganti PIN Akses'}
                    </span>
                    <button className="sset-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* ────── MAIN VIEW ────── */}
                {view === 'main' && (
                    <div className="sset-body">

                        {/* Nama Toko */}
                        <div className="sset-section">
                            <p className="sset-label">Nama Toko</p>
                            <div className="sset-name-row">
                                <input
                                    className="sset-input"
                                    value={nameInput}
                                    onChange={(e) => { setNameInput(e.target.value); setSaved(false); }}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                                    placeholder="Nama toko..."
                                    maxLength={40}
                                />
                                <button
                                    className={`sset-save-btn ${saved ? 'saved' : ''}`}
                                    onClick={handleSaveName}
                                    disabled={saving || !nameInput.trim() || nameInput.trim() === storeName}
                                >
                                    {saved
                                        ? <><CheckCircle size={14} /> Tersimpan</>
                                        : saving
                                            ? '…'
                                            : <><Pencil size={13} /> Simpan</>}
                                </button>
                            </div>
                        </div>

                        {/* Keamanan — Supabase only */}
                        {IS_SUPABASE && (
                            <>
                                <div className="sset-divider" />
                                <div className="sset-section">
                                    <p className="sset-label">Keamanan</p>
                                    <button className="sset-pin-row" onClick={() => setView('pin')}>
                                        <div className="sset-pin-icon"><KeyRound size={15} /></div>
                                        <span>Ganti PIN Akses</span>
                                        <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* ────── PIN VIEW ────── */}
                {view === 'pin' && (
                    <div className="sset-body">
                        {pinStep === 'success' ? (
                            <div className="sset-success">
                                <CheckCircle size={44} color="#059669" />
                                <p className="sset-success-title">PIN Berhasil Diganti!</p>
                                <p className="sset-success-sub">Berlaku di semua device sekarang.</p>
                                <button className="btn-primary" style={{ marginTop: 4 }} onClick={goBackToMain}>
                                    Kembali
                                </button>
                            </div>
                        ) : (
                            <>
                                <p className="sset-pin-label">{pinStepLabels[pinStep]}</p>

                                {/* Dots */}
                                <div className={`sset-pin-dots ${shaking ? 'pin-shake' : ''}`}>
                                    {Array.from({ length: PIN_LEN }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`sset-dot ${i < pin.length ? 'filled' : ''} ${pinError ? 'error' : ''}`}
                                        />
                                    ))}
                                </div>

                                {pinError && <p className="sset-pin-error">{pinError}</p>}

                                {/* Keypad */}
                                {pinSaving ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}>
                                        <div className="loading-spinner" />
                                    </div>
                                ) : (
                                    <div className="sset-keypad">
                                        {digits.map((d, i) => {
                                            if (d === null) return <div key={i} />;
                                            if (d === 'del') return (
                                                <button key={i} className="sset-key del" onClick={handlePinDel} disabled={pin.length === 0}>
                                                    <Delete size={18} />
                                                </button>
                                            );
                                            return (
                                                <button key={i} className="sset-key" onClick={() => handlePinDigit(String(d))}>
                                                    {d}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import { Store, KeyRound, ChevronRight, CheckCircle, X, Delete, Pencil } from 'lucide-react';
import { fetchStoreName, updateStoreName, fetchPin, updatePin } from '@/lib/pin-manager';

const IS_SUPABASE = process.env.NEXT_PUBLIC_STORAGE_MODE === 'supabase';

interface Props {
    onClose: () => void;
    onNameChange?: (name: string) => void;
}

type PinStep = 'verify' | 'new' | 'confirm' | 'success';

export default function StoreSettingsModal({ onClose, onNameChange }: Props) {
    const [storeName, setStoreName] = useState('');
    const [nameInput, setNameInput] = useState('');
    const [nameLoading, setNameLoading] = useState(false);
    const [nameSaved, setNameSaved] = useState(false);

    const [showPin, setShowPin] = useState(false);
    const [pinStep, setPinStep] = useState<PinStep>('verify');
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [pinError, setPinError] = useState('');
    const [shaking, setShaking] = useState(false);
    const [pinSaving, setPinSaving] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        fetchStoreName().then((n) => {
            setStoreName(n);
            setNameInput(n);
        });
    }, []);

    // ── Name save ──────────────────────────────────────────────────────────────
    const handleSaveName = async () => {
        if (!nameInput.trim() || nameInput.trim() === storeName) return;
        setNameLoading(true);
        const ok = await updateStoreName(nameInput.trim());
        setNameLoading(false);
        if (ok) {
            setStoreName(nameInput.trim());
            setNameSaved(true);
            onNameChange?.(nameInput.trim());
            setTimeout(() => setNameSaved(false), 2000);
        }
    };

    // ── PIN flow ───────────────────────────────────────────────────────────────
    const PIN_LEN = 4;

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
            if (next !== correct) { shake('PIN lama salah'); return; }
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

    const pinTitle: Record<PinStep, string> = {
        verify: 'Masukkan PIN Lama',
        new: 'Masukkan PIN Baru (4 digit)',
        confirm: 'Konfirmasi PIN Baru',
        success: 'PIN Berhasil Diganti!',
    };

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'] as const;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="settings-modal-card" onClick={(e) => e.stopPropagation()}>

                {/* ── Header ── */}
                <div className="settings-modal-header">
                    <div className="settings-modal-icon">
                        <Store size={18} />
                    </div>
                    <h3 className="settings-modal-title">Pengaturan Toko</h3>
                    <button className="change-pin-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* ── Nama Toko ── */}
                <div className="settings-section">
                    <p className="settings-section-label">Nama Toko</p>
                    <div className="settings-name-row">
                        <input
                            ref={inputRef}
                            className="settings-name-input"
                            value={nameInput}
                            onChange={(e) => { setNameInput(e.target.value); setNameSaved(false); }}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); }}
                            placeholder="Nama toko..."
                            maxLength={40}
                        />
                        <button
                            className={`settings-save-btn ${nameSaved ? 'saved' : ''}`}
                            onClick={handleSaveName}
                            disabled={nameLoading || !nameInput.trim() || nameInput.trim() === storeName}
                        >
                            {nameSaved ? <CheckCircle size={16} /> : nameLoading ? '…' : <Pencil size={14} />}
                            {nameSaved ? 'Tersimpan' : 'Simpan'}
                        </button>
                    </div>
                </div>

                {/* ── PIN section (Supabase only) ── */}
                {IS_SUPABASE && (
                    <>
                        <div className="settings-divider" />
                        <div className="settings-section">
                            <p className="settings-section-label">Keamanan</p>

                            {!showPin ? (
                                <button
                                    className="settings-pin-row"
                                    onClick={() => setShowPin(true)}
                                >
                                    <div className="settings-pin-icon">
                                        <KeyRound size={16} />
                                    </div>
                                    <span>Ganti PIN Akses</span>
                                    <ChevronRight size={16} className="settings-pin-arrow" />
                                </button>
                            ) : (
                                <div className="settings-pin-flow">
                                    {pinStep === 'success' ? (
                                        <div className="change-pin-success">
                                            <CheckCircle size={40} color="#059669" />
                                            <p>PIN baru aktif di semua device!</p>
                                            <button className="btn-primary" onClick={() => { setShowPin(false); setPinStep('verify'); setPin(''); }}>
                                                Selesai
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <p className="settings-pin-step-label">{pinTitle[pinStep]}</p>
                                            <div className={`pin-dots ${shaking ? 'pin-shake' : ''}`} style={{ justifyContent: 'center', marginBottom: 12 }}>
                                                {Array.from({ length: PIN_LEN }).map((_, i) => (
                                                    <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''} ${pinError ? 'error' : ''}`} />
                                                ))}
                                            </div>
                                            {pinError && <p className="pin-error" style={{ textAlign: 'center', marginBottom: 8 }}>{pinError}</p>}
                                            {pinSaving ? (
                                                <div style={{ display: 'flex', justifyContent: 'center', padding: 12 }}>
                                                    <div className="loading-spinner" />
                                                </div>
                                            ) : (
                                                <div className="pin-keypad" style={{ maxWidth: 220, margin: '0 auto' }}>
                                                    {digits.map((d, i) => {
                                                        if (d === null) return <div key={i} />;
                                                        if (d === 'del') return (
                                                            <button key={i} className="pin-key del" onClick={handlePinDel} disabled={pin.length === 0}>
                                                                <Delete size={16} />
                                                            </button>
                                                        );
                                                        return (
                                                            <button key={i} className="pin-key" onClick={() => handlePinDigit(String(d))}>
                                                                {d}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                            <button className="settings-pin-cancel" onClick={() => { setShowPin(false); setPinStep('verify'); setPin(''); setPinError(''); }}>
                                                Batal
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

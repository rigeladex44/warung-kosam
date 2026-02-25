'use client';

import { useState } from 'react';
import { KeyRound, CheckCircle, X } from 'lucide-react';
import { fetchPin, updatePin } from '@/lib/pin-manager';

interface ChangePinModalProps {
    onClose: () => void;
}

type Step = 'verify' | 'new' | 'confirm' | 'success';

export default function ChangePinModal({ onClose }: ChangePinModalProps) {
    const [step, setStep] = useState<Step>('verify');
    const [pin, setPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [error, setError] = useState('');
    const [shaking, setShaking] = useState(false);
    const [saving, setSaving] = useState(false);

    const PIN_LENGTH = 4; // panjang PIN baru (bisa 4-6)

    const shake = (msg: string) => {
        setError(msg);
        setShaking(true);
        setTimeout(() => {
            setPin('');
            setShaking(false);
        }, 650);
    };

    const handleDigit = async (digit: string) => {
        const next = pin + digit;
        if (next.length > 6) return;
        setPin(next);
        setError('');

        if (step === 'verify' && next.length >= 4) {
            const correct = await fetchPin();
            if (next !== correct) { shake('PIN lama salah'); return; }
            setTimeout(() => { setPin(''); setStep('new'); }, 200);
        }

        if (step === 'new' && next.length === PIN_LENGTH) {
            if (/^(.)\1+$/.test(next)) { shake('PIN terlalu mudah ditebak'); return; }
            setTimeout(() => { setNewPin(next); setPin(''); setStep('confirm'); }, 200);
        }

        if (step === 'confirm' && next.length === PIN_LENGTH) {
            if (next !== newPin) { shake('PIN tidak cocok, coba lagi'); return; }
            setSaving(true);
            const ok = await updatePin(newPin);
            setSaving(false);
            if (!ok) { setError('Gagal menyimpan, coba lagi'); return; }
            setStep('success');
        }
    };

    const handleDelete = () => {
        setPin((p) => p.slice(0, -1));
        setError('');
    };

    const titles: Record<Step, string> = {
        verify: 'Masukkan PIN Lama',
        new: 'Masukkan PIN Baru',
        confirm: 'Konfirmasi PIN Baru',
        success: 'PIN Berhasil Diganti',
    };

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card change-pin-modal" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="change-pin-header">
                    <div className="change-pin-icon">
                        <KeyRound size={20} />
                    </div>
                    <div>
                        <h3 className="modal-title" style={{ marginBottom: 2 }}>Ganti PIN</h3>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>{titles[step]}</p>
                    </div>
                    <button className="change-pin-close" onClick={onClose}><X size={18} /></button>
                </div>

                {/* Success state */}
                {step === 'success' ? (
                    <div className="change-pin-success">
                        <CheckCircle size={48} color="#059669" />
                        <p>PIN baru berhasil disimpan.</p>
                        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>Berlaku di semua device.</p>
                        <button className="btn-primary" style={{ marginTop: 8 }} onClick={onClose}>Selesai</button>
                    </div>
                ) : (
                    <>
                        {/* Dots */}
                        <div className={`pin-dots ${shaking ? 'pin-shake' : ''}`} style={{ justifyContent: 'center', margin: '20px 0 12px' }}>
                            {Array.from({ length: step === 'verify' ? 4 : PIN_LENGTH }).map((_, i) => (
                                <div key={i} className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`} />
                            ))}
                        </div>

                        {error && <p className="pin-error" style={{ textAlign: 'center', marginBottom: 8 }}>{error}</p>}

                        {/* Keypad */}
                        {saving ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                                <div className="loading-spinner" />
                            </div>
                        ) : (
                            <div className="pin-keypad" style={{ maxWidth: 240, margin: '0 auto' }}>
                                {digits.map((d, i) => {
                                    if (d === null) return <div key={i} />;
                                    if (d === 'del') return (
                                        <button key={i} className="pin-key del" onClick={handleDelete} disabled={pin.length === 0}>
                                            ⌫
                                        </button>
                                    );
                                    return (
                                        <button key={i} className="pin-key" onClick={() => handleDigit(String(d))}>
                                            {d}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

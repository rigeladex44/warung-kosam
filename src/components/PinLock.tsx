'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete } from 'lucide-react';

const CORRECT_PIN = process.env.NEXT_PUBLIC_ACCESS_PIN ?? '1234';
const SESSION_KEY = 'toko_pin_verified';

interface PinLockProps {
    children: React.ReactNode;
}

export default function PinLock({ children }: PinLockProps) {
    const [unlocked, setUnlocked] = useState(false);
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shaking, setShaking] = useState(false);

    // Check existing session
    useEffect(() => {
        if (sessionStorage.getItem(SESSION_KEY) === '1') {
            setUnlocked(true);
        }
    }, []);

    const handleKey = useCallback((digit: string) => {
        if (pin.length >= 6) return;
        const next = pin + digit;
        setPin(next);
        setError(false);

        if (next.length === CORRECT_PIN.length) {
            if (next === CORRECT_PIN) {
                sessionStorage.setItem(SESSION_KEY, '1');
                setTimeout(() => setUnlocked(true), 300);
            } else {
                setShaking(true);
                setError(true);
                setTimeout(() => {
                    setPin('');
                    setShaking(false);
                }, 700);
            }
        }
    }, [pin]);

    const handleDelete = () => {
        setPin((p) => p.slice(0, -1));
        setError(false);
    };

    if (unlocked) return <>{children}</>;

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

    return (
        <div className="pin-lock-screen">
            <div className="pin-lock-card">
                {/* Icon */}
                <div className="pin-lock-icon">
                    <Lock size={28} />
                </div>

                <h1 className="pin-lock-title">Toko Mbak Atria</h1>
                <p className="pin-lock-subtitle">Masukkan PIN untuk melanjutkan</p>

                {/* Dots */}
                <div className={`pin-dots ${shaking ? 'pin-shake' : ''}`}>
                    {Array.from({ length: CORRECT_PIN.length }).map((_, i) => (
                        <div
                            key={i}
                            className={`pin-dot ${i < pin.length ? 'filled' : ''} ${error ? 'error' : ''}`}
                        />
                    ))}
                </div>

                {/* Keypad */}
                <div className="pin-keypad">
                    {digits.map((d, i) => {
                        if (d === null) return <div key={i} />;
                        if (d === 'del') return (
                            <button key={i} className="pin-key del" onClick={handleDelete} disabled={pin.length === 0}>
                                <Delete size={20} />
                            </button>
                        );
                        return (
                            <button key={i} className="pin-key" onClick={() => handleKey(String(d))}>
                                {d}
                            </button>
                        );
                    })}
                </div>

                {error && <p className="pin-error">PIN salah, coba lagi</p>}
            </div>
        </div>
    );
}

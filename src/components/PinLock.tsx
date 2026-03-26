'use client';

import { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, User, ChevronLeft } from 'lucide-react';
import { APP_CONFIG } from '@/lib/config';
import { getUsers, verifyUserPin, setActiveUser, getActiveUser, type AppUser } from '@/lib/users';

const SESSION_KEY = 'toko_pin_verified';

interface PinLockProps {
    children: React.ReactNode;
}

export default function PinLock({ children }: PinLockProps) {
    const [mounted, setMounted] = useState(false);
    const [unlocked, setUnlocked] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
    const [allUsers, setAllUsers] = useState<AppUser[]>([]);
    
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);
    const [shaking, setShaking] = useState(false);

    // Initial check (Client-only to avoid hydration mismatch)
    useEffect(() => {
        setMounted(true);
        const isVerified = sessionStorage.getItem(SESSION_KEY) === '1';
        const activeUser = getActiveUser();

        if (isVerified && activeUser) {
            setUnlocked(true);
        } else {
            setAllUsers(getUsers());
        }
    }, []);

    const handleKey = useCallback((digit: string) => {
        if (!selectedUser || unlocked) return;
        if (pin.length >= selectedUser.pin.length) return;
        
        const next = pin + digit;
        setPin(next);
        setError(false);

        // Success terminal condition
        if (next.length === selectedUser.pin.length) {
            if (verifyUserPin(selectedUser.id, next)) {
                setActiveUser(selectedUser.id);
                // Mark verified BEFORE setting unlocked state
                sessionStorage.setItem(SESSION_KEY, '1');
                
                // Add a small delay for the last dot to fill
                setTimeout(() => {
                    setUnlocked(true);
                }, 200);
            } else {
                setShaking(true);
                setError(true);
                setTimeout(() => {
                    setPin('');
                    setShaking(false);
                }, 600);
            }
        }
    }, [pin, selectedUser, unlocked]);

    const handleDelete = () => {
        setPin((p) => p.slice(0, -1));
        setError(false);
    };

    // Prevent hydration mismatch (nothing is rendered on server)
    if (!mounted) return <div className="pin-lock-screen" />;

    if (unlocked) return <>{children}</>;

    const digits = [1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'del'];

    // ── Phase 1: User Selection ───────────────────────────────────────────────
    if (!selectedUser) {
        return (
            <div className="pin-lock-screen">
                <div className="pin-lock-card">
                    <div className="pin-lock-icon">
                        <img src="/logo.png" alt="Logo" className="login-logo-img" />
                    </div>
                    <h1 className="pin-lock-title">{APP_CONFIG.storeName}</h1>
                    <p className="pin-lock-subtitle">Pilih akun untuk masuk</p>

                    <div className="user-grid">
                        {allUsers.map((u) => (
                            <button key={u.id} className="user-login-btn" onClick={() => setSelectedUser(u)}>
                                <div className="user-avatar" style={{ background: u.color || '#f59e0b' }}>
                                    {u.name.charAt(0).toUpperCase()}
                                </div>
                                <div className="user-name">{u.name}</div>
                                <div className="user-role">{u.role === 'owner' ? 'Pemilik' : 'Kasir'}</div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // ── Phase 2: PIN Entry ───────────────────────────────────────────────────
    return (
        <div className="pin-lock-screen">
            <div className="pin-lock-card">
                <button className="pin-back-btn" onClick={() => { setSelectedUser(null); setPin(''); setError(false); }}>
                    <ChevronLeft size={20} />
                    <span>Ganti Akun</span>
                </button>

                <div className="user-avatar mini" style={{ background: selectedUser.color || '#f59e0b' }}>
                    {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <h1 className="pin-lock-title" style={{ marginTop: 8 }}>{selectedUser.name}</h1>
                <p className="pin-lock-subtitle">Masukkan PIN {selectedUser.role === 'owner' ? 'Pemilik' : 'Kasir'}</p>

                {/* Dots */}
                <div className={`pin-dots ${shaking ? 'pin-shake' : ''}`}>
                    {Array.from({ length: selectedUser.pin.length }).map((_, i) => (
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

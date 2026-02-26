'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';

const STORAGE_KEYS = [
    'toko-mini-storage',
    'toko-store-name',
    'toko-access-pin',
];

export default function DemoReset() {
    const [confirm, setConfirm] = useState(false);

    const handleReset = () => {
        STORAGE_KEYS.forEach((k) => localStorage.removeItem(k));
        window.location.reload();
    };

    return (
        <>
            {/* Tombol Demo Reset di pojok kanan bawah di atas navbar */}
            <button
                className="demo-reset-btn"
                onClick={() => setConfirm(true)}
                title="Reset data demo"
            >
                <RotateCcw size={13} />
                <span>Reset Demo</span>
            </button>

            {/* Confirm modal */}
            {confirm && (
                <div className="modal-overlay" onClick={() => setConfirm(false)}>
                    <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Reset Data Demo?</h3>
                        <p className="modal-body">
                            Semua transaksi, pengeluaran, dan perubahan stok akan dihapus.<br />
                            Produk akan kembali ke data awal.
                        </p>
                        <div className="modal-actions">
                            <button className="btn-secondary" onClick={() => setConfirm(false)}>Batal</button>
                            <button className="btn-danger" onClick={handleReset}>Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

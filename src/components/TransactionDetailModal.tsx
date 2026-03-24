import { X, Trash2, Receipt } from 'lucide-react';
import { formatRupiah, formatTime } from '@/lib/utils';
import { getActiveUser } from '@/lib/users';
import type { Sale } from '@/lib/store';

interface Props {
    sale: Sale;
    onClose: () => void;
    onDelete: (id: string) => void;
}

export default function TransactionDetailModal({ sale, onClose, onDelete }: Props) {
    const activeUser = getActiveUser();
    const isOwner = activeUser?.role === 'owner';

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ padding: '24px', maxWidth: '400px' }}>
                <div className="flex" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 className="modal-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Receipt size={20} className="text-blue-500" /> Detail Transaksi
                    </h3>
                    <button className="text-btn" onClick={onClose} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={20} /></button>
                </div>
                
                <div className="receipt-content" style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', marginBottom: '20px' }}>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px dashed #cbd5e1' }}>
                        <div style={{ marginBottom: '4px' }}>Waktu: {formatTime(sale.createdAt)}</div>
                        <div style={{ marginBottom: '4px' }}>Kasir: {sale.staffName || 'Kasir'}</div>
                        <div style={{ marginBottom: '4px' }}>Metode: {sale.paymentMethod || 'Cash'}</div>
                        <div>ID: {sale.id}</div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                        {sale.items.map((item, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '14px' }}>
                                <div>
                                    <div style={{ fontWeight: 600, color: '#334155' }}>{item.productName}</div>
                                    <div style={{ color: '#64748b', fontSize: '13px' }}>{item.quantity} x {formatRupiah(item.sellingPrice)}</div>
                                </div>
                                <div style={{ fontWeight: 600, color: '#0f172a' }}>{formatRupiah(item.subtotal)}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '16px', fontWeight: 'bold', color: '#0f172a' }}>
                            <span>Total</span>
                            <span>{formatRupiah(sale.totalRevenue)}</span>
                        </div>
                        {sale.paymentMethod === 'Cash' && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '8px' }}>
                                    <span>Tunai</span>
                                    <span>{formatRupiah(sale.cashReceived)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                                    <span>Kembali</span>
                                    <span>{formatRupiah(sale.change)}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="modal-actions" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {isOwner ? (
                        <button 
                            className="text-btn-red"
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', backgroundColor: '#fef2f2', border: 'none', borderRadius: '8px', cursor: 'pointer', color: '#ef4444', fontWeight: 600, fontSize: '13px' }}
                            onClick={() => {
                                if(window.confirm('Yakin hapus transaksi ini permanen? Laporan omzet dan saldo akan langsung terpotong menyesuaikan.')) {
                                    onDelete(sale.id);
                                    onClose();
                                }
                            }}
                        >
                            <Trash2 size={16} /> Hapus Data
                        </button>
                    ) : (
                        <div />
                    )}
                    <button className="btn-secondary" onClick={onClose}>Tutup</button>
                </div>
            </div>
        </div>
    );
}

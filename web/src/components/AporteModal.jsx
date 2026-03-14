import React, { useState, useRef } from 'react';
import { X, PiggyBank, Camera, CheckCircle, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

/**
 * AporteModal — Modal obligatorio para registrar un aporte.
 * Incluye: monto, nota, confirmación física y foto opcional.
 */
export default function AporteModal({ goalId, suggestedQuota, onClose, onSuccess }) {
    const [amount, setAmount] = useState(suggestedQuota ? String(suggestedQuota) : '');
    const [note, setNote] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [photoFile, setPhotoFile] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!amount || Number(amount) <= 0) {
            setError('Ingresa un monto válido.');
            return;
        }
        if (!confirmed) {
            setError('Debes confirmar que el dinero ya fue introducido en tu alcancía.');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const headers = { 'Authorization': `Bearer ${token}` };
            let evidenceUrl = null;

            // 1. Subir foto si hay (opcional)
            if (photoFile) {
                const formData = new FormData();
                formData.append('file', photoFile);
                formData.append('goal_id', goalId);
                const uploadRes = await fetch(`${API_BASE_URL}/api/v1/upload-evidence`, {
                    method: 'POST',
                    headers,
                    body: formData
                });
                const uploadData = await uploadRes.json();
                if (uploadData.ok && uploadData.url) {
                    evidenceUrl = uploadData.url;
                }
            }

            // 2. Registrar la transacción
            const res = await fetch(`${API_BASE_URL}/api/v1/goals/${goalId}/transactions`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: Number(amount),
                    note: note.trim(),
                    confirmed_physical: true,
                    evidence_url: evidenceUrl
                })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al registrar el aporte');

            onSuccess(data.transaction);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        /* Overlay */
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(2px)' }}
        >
            {/* Bottom sheet */}
            <div style={{ backgroundColor: 'white', borderRadius: '24px 24px 0 0', padding: '24px', width: '100%', maxWidth: '480px', boxSizing: 'border-box', maxHeight: '92vh', overflowY: 'auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '12px' }}>
                            <PiggyBank size={22} color="#10B981" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#111827' }}>Registrar Aporte</h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={18} color="#374151" />
                    </button>
                </div>

                {/* Texto aclaratorio */}
                <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px 14px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <AlertCircle size={16} color="#2563EB" style={{ flexShrink: 0, marginTop: '1px' }} />
                    <p style={{ margin: 0, fontSize: '12px', color: '#1E40AF', lineHeight: '1.5' }}>
                        Registra aquí <strong>solo el dinero que ya colocaste dentro de tu alcancía física</strong>. Así mantendrás un control más real de tus ahorros.
                    </p>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Monto */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Monto aportado (RD$) *
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder={suggestedQuota ? `Cuota sugerida: RD$ ${suggestedQuota.toLocaleString()}` : 'Ej. 500'}
                            required
                            min="1"
                            style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #E5E7EB', fontSize: '20px', fontWeight: '700', color: '#059669', boxSizing: 'border-box', outline: 'none', background: '#F9FAFB' }}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                        {suggestedQuota && (
                            <button type="button" onClick={() => setAmount(String(suggestedQuota))} style={{ marginTop: '6px', background: 'none', border: 'none', color: '#10B981', fontSize: '12px', cursor: 'pointer', fontWeight: '600', padding: 0 }}>
                                Usar cuota sugerida (RD$ {suggestedQuota.toLocaleString()})
                            </button>
                        )}
                    </div>

                    {/* Nota */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Nota (opcional)
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="Ej. Ahorro del viernes, quincena de marzo..."
                            maxLength={200}
                            style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', boxSizing: 'border-box', outline: 'none', background: '#F9FAFB' }}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    {/* Foto (opcional) */}
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Foto de evidencia (opcional)
                        </label>
                        {photoPreview ? (
                            <div style={{ position: 'relative' }}>
                                <img src={photoPreview} alt="Evidencia" style={{ width: '100%', maxHeight: '160px', objectFit: 'cover', borderRadius: '12px', border: '1px solid #E5E7EB' }} />
                                <button type="button" onClick={() => { setPhotoFile(null); setPhotoPreview(null); }} style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.6)', border: 'none', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                    <X size={14} color="white" />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => fileInputRef.current?.click()} style={{ width: '100%', padding: '14px', background: '#F9FAFB', border: '1.5px dashed #D1D5DB', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: '#9CA3AF', fontSize: '13px', fontWeight: '600' }}>
                                <Camera size={18} /> Tomar o seleccionar foto
                            </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoChange} />
                    </div>

                    {/* Checkbox obligatorio */}
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', background: confirmed ? '#ECFDF5' : '#F9FAFB', border: `1.5px solid ${confirmed ? '#10B981' : '#D1D5DB'}`, borderRadius: '14px', padding: '14px', cursor: 'pointer', marginBottom: '20px', transition: 'all 0.2s' }}>
                        <div style={{ flexShrink: 0, marginTop: '1px' }}>
                            {confirmed
                                ? <CheckCircle size={22} color="#10B981" />
                                : <div style={{ width: '22px', height: '22px', border: '2px solid #D1D5DB', borderRadius: '50%' }} />
                            }
                        </div>
                        <div>
                            <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ display: 'none' }} />
                            <span style={{ fontSize: '13px', fontWeight: '700', color: confirmed ? '#065F46' : '#374151', lineHeight: '1.5' }}>
                                Confirmo que este dinero ya fue introducido en mi alcancía física
                            </span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#6B7280' }}>
                                Este registro es solo de lo que ya guardaste, no de un compromiso futuro.
                            </p>
                        </div>
                    </label>

                    {error && (
                        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '12px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '13px', border: '1px solid #FCA5A5' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !confirmed || !amount}
                        style={{
                            width: '100%', padding: '16px',
                            backgroundColor: (!confirmed || !amount || isLoading) ? '#A7F3D0' : '#10B981',
                            color: (!confirmed || !amount || isLoading) ? '#065F46' : 'white',
                            border: 'none', borderRadius: '14px',
                            fontWeight: '800', fontSize: '16px',
                            cursor: (!confirmed || !amount || isLoading) ? 'not-allowed' : 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: (!confirmed || !amount || isLoading) ? 'none' : '0 4px 12px rgba(16,185,129,0.3)'
                        }}
                    >
                        {isLoading ? '⏳ Registrando...' : '💰 Registrar Aporte'}
                    </button>
                </form>
            </div>
        </div>
    );
}

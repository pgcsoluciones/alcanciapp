import React, { useState } from 'react';
import { X, PiggyBank, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';
import { fmtPigCoin } from '../lib/savingsCalc';

/**
 * AporteModal — Modal obligatorio para registrar un aporte.
 */
export default function AporteModal({ goal, onClose, onSuccess }) {
    const suggestedQuota = goal.quota || goal.target_amount / (goal.duration_months || 1);
    const currency = goal.currency || 'DOP';

    const [amount, setAmount] = useState(suggestedQuota ? String(Math.ceil(suggestedQuota)) : '');
    const [note, setNote] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    // Cálculo dinámico de PigCoins
    const amountNum = Number(amount) || 0;
    const pigCoinsEarned = suggestedQuota > 0 ? (amountNum / suggestedQuota) : 0;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (amountNum <= 0) {
            setError('Ingresa un monto válido.');
            return;
        }
        if (!confirmed) {
            setError('Debes confirmar el depósito físico.');
            return;
        }

        setIsLoading(true)
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const headers = { 'Authorization': `Bearer ${token}` };

            const res = await fetch(`${API_BASE_URL}/api/v1/goals/${goal.id}/transactions`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: amountNum,
                    note: note.trim(),
                    confirmed_physical: true,
                    evidence_url: null
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
        <div
            onClick={(e) => e.target === e.currentTarget && onClose()}
            style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 3000, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
        >
            <div style={{ backgroundColor: 'white', borderRadius: '32px 32px 0 0', padding: '24px', width: '100%', maxWidth: '480px', boxSizing: 'border-box', maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 -10px 40px rgba(0,0,0,0.2)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '14px' }}>
                            <PiggyBank size={24} color="#10B981" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827' }}>Registrar Aporte</h2>
                    </div>
                    <button onClick={onClose} style={{ background: '#F3F4F6', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={20} color="#374151" />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    {/* Monto Real -> PigCoin Feedback */}
                    <div style={{ marginBottom: '20px', background: '#F9FAFB', padding: '20px', borderRadius: '20px', border: '1px solid #E5E7EB' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '800', color: '#6B7280', marginBottom: '8px', textTransform: 'uppercase' }}>
                            Monto en {currency}
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                required
                                min="1"
                                style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '2.5px solid #10B981', fontSize: '28px', fontWeight: '900', color: '#111827', boxSizing: 'border-box', outline: 'none', background: 'white' }}
                            />
                            <div style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '900', color: '#10B981', fontSize: '18px' }}>
                                {currency}
                            </div>
                        </div>

                        {/* Conversión Visual a PigCoin */}
                        <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'white', borderRadius: '14px', border: '1px dashed #D1D5DB' }}>
                            <span style={{ fontSize: '13px', color: '#4B5563', fontWeight: '700' }}>Ganarás:</span>
                            <span style={{ fontSize: '18px', fontWeight: '900', color: '#111827', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {fmtPigCoin(pigCoinsEarned)}
                            </span>
                        </div>

                        {suggestedQuota > 0 && (
                            <button type="button" onClick={() => setAmount(String(Math.ceil(suggestedQuota)))} style={{ marginTop: '12px', background: 'none', border: 'none', color: '#10B981', fontSize: '12px', cursor: 'pointer', fontWeight: '800', padding: 0, textDecoration: 'underline' }}>
                                Usar cuota sugerida ({currency} {Math.ceil(suggestedQuota).toLocaleString()})
                            </button>
                        )}
                    </div>

                    {/* Nota */}
                    <div style={{ marginBottom: '16px' }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '6px' }}>
                            Nota opcional
                        </label>
                        <input
                            type="text"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            placeholder="¿De dónde viene este ahorro?"
                            maxLength={100}
                            style={{ width: '100%', padding: '14px 16px', borderRadius: '14px', border: '1px solid #E5E7EB', fontSize: '14px', color: '#374151', boxSizing: 'border-box', outline: 'none', background: '#F9FAFB' }}
                        />
                    </div>

                    {/* Confirmación Física Obligatoria */}
                    <div
                        onClick={() => setConfirmed(!confirmed)}
                        style={{ display: 'flex', alignItems: 'center', gap: '14px', background: confirmed ? '#ECFDF5' : '#FEF2F2', border: `2px solid ${confirmed ? '#10B981' : '#FCA5A5'}`, borderRadius: '20px', padding: '18px', cursor: 'pointer', marginBottom: '24px', transition: 'all 0.2s' }}
                    >
                        <div style={{ flexShrink: 0 }}>
                            {confirmed
                                ? <CheckCircle size={28} color="#10B981" />
                                : <AlertCircle size={28} color="#FCA5A5" />
                            }
                        </div>
                        <div>
                            <span style={{ fontSize: '14px', fontWeight: '900', color: confirmed ? '#065F46' : '#991B1B' }}>
                                Ya deposité el dinero físico
                            </span>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: confirmed ? '#059669' : '#B91C1C', opacity: 0.8 }}>
                                Confirma que el efectivo está seguro en tu alcancía.
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '14px', marginBottom: '20px', fontSize: '14px', border: '1px solid #FCA5A5', fontWeight: '700' }}>
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || !confirmed || !amount || Number(amount) <= 0}
                        style={{
                            width: '100%', padding: '20px',
                            backgroundColor: (isLoading || !confirmed || !amount) ? '#D1D5DB' : '#10B981',
                            color: 'white',
                            border: 'none', borderRadius: '18px',
                            fontWeight: '900', fontSize: '17px',
                            cursor: (isLoading || !confirmed || !amount) ? 'not-allowed' : 'pointer',
                            boxShadow: (isLoading || !confirmed || !amount) ? 'none' : '0 10px 25px rgba(16,185,129,0.3)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                        }}
                    >
                        {isLoading ? 'Registrando...' : 'Confirmar Depósito 💰'}
                    </button>
                    <p style={{ textAlign: 'center', fontSize: '11px', color: '#9CA3AF', marginTop: '16px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Acción irreversible • AlcanciApp V1
                    </p>
                </form>
            </div>
        </div>
    );
}

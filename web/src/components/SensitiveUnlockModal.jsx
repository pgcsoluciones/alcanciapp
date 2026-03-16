import React, { useState } from 'react';
import { Lock } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

export default function SensitiveUnlockModal({ isOpen, userEmail, onClose, onUnlock }) {
    const [verifyingStep, setVerifyingStep] = useState('request');
    const [verifyCode, setVerifyCode] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');

    if (!isOpen) return null;

    const handleClose = () => {
        setVerifyingStep('request');
        setVerifyCode('');
        setVerifyError('');
        setIsVerifying(false);
        onClose();
    };

    const handleRequestUnlockCode = async () => {
        if (!userEmail) {
            setVerifyError('No hay correo disponible para enviar el código');
            return;
        }

        setIsVerifying(true);
        setVerifyError('');
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/request-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail, type: 'unlock' })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al enviar código');
            setVerifyingStep('verify');
        } catch (err) {
            setVerifyError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    const handleVerifyUnlockCode = async () => {
        setIsVerifying(true);
        setVerifyError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/auth/verify-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ email: userEmail, token: verifyCode, isUnlock: true })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Código incorrecto');

            onUnlock(data.unlock_until);
            handleClose();
        } catch (err) {
            setVerifyError(err.message);
        } finally {
            setIsVerifying(false);
        }
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
            <div style={{ background: 'white', width: '100%', maxWidth: '340px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)', fontFamily: 'sans-serif' }}>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <div style={{ width: '50px', height: '50px', background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <Lock size={24} color="#10B981" />
                    </div>
                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827' }}>Validación de Seguridad</h3>
                    <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '6px', fontWeight: '600' }}>
                        {verifyingStep === 'request'
                            ? 'Para ver montos reales y aportes totales, enviaremos un código de seguridad a tu correo.'
                            : `Ingresa el código enviado a ${userEmail || 'tu correo'}`}
                    </p>
                </div>

                {verifyError && (
                    <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '12px', borderRadius: '12px', marginBottom: '16px', fontSize: '12px', textAlign: 'center' }}>
                        {verifyError}
                    </div>
                )}

                {verifyingStep === 'request' ? (
                    <button
                        onClick={handleRequestUnlockCode}
                        disabled={isVerifying}
                        style={{ width: '100%', background: '#10B981', color: 'white', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: '800', cursor: isVerifying ? 'not-allowed' : 'pointer', boxShadow: '0 8px 16px rgba(16,185,129,0.2)' }}
                    >
                        {isVerifying ? 'Enviando...' : 'Enviar Código al Correo'}
                    </button>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <input
                            type="number"
                            placeholder="Código"
                            value={verifyCode}
                            onChange={(e) => setVerifyCode(e.target.value)}
                            style={{ width: '100%', padding: '16px', borderRadius: '14px', border: '1px solid #E5E7EB', outline: 'none', fontSize: '24px', fontWeight: 'bold', boxSizing: 'border-box', textAlign: 'center' }}
                            autoFocus
                        />
                        <button
                            onClick={handleVerifyUnlockCode}
                            disabled={isVerifying || verifyCode.length < 6}
                            style={{ width: '100%', background: (isVerifying || verifyCode.length < 6) ? '#9CA3AF' : '#111827', color: 'white', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: '800', cursor: (isVerifying || verifyCode.length < 6) ? 'not-allowed' : 'pointer' }}
                        >
                            {isVerifying ? 'Verificando...' : 'Confirmar Código'}
                        </button>
                        <button
                            onClick={() => setVerifyingStep('request')}
                            style={{ background: 'none', border: 'none', color: '#10B981', fontSize: '13px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Reenviar código
                        </button>
                    </div>
                )}

                <button
                    onClick={handleClose}
                    style={{ width: '100%', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '13px', fontWeight: '700', padding: '12px', marginTop: '12px', cursor: 'pointer' }}
                >
                    Cancelar
                </button>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Mail, Key } from 'lucide-react';
import { AuthCard, AuthInput, AuthButton } from '../components/AuthCard';
import { API_BASE_URL } from '../lib/config';

export default function Login({ onLoginSuccess, onGoToRegister }) {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState('email'); // 'email' o 'token'
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [debugTokenHint, setDebugTokenHint] = useState('');

    const handleRequestToken = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim() || !email.includes('@')) {
            setError('Ingresa un correo electrónico válido.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/request-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase() })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || 'Error al solicitar token.');

            // TEMP QA/Testing: si el backend devuelve debug_token/debug_code,
            // lo mostramos y autocompletamos para pruebas internas.
            const qaDebugToken = data?.debug_token || data?.debug_code || '';
            setDebugTokenHint(qaDebugToken ? String(qaDebugToken) : '');
            setToken(qaDebugToken ? String(qaDebugToken) : '');
            setStep('token');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyToken = async (e) => {
        e.preventDefault();
        setError('');
        if (!token.trim()) {
            setError('Por favor, ingresa el código de 6 dígitos.');
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/verify-token`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.toLowerCase(), token })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || 'Código incorrecto o expirado.');

            onLoginSuccess(data.token, data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={step === 'email' ? handleRequestToken : handleVerifyToken}>
            <AuthCard
                title={step === 'email' ? "Acceso Mágico" : "Verifica tu cuenta"}
                subtitle={step === 'email' ? "Ingresa tu correo para recibir un código de acceso" : `Hemos enviado un código a ${email}`}
                error={error}
                footerText={step === 'email' ? "¿No tienes una cuenta?" : "¿No recibiste el código?"}
                footerActionText={step === 'email' ? "Regístrate aquí" : "Intentar de nuevo"}
                onFooterAction={step === 'email'
                    ? onGoToRegister
                    : () => {
                        setStep('email');
                        setToken('');
                        setDebugTokenHint('');
                    }
                }
            >
                {step === 'email' ? (
                    <AuthInput
                        label="Correo electrónico"
                        type="email"
                        placeholder="tucorreo@ejemplo.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        icon={Mail}
                    />
                ) : (
                    <>
                        <AuthInput
                            label="Código de 6 dígitos"
                            type="number"
                            placeholder="123456"
                            value={token}
                            onChange={(e) => setToken(e.target.value)}
                            icon={Key}
                        />
                        {debugTokenHint && (
                            <div style={{
                                marginTop: '12px',
                                fontSize: '12px',
                                color: '#065F46',
                                background: '#ECFDF5',
                                border: '1px solid #A7F3D0',
                                borderRadius: '10px',
                                padding: '10px 12px',
                                textAlign: 'center',
                                fontWeight: '600'
                            }}>
                                Código temporal de prueba: <strong>{debugTokenHint}</strong>
                            </div>
                        )}
                    </>
                )}

                <AuthButton isLoading={isLoading}>
                    {step === 'email' ? "Enviar Código" : "Ingresar a AlcanciApp"}
                </AuthButton>
            </AuthCard>
        </form>
    );
}

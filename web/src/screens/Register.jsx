import React, { useState } from 'react';
import { Mail, Key } from 'lucide-react';
import { AuthCard, AuthInput, AuthButton } from '../components/AuthCard';
import { API_BASE_URL } from '../lib/config';

export default function Register({ onLoginSuccess, onGoToLogin }) {
    const [email, setEmail] = useState('');
    const [token, setToken] = useState('');
    const [step, setStep] = useState('email');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

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
                body: JSON.stringify({ email: email.toLowerCase(), type: 'register' })
            });

            const data = await response.json();
            if (!response.ok || !data.ok) throw new Error(data.error || 'Error al solicitar código.');

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
            setError('Ingresa el código de 6 dígitos.');
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
                title="Crea tu Alcancía"
                subtitle={step === 'email' ? "Ingresa tu correo para empezar a ahorrar con PigCoins" : `Ingresa el código enviado a ${email}`}
                error={error}
                footerText={step === 'email' ? "¿Ya tienes una cuenta?" : "¿No recibiste el código?"}
                footerActionText={step === 'email' ? "Entra aquí" : "Intentar de nuevo"}
                onFooterAction={step === 'email' ? onGoToLogin : () => setStep('email')}
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
                    <AuthInput
                        label="Código de 6 dígitos"
                        type="number"
                        placeholder="123456"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        icon={Key}
                    />
                )}

                <AuthButton isLoading={isLoading}>
                    {step === 'email' ? "Empezar ahora" : "Comenzar a ahorrar"}
                </AuthButton>
            </AuthCard>
        </form>
    );
}

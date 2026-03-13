import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import { AuthCard, AuthInput, AuthButton } from '../components/AuthCard';
import { API_BASE_URL } from '../lib/config';

export default function Login({ onLoginSuccess, onGoToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password) {
            setError('Por favor, ingresa tu correo y contraseña.');
            return;
        }

        setIsLoading(true);

        try {
            // Actualmente la API solo soporta login anónimo / auth genérico para demo
            // Se envía este POST real para simular el inicio y obtener un token válido
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/anonymous`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (!response.ok || !data.ok) {
                throw new Error(data.error || 'Error al conectar con el servidor.');
            }

            // Exito: Guardar sesión
            onLoginSuccess(data.token, data.user);

        } catch (err) {
            setError(err.message || 'Error de conexión.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <AuthCard
                title="Bienvenido de nuevo"
                subtitle="Ingresa para ver el progreso de tus metas"
                error={error}
                footerText="¿No tienes una cuenta?"
                footerActionText="Regístrate"
                onFooterAction={onGoToRegister}
            >
                <AuthInput
                    label="Correo electrónico"
                    type="email"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    icon={Mail}
                />

                <AuthInput
                    label="Contraseña"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                />

                <AuthButton isLoading={isLoading}>
                    Iniciar Sesión
                </AuthButton>
            </AuthCard>
        </form>
    );
}

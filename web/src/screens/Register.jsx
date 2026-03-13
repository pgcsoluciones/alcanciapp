import React, { useState } from 'react';
import { User, Mail, Lock } from 'lucide-react';
import { AuthCard, AuthInput, AuthButton } from '../components/AuthCard';

export default function Register({ onGoToLogin }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [error, setError] = useState('');
    const [info, setInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setInfo('');

        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            setError('Por favor, completa todos los campos.');
            return;
        }

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);

        try {
            // Nota (Gap): La API actual solo tiene /auth/anonymous. 
            // Documentamos el comportamiento con un mensaje visual agradable.
            setTimeout(() => {
                setInfo('¡El registro formal estará disponible pronto! Por ahora inicia sesión para usar el Demo.');
                setIsLoading(false);
            }, 1000);

        } catch (err) {
            setError(err.message || 'Error al intentar registrarte.');
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <AuthCard
                title="Crea tu cuenta"
                subtitle="Comienza a ahorrar para lo que realmente importa"
                error={error}
                footerText="¿Ya tienes cuenta?"
                footerActionText="Inicia sesión"
                onFooterAction={onGoToLogin}
            >
                {info && (
                    <div style={{ background: '#E3F2FD', color: '#1565C0', padding: '12px', borderRadius: '12px', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                        {info}
                    </div>
                )}

                <AuthInput
                    label="Nombre"
                    type="text"
                    placeholder="¿Cómo te llamas?"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    icon={User}
                />

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
                    placeholder="Crea una contraseña segura"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    icon={Lock}
                />

                <AuthInput
                    label="Confirmar contraseña"
                    type="password"
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    icon={Lock}
                />

                <AuthButton isLoading={isLoading}>
                    Registrarme
                </AuthButton>
            </AuthCard>
        </form>
    );
}

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { ASSET } from '../lib/assets';
import { API_BASE_URL } from '../lib/config';
import { getProfileAchievements } from '../lib/savingsCalc';

const BADGE_CATALOG = [
    { code: 'first_goal', name: 'Ahorrador Novato', icon: 'badge_first_goal.png', description: '¡Primer paso dado! Bienvenido a la disciplina.' },
    { code: 'saving_sprint', name: 'Sprint de Ahorro', icon: 'badge_saving_sprint.png', description: 'Dos aportes en un solo día. ¡Qué energía!' },
    { code: 'budget_captain', name: 'Capitán del Presupuesto', icon: 'badge_budget_captain.png', description: 'Diste más de lo esperado. ¡Mente de tiburón!' },
    { code: 'iron_streak', name: 'Disciplina de Hierro', icon: 'badge_iron_streak.png', description: '3 meses consecutivos ahorrando sin falta.' },
    { code: 'savings_takeoff', name: 'Despegue', icon: 'badge_savings_takeoff.png', description: 'Has completado al menos el 25% de tus metas con objetivo.' },
    { code: 'vault_premium', name: 'Bóveda Premium', icon: 'badge_vault_premium.png', description: 'Has completado al menos la mitad de tus metas con objetivo.' },
    { code: 'steady_harvest', name: 'Cosecha Constante', icon: 'badge_steady_harvest.png', description: 'Has completado al menos el 75% de tus metas con objetivo.' },
    { code: 'grand_cup', name: 'Copa Gran Progreso', icon: 'badge_grand_progress_cup.png', description: 'Has completado todas tus metas con objetivo. Eres un maestro del ahorro.' },
];

export default function Achievements({ onBack }) {
    const [catalog] = useState(BADGE_CATALOG);
    const [userBadges, setUserBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBadges = async () => {
            setIsLoading(true);
            setError('');
            try {
                const token = localStorage.getItem('alcanciapp:token');
                const headers = { Authorization: `Bearer ${token}` };

                const [goalsRes, txsRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/v1/goals`, { headers }),
                    fetch(`${API_BASE_URL}/api/v1/transactions`, { headers })
                ]);

                const goalsData = await goalsRes.json();
                const txsData = await txsRes.json();

                if (!goalsRes.ok || !goalsData.ok) {
                    throw new Error(goalsData.error || 'Error al cargar metas');
                }
                if (!txsRes.ok || !txsData.ok) {
                    throw new Error(txsData.error || 'Error al cargar transacciones');
                }

                const goals = goalsData.goals || [];
                const transactions = txsData.transactions || [];

                const achievements = getProfileAchievements(goals, transactions) || [];
                const unlocked = achievements.map(a => ({ badge_code: a.id }));

                setUserBadges(unlocked);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        loadBadges();
    }, []);

    if (isLoading) {
        return (
            <div
                style={{
                    minHeight: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#6B7280'
                }}
            >
                Cargando tus logros...
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button
                        onClick={onBack}
                        style={{
                            background: 'white',
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            width: '40px',
                            height: '40px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                        }}
                    >
                        <ArrowLeft size={20} color="#374151" />
                    </button>

                    <div>
                        <h1 style={{ fontSize: '20px', margin: 0, fontWeight: '900', color: '#111827' }}>
                            Mis Insignias
                        </h1>
                        <p style={{ margin: 0, fontSize: '12px', color: '#6B7280', fontWeight: '600' }}>
                            Has desbloqueado {userBadges.length} de {catalog.length}
                        </p>
                    </div>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {catalog.map(badge => {
                        const isUnlocked = userBadges.some(ub => ub.badge_code === badge.code);

                        return (
                            <div
                                key={badge.code}
                                style={{
                                    background: 'white',
                                    borderRadius: '24px',
                                    padding: '24px 16px',
                                    textAlign: 'center',
                                    position: 'relative',
                                    border: isUnlocked ? '2px solid #10B981' : '1px solid #E5E7EB',
                                    boxShadow: isUnlocked ? '0 10px 20px rgba(16,185,129,0.1)' : 'none',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {!isUnlocked && (
                                    <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                                        <Lock size={14} color="#D1D5DB" />
                                    </div>
                                )}

                                <div
                                    style={{
                                        width: '80px',
                                        height: '80px',
                                        margin: '0 auto 16px',
                                        filter: isUnlocked ? 'none' : 'grayscale(1) opacity(0.5)',
                                        transition: 'all 0.3s ease'
                                    }}
                                >
                                    <img
                                        src={ASSET.badge(badge.icon)}
                                        alt={badge.name}
                                        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    />
                                </div>

                                <h3
                                    style={{
                                        fontSize: '14px',
                                        fontWeight: '900',
                                        color: isUnlocked ? '#111827' : '#9CA3AF',
                                        margin: '0 0 6px 0'
                                    }}
                                >
                                    {badge.name}
                                </h3>

                                <p
                                    style={{
                                        fontSize: '10px',
                                        color: isUnlocked ? '#059669' : '#D1D5DB',
                                        fontWeight: '700',
                                        margin: 0,
                                        lineHeight: '1.4'
                                    }}
                                >
                                    {badge.description}
                                </p>

                                {isUnlocked && (
                                    <div
                                        style={{
                                            marginTop: '12px',
                                            fontSize: '9px',
                                            fontWeight: '800',
                                            color: '#10B981',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.05em'
                                        }}
                                    >
                                        ¡Desbloqueado!
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { ASSET } from '../lib/assets';
import { API_BASE_URL } from '../lib/config';

const MASTER_BADGE_CATALOG = [
    { code: 'seed_brave', name: 'Semilla Valiente', description: 'Creaste el inicio de tu camino de ahorro.', icon: 'badge_seed_brave.png' },
    { code: 'startup_spark', name: 'Chispa Inicial', description: 'Encendiste tu impulso de ahorro.', icon: 'badge_startup_spark.png' },
    { code: 'first_contribution', name: 'Ahorrador Novato', description: 'Primera transacción válida en cualquier meta.', icon: 'badge_first_goal.png' },
    { code: 'daily_training', name: 'Entrenamiento Diario', description: 'Mantuviste disciplina diaria de ahorro.', icon: 'badge_daily_training.png' },
    { code: 'no_excuses', name: 'Sin Excusas', description: 'Seguiste aportando sin perder el enfoque.', icon: 'badge_no_excuses.png' },
    { code: 'streak_lifeline', name: 'Racha Salvavidas', description: 'Sostuviste una racha importante.', icon: 'badge_streak_lifeline.png' },
    { code: 'constancy_3', name: 'Constancia de Bronce', description: '3 cuotas cumplidas consecutivamente.', icon: 'badge_iron_streak.png' },
    { code: 'recovery', name: 'Subiendo de Nivel', description: 'Volviste al ritmo después de un retraso.', icon: 'badge_level_up.png' },
    { code: 'hitos_25', name: 'Despegue (25%)', description: 'Meta alcanzó el 25% de su objetivo.', icon: 'badge_savings_takeoff.png' },
    { code: 'goal_completed', name: 'Copa Gran Progreso', description: 'Lograste completar una meta importante.', icon: 'badge_grand_progress_cup.png' },
    { code: 'saving_champion', name: 'Campeón del Ahorro', description: 'Has demostrado dominio en tus logros.', icon: 'badge_saving_champion.png' },
    { code: 'hitos_50', name: 'Bóveda (50%)', description: 'Meta alcanzó el 50% de su objetivo.', icon: 'badge_vault_premium.png' },
    { code: 'punctual_5', name: 'Capitán del Presupuesto', description: '5 aportes consecutivos sin un solo día de atraso.', icon: 'badge_budget_captain.png' },
    { code: 'entrepreneur_titan', name: 'Titán Emprendedor', description: 'Llevaste tu constancia a un nivel superior.', icon: 'badge_entrepreneur_titan.png' },
    { code: 'farmer_pro_trophy', name: 'Trofeo Cosecha Pro', description: 'Tu progreso ya se ve como una cosecha sólida.', icon: 'badge_farmer_pro_trophy.png' },
    { code: 'hitos_75', name: 'Cosecha (75%)', description: 'Meta alcanzó el 75% de su objetivo.', icon: 'badge_steady_harvest.png' },
    { code: 'double_quota', name: 'Sprint de Ahorro', description: '2 cuotas registradas el mismo día.', icon: 'badge_saving_sprint.png' },
    { code: 'extreme_race', name: 'Carrera Extrema', description: 'Insignia aspiracional de alto rendimiento.', icon: 'badge_extreme_race.png' },
    { code: 'extreme_bmx', name: 'BMX Extremo', description: 'Insignia aspiracional de impulso extremo.', icon: 'badge_extreme_bmx.png' },
    { code: 'extreme_skydiving', name: 'Salto Extremo', description: 'Insignia aspiracional de valentía y ritmo.', icon: 'badge_extreme_skydiving.png' },
    { code: 'extreme_surf', name: 'Surf Extremo', description: 'Insignia aspiracional de equilibrio y avance.', icon: 'badge_extreme_surf.png' },
    { code: 'racha_10', name: 'Titán del Ahorro (10)', description: '10 aportes consecutivos sin atraso.', icon: 'badge_extreme_climb.png' }
];

function getUnlockedCodes(userBadges) {
    const codes = new Set();
    for (const badge of Array.isArray(userBadges) ? userBadges : []) {
        if (badge?.badge_code) codes.add(badge.badge_code);
    }
    return codes;
}

export default function Achievements({ onBack }) {
    const [userBadges, setUserBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBadges = async () => {
            setIsLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('alcanciapp:token');
                if (!token) throw new Error('No se encontró la sesión del usuario');

                const res = await fetch(`${API_BASE_URL}/api/v1/badges`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                if (!res.ok || !data.ok) {
                    throw new Error(data.error || 'Error al cargar insignias');
                }

                setUserBadges(data.user_badges || []);
            } catch (err) {
                setError(err.message || 'Error inesperado al cargar insignias');
            } finally {
                setIsLoading(false);
            }
        };

        loadBadges();
    }, []);

    const unlockedCodes = getUnlockedCodes(userBadges);
    const unlockedCount = MASTER_BADGE_CATALOG.filter(b => unlockedCodes.has(b.code)).length;
    const totalCount = MASTER_BADGE_CATALOG.length;

    if (isLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6B7280' }}>
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
                            Has desbloqueado {unlockedCount} de {totalCount}
                        </p>
                    </div>
                </div>

                {error && <div style={{ color: 'red', marginBottom: '16px' }}>{error}</div>}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    {MASTER_BADGE_CATALOG.map(badge => {
                        const isUnlocked = unlockedCodes.has(badge.code);

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

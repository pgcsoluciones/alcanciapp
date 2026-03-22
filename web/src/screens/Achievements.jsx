import React, { useState, useEffect } from 'react';
import { ArrowLeft, Lock } from 'lucide-react';
import { ASSET } from '../lib/assets';
import { API_BASE_URL } from '../lib/config';

const BADGE_ICON_MAP = {
    first_contribution: 'badge_first_goal.png',
    double_quota: 'badge_budget_captain.png',
    hitos_25: 'badge_savings_takeoff.png',
    hitos_50: 'badge_vault_premium.png',
    hitos_75: 'badge_steady_harvest.png',
    goal_completed: 'badge_grand_progress_cup.png',
    constancy_3: 'badge_iron_streak.png',
    constancy_7: 'badge_iron_streak.png',
    punctual_5: 'badge_iron_streak.png',
    racha_10: 'badge_iron_streak.png',
    recovery: 'badge_saving_sprint.png'
};

export default function Achievements({ onBack }) {
    const [catalog, setCatalog] = useState([]);
    const [userBadges, setUserBadges] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const loadBadges = async () => {
            setIsLoading(true);
            setError('');

            try {
                const token = localStorage.getItem('alcanciapp:token');
                if (!token) {
                    throw new Error('No se encontró la sesión del usuario');
                }

                const res = await fetch(`${API_BASE_URL}/api/v1/badges`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const data = await res.json();

                if (!res.ok || !data.ok) {
                    throw new Error(data.error || 'Error al cargar insignias');
                }

                const backendCatalog = (data.badges_catalog || []).map(badge => ({
                    code: badge.code,
                    name: badge.name,
                    description: badge.description || '',
                    icon: BADGE_ICON_MAP[badge.code] || 'badge_first_goal.png'
                }));

                setCatalog(backendCatalog);
                setUserBadges(data.user_badges || []);
            } catch (err) {
                setError(err.message || 'Error inesperado al cargar insignias');
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

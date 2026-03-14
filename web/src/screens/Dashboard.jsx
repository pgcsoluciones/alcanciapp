import React, { useState, useEffect } from 'react';
import { Plus, Target, Zap, TrendingUp, Award, Menu } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import EmptyGoalsState from '../components/EmptyGoalsState';
import { API_BASE_URL } from '../lib/config';
import { ASSET } from '../lib/assets';
import { getSuggestedQuota, getRhythmStatus, getFreqLabel, fmtRD } from '../lib/savingsCalc';

// ─── Sub-bloque: resumen inteligente del usuario ────────────────────────────
function DashboardInsights({ goals, onGoToDetail }) {
    if (goals.length === 0) return null;

    // Meta más avanzada (por % de progreso)
    const goalsWithTarget = goals.filter(g => g.target_amount > 0);
    const topGoal = goalsWithTarget.length > 0
        ? goalsWithTarget.reduce((best, g) => {
            const p = Number(g.total_saved || 0) / Number(g.target_amount);
            const bestP = Number(best.total_saved || 0) / Number(best.target_amount);
            return p > bestP ? g : best;
        }, goalsWithTarget[0])
        : null;

    // Suma de cuotas (usar la frecuencia de la primera meta como referencia; si son mixtas mostramos 'por período')
    const totalNextQuota = goals.reduce((sum, g) => sum + getSuggestedQuota(g), 0);
    const quotaLabel = goals.length === 1
        ? `por ${getFreqLabel(goals[0].frequency)}`
        : goals.every(g => getFreqLabel(g.frequency) === getFreqLabel(goals[0].frequency))
            ? `por ${getFreqLabel(goals[0].frequency)}`
            : 'por período';

    // Ritmo global: el peor ritmo entre todas las metas (con fallback a goal.total_saved)
    const rhythms = goals.map(g => getRhythmStatus(g, []));
    const hasBehind = rhythms.some(r => r.status === 'behind');
    const allNotStarted = rhythms.every(r => r.status === 'not_started' || r.status === 'no_target');
    const hasAhead = !hasBehind && rhythms.some(r => r.status === 'ahead');
    const allCompleted = rhythms.every(r => r.status === 'completed');

    const globalRhythm = allCompleted
        ? { label: 'Todas completadas', emoji: '🏆', color: '#059669', bg: '#ECFDF5' }
        : allNotStarted
            ? { label: 'Sin aportes aún', emoji: '🏁', color: '#6B7280', bg: '#F3F4F6' }
            : hasBehind
                ? { label: 'Atrasado en una meta', emoji: '⚠️', color: '#D97706', bg: '#FFFBEB' }
                : hasAhead
                    ? { label: 'Vas adelantado', emoji: '🚀', color: '#059669', bg: '#ECFDF5' }
                    : { label: 'Al día', emoji: '✅', color: '#2563EB', bg: '#EFF6FF' };

    return (
        <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#9CA3AF', fontWeight: '700', marginBottom: '14px' }}>
                Resumen de tu plan
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {/* Próxima cuota global */}
                {totalNextQuota > 0 && (
                    <div style={{ background: '#F9FAFB', borderRadius: '14px', padding: '14px', border: '1px solid #E5E7EB' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                            <Zap size={14} color="#10B981" />
                            <span style={{ fontSize: '11px', fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Cuota {quotaLabel}</span>
                        </div>
                        <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827' }}>{fmtRD(totalNextQuota)}</div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>suma de todas las metas</div>
                    </div>
                )}

                {/* Ritmo global */}
                <div style={{ background: globalRhythm.bg, borderRadius: '14px', padding: '14px', border: `1px solid ${globalRhythm.bg}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                        <TrendingUp size={14} color={globalRhythm.color} />
                        <span style={{ fontSize: '11px', fontWeight: '700', color: globalRhythm.color, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Ritmo</span>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: globalRhythm.color }}>{globalRhythm.emoji}</div>
                    <div style={{ fontSize: '11px', color: globalRhythm.color, marginTop: '2px', opacity: 0.8 }}>{globalRhythm.label}</div>
                </div>
            </div>

            {/* Meta más avanzada */}
            {topGoal && Number(topGoal.total_saved) > 0 && (
                <button
                    onClick={() => onGoToDetail(topGoal.id)}
                    style={{ marginTop: '12px', width: '100%', background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Award size={16} color="#F59E0B" />
                        <div>
                            <div style={{ fontSize: '12px', color: '#9CA3AF', fontWeight: '600' }}>Meta más avanzada</div>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: '#111827' }}>{topGoal.name}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '16px', fontWeight: '800', color: '#10B981' }}>
                        {Math.round((Number(topGoal.total_saved) / Number(topGoal.target_amount)) * 100)}%
                    </div>
                </button>
            )}
        </div>
    );
}

// ─── Dashboard Principal ────────────────────────────────────────────────────
export default function Dashboard({ user, onGoToCreate, onGoToDetail, onOpenMenu }) {
    const [goals, setGoals] = useState([]);
    const [userName, setUserName] = useState(user?.name || 'Ahorrador');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { loadGoals(); }, []);

    const loadGoals = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            setUserName(user?.name || 'Ahorrador');

            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar las metas');
            setGoals(data.goals || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Totales para el widget de balance
    const totalSavedAll = goals.reduce((acc, g) => acc + (Number(g.total_saved) || 0), 0);
    const totalTargetAll = goals.reduce((acc, g) => acc + (Number(g.target_amount) || 0), 0);
    const globalPercent = totalTargetAll > 0 ? Math.round((totalSavedAll / totalTargetAll) * 100) : null;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>

                {/* Navbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={ASSET.logo()} alt="AlcanciApp" style={{ height: '28px' }} />
                        <h1 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1a1a1a', margin: 0 }}>Alcancía</h1>
                    </div>
                    <button onClick={onOpenMenu} style={{ background: '#F3F4F6', border: 'none', color: '#4B5563', cursor: 'pointer', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Menu size={20} />
                    </button>
                </div>

                {error && (
                    <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                        <div style={{ marginTop: '8px' }}>
                            <button onClick={loadGoals} style={{ background: 'none', border: 'none', color: '#B91C1C', textDecoration: 'underline', cursor: 'pointer', fontWeight: 'bold' }}>Reintentar</button>
                        </div>
                    </div>
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '14px' }}>Cargando metas...</div>
                ) : goals.length === 0 ? (
                    <EmptyGoalsState onCreateClick={onGoToCreate} />
                ) : (
                    <>
                        {/* Saludo */}
                        <div style={{ marginBottom: '16px', paddingLeft: '4px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontSize: '22px', fontWeight: 'bold', color: '#111827', letterSpacing: '-0.02em' }}>Hola, {userName}</span> <span style={{ fontSize: '22px' }}>👋</span>
                                <p style={{ color: '#6B7280', fontSize: '13px', marginTop: '4px', marginBottom: 0 }}>Tu disciplina financiera está rindiendo frutos.</p>
                            </div>
                            <img
                                src={user?.avatar ? ASSET.mascot(user.avatar, 128) : ASSET.mascot('mascot_happy.png', 128)}
                                alt="Avatar"
                                style={{ width: '50px', height: '50px', borderRadius: '50%', border: '2px solid #10B981', padding: '2px', backgroundColor: 'white' }}
                            />
                        </div>

                        {/* Balance Global Widget */}
                        <div style={{ background: '#10B981', borderRadius: '20px', padding: '24px', color: 'white', marginBottom: '20px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', opacity: 0.9, marginBottom: '8px' }}>Balance Total Ahorrado</div>
                                <div style={{ fontSize: '34px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
                                    {fmtRD(totalSavedAll)}
                                </div>
                                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '14px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '3px' }}>Metas Activas</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{goals.length}</div>
                                    </div>
                                    {globalPercent !== null && (
                                        <div>
                                            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '3px' }}>Progreso Global</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{globalPercent}%</div>
                                        </div>
                                    )}
                                    {totalTargetAll > 0 && (
                                        <div>
                                            <div style={{ fontSize: '11px', opacity: 0.8, marginBottom: '3px' }}>Objetivo Total</div>
                                            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{fmtRD(totalTargetAll)}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
                        </div>

                        {/* Resumen Inteligente */}
                        <DashboardInsights goals={goals} onGoToDetail={onGoToDetail} />

                        {/* Meta Principal */}
                        {goals.length > 0 && (
                            <div style={{ marginBottom: '20px' }}>
                                <h2 style={{ fontSize: '15px', color: '#374151', fontWeight: '700', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px', paddingLeft: '4px' }}>
                                    <Target size={16} color="#10B981" /> Meta Principal
                                </h2>
                                <GoalCard goal={goals[0]} onClick={() => onGoToDetail(goals[0].id)} />
                                <button
                                    onClick={() => onGoToDetail(goals[0].id)}
                                    style={{ width: '100%', padding: '13px', backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer', marginTop: '-6px', fontSize: '14px' }}
                                >
                                    💰 Hacer Aporte
                                </button>
                            </div>
                        )}

                        {/* Otras metas */}
                        {goals.length > 1 && (
                            <>
                                <h2 style={{ fontSize: '15px', color: '#374151', fontWeight: '700', marginBottom: '10px', paddingLeft: '4px' }}>Otras Metas</h2>
                                {goals.slice(1).map(goal => (
                                    <GoalCard key={goal.id} goal={goal} onClick={() => onGoToDetail(goal.id)} />
                                ))}
                            </>
                        )}

                        {/* CTA Nueva Meta */}
                        <button
                            onClick={onGoToCreate}
                            style={{ width: '100%', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '16px', padding: '17px', fontSize: '15px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginTop: '20px', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)' }}
                        >
                            <Plus size={20} />
                            Nueva Meta
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

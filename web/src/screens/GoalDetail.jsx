import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, BarChart2, Bell, Share2, Users, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Zap, Award } from 'lucide-react';
import ContributionForm from '../components/ContributionForm';
import { API_BASE_URL } from '../lib/config';
import {
    getSuggestedQuota,
    getPeriodsTotal,
    getPeriodsElapsed,
    getPeriodsCompleted,
    getRhythmStatus,
    getStreakMonths,
    getAchievements,
    getMotivationalMessage,
    fmtRD,
} from '../lib/savingsCalc';

const iconMap = {
    'vacation': Plane,
    'house': Home,
    'motorcycle': Bike,
    'studies': GraduationCap,
    'gadgets': Laptop,
    'emergency': HeartPulse,
    'business': Briefcase,
};

// ─── Subcomponentes ─────────────────────────────────────────────────────────

function StatBox({ label, value, sub }) {
    return (
        <div style={{ background: '#F9FAFB', borderRadius: '12px', padding: '14px', textAlign: 'center', border: '1px solid #E5E7EB' }}>
            <div style={{ fontSize: '17px', fontWeight: '800', color: '#111827', letterSpacing: '-0.01em' }}>{value}</div>
            <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '600', marginTop: '3px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</div>
            {sub && <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>{sub}</div>}
        </div>
    );
}

function AchievementChip({ emoji, label }) {
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: '20px', padding: '5px 12px', fontSize: '12px', fontWeight: '600', color: '#92400E' }}>
            <span>{emoji}</span>{label}
        </div>
    );
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function GoalDetail({ goalId, onBack }) {
    const [goal, setGoal] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => { loadData(); }, [goalId]);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const [goalRes, txRes] = await Promise.all([
                fetch(`${API_BASE_URL}/api/v1/goals/${goalId}`, { headers }),
                fetch(`${API_BASE_URL}/api/v1/goals/${goalId}/transactions`, { headers })
            ]);
            const goalData = await goalRes.json();
            const txData = await txRes.json();
            if (!goalRes.ok || !goalData.ok) throw new Error(goalData.error || 'Error al cargar meta');
            if (!txRes.ok || !txData.ok) throw new Error(txData.error || 'Error al cargar historial');
            setGoal(goalData.goal);
            setTransactions(txData.transactions || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAporte = async ({ amount }) => {
        setIsSubmitting(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/goals/${goalId}/transactions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al registrar el aporte');
            const newTx = { ...data.transaction, created_at: new Date().toISOString() };
            setTransactions(prev => [newTx, ...prev]);
            // Actualizar total_saved localmente
            setGoal(prev => ({ ...prev, total_saved: (Number(prev.total_saved) || 0) + Number(amount) }));
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', color: '#6B7280' }}>Cargando detalles...</div>;
    }
    if (!goal) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
                <p style={{ color: '#4B5563', marginBottom: '16px' }}>No se encontró la meta.</p>
                <button onClick={onBack} style={{ padding: '12px 24px', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}>Volver</button>
            </div>
        );
    }

    // ─── Cálculos ──────────────────────────────────────────────────────────
    const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
    const totalSaved = Number(goal.total_saved || 0);
    const progressPercent = hasTarget ? Math.min((totalSaved / goal.target_amount) * 100, 100) : 0;
    const remaining = hasTarget ? Math.max(goal.target_amount - totalSaved, 0) : 0;
    const quota = getSuggestedQuota(goal);
    const periodsTotal = getPeriodsTotal(goal);
    const periodsElapsed = getPeriodsElapsed(goal);
    const periodsCompleted = getPeriodsCompleted(transactions, goal);
    const rhythm = getRhythmStatus(goal, transactions);
    const streak = getStreakMonths(transactions);
    const achievements = getAchievements(goal, transactions);
    const motivationalMsg = getMotivationalMessage(rhythm, progressPercent, streak);

    const freqLabel = (goal.frequency || 'mes').toLowerCase()
        .replace('mensual', 'mes').replace('semanal', 'semana')
        .replace('quincenal', 'quincena').replace('diario', 'día');
    const IconComponent = iconMap[goal.icon] || Target;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ArrowLeft size={20} color="#374151" />
                    </button>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 0 16px' }}>Detalle de Meta</h1>
                </div>

                {error && (
                    <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                        {error}
                    </div>
                )}

                {/* ─── Hero Card ─── */}
                <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 16px rgba(0,0,0,0.03)', marginBottom: '16px' }}>
                    {/* Nombre e Icono */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <IconComponent size={24} color="#4B5563" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '20px', margin: '0 0 4px 0', fontWeight: 'bold', color: '#111827' }}>{goal.name}</h2>
                                <p style={{ margin: 0, color: '#6B7280', fontSize: '13px' }}>{goal.duration_months} meses • {goal.frequency}</p>
                            </div>
                        </div>
                        <div style={{ background: rhythm.bg, color: rhythm.color, padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}>
                            {rhythm.emoji} {rhythm.label}
                        </div>
                    </div>

                    {/* Progreso */}
                    {hasTarget ? (
                        <>
                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>Progreso</div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '30px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                                        {fmtRD(totalSaved)}
                                    </span>
                                    <div style={{ backgroundColor: '#ECFDF5', color: '#10B981', padding: '3px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}>
                                        {Math.round(progressPercent)}%
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 100 ? '#059669' : '#10B981', borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', marginBottom: '16px' }}>
                                <span>Restante: <strong style={{ color: '#374151' }}>{fmtRD(remaining)}</strong></span>
                                <span>Objetivo: <strong style={{ color: '#374151' }}>{fmtRD(goal.target_amount)}</strong></span>
                            </div>

                            {/* Mensaje motivacional */}
                            <p style={{ margin: 0, fontSize: '13px', color: '#059669', textAlign: 'center', fontStyle: 'italic', backgroundColor: '#ECFDF5', padding: '10px 14px', borderRadius: '10px', fontWeight: '500' }}>
                                {motivationalMsg}
                            </p>
                        </>
                    ) : (
                        <div style={{ fontSize: '30px', fontWeight: '800', color: '#111827' }}>{fmtRD(totalSaved)}</div>
                    )}
                </div>

                {/* ─── Plan de Ahorro ─── */}
                {hasTarget && (
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '24px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <BarChart2 size={18} color="#10B981" />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#111827' }}>Plan de Ahorro</h3>
                        </div>

                        {/* Grid de estadísticas */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                            <StatBox
                                label={`Cuota / ${freqLabel}`}
                                value={fmtRD(quota)}
                            />
                            <StatBox
                                label="Períodos"
                                value={`${periodsCompleted} / ${periodsTotal}`}
                                sub="completados / totales"
                            />
                            <StatBox
                                label="Transcurridos"
                                value={periodsElapsed}
                                sub={`${freqLabel}s desde inicio`}
                            />
                            <StatBox
                                label="Racha"
                                value={streak > 0 ? `${streak} mes${streak !== 1 ? 'es' : ''}` : '—'}
                                sub={streak >= 3 ? '⚡ ¡Consistente!' : streak > 0 ? 'en curso' : 'sin racha aún'}
                            />
                        </div>

                        {/* Próxima cuota */}
                        {rhythm.status === 'behind' && (
                            <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Zap size={18} color="#D97706" />
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#92400E' }}>Aporte extra sugerido</div>
                                    <div style={{ fontSize: '12px', color: '#92400E', opacity: 0.8 }}>Un aporte de {fmtRD(quota)} te pone al día esta semana.</div>
                                </div>
                            </div>
                        )}

                        {rhythm.status === 'on_track' && (
                            <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <TrendingUp size={18} color="#2563EB" />
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1E40AF' }}>Próxima cuota sugerida</div>
                                    <div style={{ fontSize: '12px', color: '#1E40AF', opacity: 0.8 }}>{fmtRD(quota)} — ¡sigue así!</div>
                                </div>
                            </div>
                        )}

                        {rhythm.status === 'ahead' && (
                            <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Award size={18} color="#059669" />
                                <div>
                                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#065F46' }}>¡Vas adelantado! 🚀</div>
                                    <div style={{ fontSize: '12px', color: '#065F46', opacity: 0.8 }}>Puedes mantener el ritmo o hacer el siguiente aporte cuando quieras.</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ─── Logros ─── */}
                {achievements.length > 0 && (
                    <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '20px', padding: '20px', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                            <Award size={18} color="#F59E0B" />
                            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '700', color: '#111827' }}>Logros</h3>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                            {achievements.map(a => (
                                <AchievementChip key={a.id} emoji={a.emoji} label={a.label} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── CTA de Aporte ─── */}
                <ContributionForm onSubmit={handleAporte} isLoading={isSubmitting} />

                {/* ─── Futuras funciones (Placeholders) ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '16px' }}>
                    {[
                        { Icon: BarChart2, label: 'Estadísticas' },
                        { Icon: Bell, label: 'Avisos' },
                        { Icon: Users, label: 'Círculos' },
                        { Icon: Share2, label: 'Compartir' },
                    ].map(({ Icon, label }) => (
                        <button key={label} title="Próximamente" style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '14px 4px', borderRadius: '14px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#D1D5DB' }}>
                            <Icon size={20} style={{ marginBottom: '6px' }} />
                            <span style={{ fontSize: '10px', fontWeight: '600' }}>{label}</span>
                        </button>
                    ))}
                </div>

                {/* ─── Historial ─── */}
                <div style={{ marginTop: '28px' }}>
                    <h3 style={{ fontSize: '16px', color: '#111827', marginBottom: '14px', fontWeight: 'bold' }}>Historial de aportes</h3>
                    {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '28px 20px', background: 'white', borderRadius: '16px', color: '#6B7280', border: '1px dashed #D1D5DB', fontSize: '14px' }}>
                            Aún no hay transacciones. ¡Realiza tu primer aporte!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {transactions.map(tx => (
                                <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'white', padding: '14px 16px', borderRadius: '14px', boxShadow: '0 1px 3px rgba(0,0,0,0.02)', border: '1px solid #F3F4F6' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ background: '#ECFDF5', padding: '8px', borderRadius: '10px' }}>
                                            <TrendingUp size={18} color="#059669" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '14px' }}>Aporte</div>
                                            <div style={{ color: '#9CA3AF', fontSize: '12px', marginTop: '1px' }}>
                                                {new Date(tx.created_at || Date.now()).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '15px' }}>
                                        +{fmtRD(tx.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

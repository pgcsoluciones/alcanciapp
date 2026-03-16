import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, BarChart2, Bell, Share2, Users, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Zap, Award, Timer, Coins, Clock } from 'lucide-react';
import AporteModal from '../components/AporteModal';
import { API_BASE_URL } from '../lib/config';
import { ASSET } from '../lib/assets';
import {
    getSuggestedQuota,
    getPeriodsTotal,
    getPeriodsElapsed,
    getPeriodsCompleted,
    getRhythmStatus,
    getStreakMonths,
    getAchievements,
    getMotivationalMessage,
    getPigCoins,
    getPigCoinProgress,
    getCountdownStatus,
    fmtRD,
    fmtPigCoin,
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

function StatBox({ label, value, sub, color = '#111827' }) {
    return (
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', textAlign: 'center', border: '1px solid #F3F4F6', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '18px', fontWeight: '900', color, letterSpacing: '-0.02em' }}>{value}</div>
            <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '800', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
            {sub && <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '2px' }}>{sub}</div>}
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

function BadgeItem({ label, icon }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', width: '80px' }}>
            <div style={{ width: '64px', height: '64px', background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #DCFCE7', overflow: 'hidden' }}>
                <img src={ASSET.badge(icon)} alt={label} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#111827', textAlign: 'center', lineHeight: '1.2' }}>{label}</span>
        </div>
    );
}

// ─── Componente Principal ───────────────────────────────────────────────────

export default function GoalDetail({ goalId, isUnlocked, onUnlock, onBack }) {
    const [goal, setGoal] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [verifyPassword, setVerifyPassword] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [error, setError] = useState('');

    const handleAporteSuccess = (newTx) => {
        setTransactions(prev => [newTx, ...prev]);
        setGoal(prev => ({ ...prev, total_saved: (Number(prev.total_saved) || 0) + Number(newTx.amount) }));
        setShowModal(false);
    };

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

    // Password validation for Sensitive Unlock
    const handleVerifyPassword = async () => {
        setIsVerifying(true);
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/profile/verify-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ password: verifyPassword })
            });
            const data = await res.json();
            if (data.ok && data.unlock_until) {
                onUnlock(data.unlock_until);
                setShowPasswordModal(false);
            } else {
                alert(data.error || 'Contraseña incorrecta');
            }
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setIsVerifying(false);
            setVerifyPassword('');
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
    const currentTransactions = transactions || [];
    const totalSaved = Number(goal.total_saved || 0);
    const progressPercent = hasTarget ? Math.min((totalSaved / goal.target_amount) * 100, 100) : 0;
    const quota = getSuggestedQuota(goal);
    const rhythm = getRhythmStatus(goal, currentTransactions);
    const streak = getStreakMonths(currentTransactions);
    const achievements = getAchievements(goal, currentTransactions);
    const motivationalMsg = getMotivationalMessage(goal, currentTransactions);
    const pigCoins = getPigCoins(goal, currentTransactions);
    const pigProg = getPigCoinProgress(goal, currentTransactions);
    const countdown = getCountdownStatus(goal, currentTransactions);

    const freqLabel = (goal.frequency || 'Mensual').toLowerCase();
    const IconComponent = iconMap[goal.icon] || Target;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>

                {/* Header Dinámico */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <ArrowLeft size={20} color="#374151" />
                        </button>
                        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', margin: '0 0 0 16px' }}>Detalles</h1>
                    </div>
                </div>

                {/* Countdown / Reloj Contextual Visible */}
                {countdown.status !== 'idle' && (
                    <div style={{ background: countdown.status === 'on_track' ? '#ECFDF5' : '#FFFBEB', border: `1px solid ${countdown.status === 'on_track' ? '#D1FAE5' : '#FEF3C7'}`, color: countdown.status === 'on_track' ? '#065F46' : '#92400E', padding: '14px 18px', borderRadius: '18px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Clock size={20} color={countdown.status === 'on_track' ? '#10B981' : '#F59E0B'} />
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '10px', fontWeight: '800', textTransform: 'uppercase', opacity: 0.8, marginBottom: '2px' }}>Reloj de Disciplina</div>
                            <div style={{ fontSize: '14px', fontWeight: '800' }}>{countdown.label}</div>
                        </div>
                    </div>
                )}

                {error && (
                    <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                        {error}
                    </div>
                )}

                {/* ─── Hero Card PigCoin ─── */}
                <div style={{ background: 'linear-gradient(135deg, #ffffff 0%, #F0FDF4 100%)', border: '1px solid #E5E7EB', borderRadius: '24px', padding: '24px', boxShadow: '0 10px 25px rgba(0,0,0,0.04)', marginBottom: '16px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <div style={{ width: '56px', height: '56px', backgroundColor: 'white', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <IconComponent size={28} color="#10B981" />
                            </div>
                            <div>
                                <h2 style={{ fontSize: '22px', margin: '0 0 2px 0', fontWeight: '900', color: '#111827' }}>{goal.name}</h2>
                                <div style={{ background: rhythm.bg, color: rhythm.color, padding: '4px 8px', borderRadius: '8px', fontSize: '10px', fontWeight: '800', display: 'inline-block', textTransform: 'uppercase' }}>
                                    {rhythm.emoji} {rhythm.label}
                                </div>
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {fmtPigCoin(pigCoins).replace(' 🐷', '')} <span style={{ fontSize: '18px' }}>🐷</span>
                            </div>
                            <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total PigCoins</div>
                        </div>
                    </div>

                    {/* Progreso Visual */}
                    {hasTarget ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Equivalente Real</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em', filter: isUnlocked ? 'none' : 'blur(10px)', transition: 'filter 0.4s' }}>
                                        {isUnlocked ? fmtRD(totalSaved, goal.currency) : '---.---.--'}
                                    </div>
                                    {!isUnlocked && (
                                        <button
                                            onClick={() => setShowPasswordModal(true)}
                                            style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Lock size={12} /> DESBLOQUEAR MONTOS
                                        </button>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10B981' }}>{Math.round(progressPercent)}%</div>
                                    <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '700' }}>
                                        COMPLETADO
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: '6px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>

                            {/* Mensaje motivacional contextual */}
                            <div style={{ background: 'white', borderRadius: '16px', padding: '14px', border: '1px solid #DCFCE7', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '24px' }}>🐷</div>
                                <p style={{ margin: 0, fontSize: '13px', color: '#065F46', fontWeight: '600', lineHeight: '1.4' }}>
                                    {motivationalMsg}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div style={{ fontSize: '32px', fontWeight: '900', color: '#111827' }}>{isUnlocked ? fmtRD(totalSaved, goal.currency) : fmtPigCoin(pigCoins)}</div>
                    )}
                </div>

                {/* ─── Métricas de Gamificación ─── */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                    <StatBox
                        label="Ritmo Actual"
                        value={rhythm.label}
                        color={rhythm.color}
                        sub={rhythm.emoji}
                    />
                    <StatBox
                        label="Racha Activa"
                        value={streak > 0 ? `${streak} 🔥` : '—'}
                        sub="períodos seguidos"
                    />
                </div>

                {/* ─── Detalle de PigCoin ─── */}
                {hasTarget && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #F3F4F6', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Coins size={18} color="#10B981" />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>Acumulación Actual</h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            {/* Círculo de progreso fraccionado */}
                            <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0 }}>
                                <svg width="80" height="80" viewBox="0 0 80 80">
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                                    <circle cx="40" cy="40" r="34" fill="none" stroke="#10B981" strokeWidth="6"
                                        strokeDasharray={`${pigProg.completePercent * 2.13}, 213`}
                                        strokeDashoffset="0" transform="rotate(-90 40 40)"
                                        style={{ transition: 'stroke-dasharray 1s ease-out' }}
                                    />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '14px', fontWeight: '900', color: '#111827' }}>
                                    {pigProg.completePercent}%
                                </div>
                            </div>

                            <div>
                                <p style={{ margin: '0', fontSize: '13px', color: '#4B5563', lineHeight: '1.4' }}>
                                    Llevas ahorrados <strong style={{ color: '#111827' }}>{fmtPigCoin(pigProg.current)}</strong> de este PigCoin.
                                </p>
                            </div>
                        </div>

                        <div style={{ height: '1px', background: '#F3F4F6', margin: '20px 0' }} />

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <TrendingUp size={16} color="#9CA3AF" />
                                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600' }}>Cuota {freqLabel}:</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: '800', color: '#111827' }}>
                                {isUnlocked ? fmtRD(quota, goal.currency) : `1.00 🐷`}
                            </span>
                        </div>
                    </div>
                )}

                {/* ─── Insignias ─── */}
                {achievements.length > 0 && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #F3F4F6', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                            <Award size={18} color="#F59E0B" />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>Logros Ganados</h3>
                        </div>
                        <div style={{ display: 'flex', overflowX: 'auto', gap: '16px', paddingBottom: '8px' }}>
                            {achievements.map(a => (
                                <BadgeItem key={a.id} label={a.label} icon={a.icon} />
                            ))}
                        </div>
                    </div>
                )}

                {/* ─── CTA de Aporte ─── */}
                {progressPercent >= 100 ? (
                    <div style={{
                        background: 'linear-gradient(145deg, #ECFDF5 0%, #D1FAE5 100%)',
                        border: '2px solid #10B981',
                        borderRadius: '28px',
                        padding: '32px 24px',
                        textAlign: 'center',
                        marginTop: '20px',
                        boxShadow: '0 12px 30px rgba(16,185,129,0.15)',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'bounce 2s infinite' }}>🏆</div>
                            <h3 style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: '900', color: '#065F46', letterSpacing: '-0.03em' }}>¡Lo Lograste!</h3>
                            <p style={{ margin: '0 0 24px 0', fontSize: '15px', color: '#059669', fontWeight: '700', lineHeight: '1.5' }}>
                                Has completado tu meta con éxito. Tu disciplina es de otro planeta.
                            </p>
                            <button
                                onClick={onBack}
                                style={{ background: '#10B981', color: 'white', border: 'none', borderRadius: '16px', padding: '14px 28px', fontSize: '15px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 4px 12px rgba(16,185,129,0.2)' }}
                            >
                                Volver al Panel
                            </button>
                        </div>
                        {/* Círculos decorativos de fondo */}
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#10B981', opacity: 0.1, borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '120px', height: '120px', background: '#10B981', opacity: 0.05, borderRadius: '50%' }} />
                    </div>
                ) : (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ width: '100%', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '18px', padding: '20px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', marginTop: '16px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s ease' }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        💰 Hacer Aporte
                    </button>
                )}

                {/* ─── Historial ─── */}
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '16px', fontWeight: '900' }}>Historial del Plan</h3>
                    {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'white', borderRadius: '20px', color: '#9CA3AF', border: '2px dashed #F3F4F6', fontSize: '14px', fontWeight: '600' }}>
                            Inicia tu historial hoy mismo.
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {transactions.map(tx => (
                                <div key={tx.id} style={{ background: 'white', padding: '16px', borderRadius: '18px', border: '1px solid #F3F4F6', boxShadow: '0 2px 6px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ background: '#F0FDF4', padding: '10px', borderRadius: '12px' }}>
                                                <TrendingUp size={20} color="#10B981" />
                                            </div>
                                            <div>
                                                <div style={{ fontWeight: '800', color: '#111827', fontSize: '15px' }}>
                                                    Aporte {tx.confirmed_physical ? '📦' : ''}
                                                </div>
                                                <div style={{ color: '#9CA3AF', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', marginTop: '2px' }}>
                                                    {new Date(tx.created_at || Date.now()).toLocaleDateString('es-DO', { day: 'numeric', month: 'short' })}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: '900', color: '#10B981', fontSize: '17px' }}>
                                                {isUnlocked ? fmtRD(tx.amount, goal.currency) : fmtPigCoin(tx.amount / quota)}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '700' }}>
                                                {isUnlocked ? fmtPigCoin(tx.amount / quota) : 'PIGCOIN'}
                                            </div>
                                        </div>
                                    </div>
                                    {tx.note && (
                                        <div style={{ marginTop: '12px', padding: '10px 14px', background: '#F9FAFB', borderRadius: '12px', fontSize: '13px', color: '#4B5563', fontStyle: 'italic', border: '1px solid #F3F4F6' }}>
                                            "{tx.note}"
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de Aporte */}
            {showModal && (
                <AporteModal
                    goal={goal}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleAporteSuccess}
                />
            )}

            {/* Modal de Password Desbloqueo */}
            {showPasswordModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '340px', borderRadius: '28px', padding: '28px', boxSizing: 'border-box' }}>
                        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                            <div style={{ width: '56px', height: '56px', background: '#ECFDF5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                                <Lock size={26} color="#10B981" />
                            </div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '900', color: '#111827' }}>Validación Real</h3>
                            <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '8px', fontWeight: '600', lineHeight: '1.4' }}>Ingresa tu contraseña para ver montos financieros reales.</p>
                        </div>
                        <input
                            type="password"
                            placeholder="Tu contraseña"
                            value={verifyPassword}
                            onChange={(e) => setVerifyPassword(e.target.value)}
                            style={{ width: '100%', padding: '16px', borderRadius: '16px', border: '1.5px solid #E5E7EB', outline: 'none', fontSize: '16px', marginBottom: '16px', boxSizing: 'border-box', textAlign: 'center', background: '#F9FAFB' }}
                            autoFocus
                        />
                        <button
                            onClick={handleVerifyPassword}
                            disabled={isVerifying || !verifyPassword}
                            style={{ width: '100%', background: '#111827', color: 'white', border: 'none', borderRadius: '16px', padding: '16px', fontSize: '15px', fontWeight: '900', cursor: 'pointer' }}
                        >
                            {isVerifying ? 'Cargando...' : 'Confirmar'}
                        </button>
                        <button
                            onClick={() => { setShowPasswordModal(false); setVerifyPassword(''); }}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#9CA3AF', fontSize: '13px', fontWeight: '700', padding: '12px', marginTop: '8px', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}



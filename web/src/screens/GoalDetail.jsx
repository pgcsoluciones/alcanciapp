import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, BarChart2, Bell, Share2, Users, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Zap, Award, Timer, Coins, Clock, Lock } from 'lucide-react';
import AporteModal from '../components/AporteModal';
import SensitiveUnlockModal from '../components/SensitiveUnlockModal';
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
    getGoalProgress,
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

export default function GoalDetail({ goalId, isUnlocked, onUnlock, onHideAmounts, onBack }) {
    const [goal, setGoal] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showUnlockModal, setShowUnlockModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteNameInput, setDeleteNameInput] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [isArchiving, setIsArchiving] = useState(false);
    const [error, setError] = useState('');
    const userEmail = JSON.parse(localStorage.getItem('alcanciapp:user') || 'null')?.email;

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

    const handleDeleteGoal = async () => {
        if (!goal || deleteNameInput !== goal.name) return;

        setIsDeleting(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/goals/${goal.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo eliminar la meta');

            onBack();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleArchiveGoal = async () => {
        if (!goal) return;

        setIsArchiving(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/goals/${goal.id}/archive`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.ok) throw new Error(data.error || 'No se pudo archivar la meta');

            onBack();
        } catch (e) {
            setError(e.message);
        } finally {
            setIsArchiving(false);
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

    const targetAmountValue = Number(goal.target_amount || 0);
    const hasTarget = targetAmountValue > 0;
    const currentTransactions = transactions || [];
    const totalSaved = Number(goal.total_saved || 0);
    const progressPercent = getGoalProgress(goal, currentTransactions);
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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <ArrowLeft size={20} color="#374151" />
                        </button>
                        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#111827', margin: '0 0 0 16px' }}>Detalles</h1>
                    </div>
                </div>

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

                    {hasTarget ? (
                        <>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '10px' }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#6B7280', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Montos reales</div>
                                    <div style={{ fontSize: '32px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em', filter: isUnlocked ? 'none' : 'blur(10px)', transition: 'filter 0.4s' }}>
                                        {isUnlocked ? fmtRD(totalSaved, goal.currency) : '---.---.--'}
                                    </div>
                                    {!isUnlocked && (
                                        <button
                                            onClick={() => setShowUnlockModal(true)}
                                            style={{ background: '#F3F4F6', border: '1px solid #E5E7EB', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', color: '#4B5563', display: 'flex', alignItems: 'center', gap: '6px' }}
                                        >
                                            <Lock size={12} /> Ver montos reales
                                        </button>
                                    )}
                                    {isUnlocked && (
                                        <button
                                            onClick={onHideAmounts}
                                            style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '10px', padding: '8px 14px', fontSize: '11px', fontWeight: '800', cursor: 'pointer', marginTop: '10px', color: '#9A3412' }}
                                        >
                                            Ocultar montos
                                        </button>
                                    )}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10B981' }}>{progressPercent}%</div>
                                    <div style={{ fontSize: '10px', color: '#9CA3AF', fontWeight: '700' }}>
                                        COMPLETADA
                                    </div>
                                </div>
                            </div>
                            <div style={{ width: '100%', height: '12px', background: 'rgba(0,0,0,0.05)', borderRadius: '6px', overflow: 'hidden', marginBottom: '20px' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: 'linear-gradient(90deg, #059669, #10B981)', borderRadius: '6px', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
                            </div>

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

                {hasTarget && (
                    <div style={{ background: 'white', borderRadius: '24px', padding: '24px', border: '1px solid #F3F4F6', marginBottom: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                            <Coins size={18} color="#10B981" />
                            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#111827' }}>Acumulación Actual</h3>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
                            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏆</div>
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
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '100px', height: '100px', background: '#10B981', opacity: 0.1, borderRadius: '50%' }} />
                        <div style={{ position: 'absolute', bottom: '-40px', left: '-20px', width: '120px', height: '120px', background: '#10B981', opacity: 0.05, borderRadius: '50%' }} />
                    </div>
                ) : (
                    <button
                        onClick={() => setShowModal(true)}
                        style={{ width: '100%', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '18px', padding: '20px', fontSize: '17px', fontWeight: '900', cursor: 'pointer', marginTop: '16px', boxShadow: '0 8px 20px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', transition: 'all 0.2s ease' }}
                    >
                        💰 Hacer Aporte
                    </button>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                    {progressPercent >= 100 && (
                        <button
                            onClick={handleArchiveGoal}
                            disabled={isArchiving}
                            style={{ flex: 1, background: isArchiving ? '#D1D5DB' : '#111827', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: '800', cursor: isArchiving ? 'not-allowed' : 'pointer' }}
                        >
                            {isArchiving ? 'Archivando...' : 'Archivar meta'}
                        </button>
                    )}
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        style={{ flex: 1, background: '#FEF2F2', color: '#B91C1C', border: '1px solid #FCA5A5', borderRadius: '14px', padding: '14px', fontWeight: '800', cursor: 'pointer' }}
                    >
                        Eliminar meta
                    </button>
                </div>

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
                                                {isUnlocked ? fmtPigCoin(tx.amount / quota) : 'PigCoin'}
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

            {showModal && (
                <AporteModal
                    goal={goal}
                    onClose={() => setShowModal(false)}
                    onSuccess={handleAporteSuccess}
                />
            )}

            <SensitiveUnlockModal
                isOpen={showUnlockModal}
                userEmail={userEmail}
                onClose={() => setShowUnlockModal(false)}
                onUnlock={onUnlock}
            />

            {showDeleteModal && goal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(10px)', zIndex: 2500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
                    <div style={{ background: 'white', width: '100%', maxWidth: '360px', borderRadius: '24px', padding: '24px', boxSizing: 'border-box' }}>
                        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '900', color: '#111827' }}>Eliminar meta</h3>
                        <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '10px', lineHeight: '1.4' }}>
                            Escribe exactamente <strong>{goal.name}</strong> para confirmar.
                        </p>
                        <input
                            type='text'
                            value={deleteNameInput}
                            onChange={(e) => setDeleteNameInput(e.target.value)}
                            style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #E5E7EB', boxSizing: 'border-box', marginTop: '8px', marginBottom: '12px' }}
                            autoFocus
                        />
                        <button
                            onClick={handleDeleteGoal}
                            disabled={isDeleting || deleteNameInput !== goal.name}
                            style={{ width: '100%', background: (isDeleting || deleteNameInput !== goal.name) ? '#D1D5DB' : '#DC2626', color: 'white', border: 'none', borderRadius: '14px', padding: '14px', fontWeight: '800', cursor: (isDeleting || deleteNameInput !== goal.name) ? 'not-allowed' : 'pointer' }}
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar definitivamente'}
                        </button>
                        <button
                            onClick={() => { setShowDeleteModal(false); setDeleteNameInput(''); }}
                            style={{ width: '100%', background: 'none', border: 'none', color: '#9CA3AF', padding: '10px', marginTop: '8px', fontWeight: '700', cursor: 'pointer' }}
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Plus, Target, Zap, TrendingUp, Award, Menu, Coins } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import EmptyGoalsState from '../components/EmptyGoalsState';
import SensitiveUnlockModal from '../components/SensitiveUnlockModal';
import { API_BASE_URL } from '../lib/config';
import { ASSET } from '../lib/assets';
import { getRhythmStatus, fmtRD, getPigCoins, getAchievements, fmtPigCoin } from '../lib/savingsCalc';

// ─── Sub-bloque: resumen inteligente del usuario ────────────────────────────
// ─── Sub-bloque: resumen inteligente del usuario ────────────────────────────
function DashboardInsights({ goals, transactions, onGoToDetail }) {
    if (goals.length === 0) return null;

    // Meta más avanzada (por % de progreso)
    const getProgressRatio = (goal) => {
        const saved = Number(goal?.total_saved || 0);
        const target = Number(goal?.target_amount || 0);
        if (!Number.isFinite(saved) || !Number.isFinite(target) || target <= 0) return 0;
        return saved / target;
    };

    const topGoal = goals.reduce((best, g) => {
        const p = getProgressRatio(g);
        const bestP = getProgressRatio(best);
        return p > bestP ? g : best;
    }, goals[0]);

    // Cuota Global en PigCoins (Sumatoria de lo que representa 1 cuota de cada meta)
    const totalNextPigCoins = goals.length; // 1 PC por cada meta activa

    // Ritmo global
    const rhythms = goals.map(g => getRhythmStatus(g, transactions.filter(t => t.goal_id === g.id)));
    const hasBehind = rhythms.some(r => r.status === 'behind');
    const allNotStarted = rhythms.every(r => r.status === 'not_started' || r.status === 'no_target');
    const hasAhead = rhythms.some(r => r.status === 'ahead');
    const allCompleted = rhythms.every(r => r.status === 'completed');

    const globalRhythm = allCompleted
        ? { label: '¡Eres un crack!', emoji: '🏆', color: '#059669', bg: '#ECFDF5' }
        : allNotStarted
            ? { label: 'Paso a paso', emoji: '🏁', color: '#6B7280', bg: '#F3F4F6' }
            : hasBehind
                ? { label: 'Ponte al día', emoji: '⚠️', color: '#D97706', bg: '#FFFBEB' }
                : hasAhead
                    ? { label: 'Vas volando', emoji: '🚀', color: '#059669', bg: '#ECFDF5' }
                    : { label: 'Buen ritmo', emoji: '✅', color: '#2563EB', bg: '#EFF6FF' };

    return (
        <div style={{ background: 'white', border: '1px solid #F3F4F6', borderRadius: '24px', padding: '24px', marginBottom: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#9CA3AF', fontWeight: '800', marginBottom: '16px' }}>
                Insights de Ahorro
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{ background: '#F9FAFB', borderRadius: '18px', padding: '16px', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <Zap size={14} color="#10B981" />
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#6B7280', textTransform: 'uppercase' }}>Próximo Reto</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: '#111827' }}>{totalNextPigCoins.toFixed(2)} 🐷</div>
                    <div style={{ fontSize: '10px', color: '#9CA3AF', marginTop: '4px', fontWeight: '600' }}>Inversión en disciplina</div>
                </div>

                <div style={{ background: globalRhythm.bg, borderRadius: '18px', padding: '16px', border: `1px solid ${globalRhythm.bg}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <TrendingUp size={14} color={globalRhythm.color} />
                        <span style={{ fontSize: '10px', fontWeight: '800', color: globalRhythm.color, textTransform: 'uppercase' }}>Estado</span>
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: '900', color: globalRhythm.color }}>{globalRhythm.emoji}</div>
                    <div style={{ fontSize: '10px', color: globalRhythm.color, marginTop: '4px', fontWeight: '700', opacity: 0.8 }}>{globalRhythm.label}</div>
                </div>
            </div>

            {topGoal && (
                <button
                    onClick={() => onGoToDetail(topGoal.id)}
                    style={{ marginTop: '16px', width: '100%', background: '#F0FDF4', border: '1px solid #DCFCE7', borderRadius: '18px', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'all 0.2s ease' }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Award size={18} color="#10B981" />
                        <div>
                            <div style={{ fontSize: '10px', color: '#059669', fontWeight: '800', textTransform: 'uppercase' }}>Meta Líder</div>
                            <div style={{ fontSize: '15px', fontWeight: '900', color: '#111827' }}>{topGoal.name}</div>
                        </div>
                    </div>
                    <div style={{ fontSize: '20px', fontWeight: '900', color: '#10B981' }}>
                        {Math.round(getProgressRatio(topGoal) * 100)}%
                    </div>
                </button>
            )}
        </div>
    );
}

// ─── Dashboard Principal ────────────────────────────────────────────────────
export default function Dashboard({ user, isUnlocked, onUnlock, onHideAmounts, onGoToCreate, onGoToDetail, onOpenMenu, onLogout, onNavigate }) {
    const [goals, setGoals] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const headers = { 'Authorization': `Bearer ${token}` };
            const goalsRes = await fetch(`${API_BASE_URL}/api/v1/goals`, { headers });
            const goalsData = await goalsRes.json();

            if (!goalsRes.ok || !goalsData.ok) throw new Error(goalsData.error || 'Error en metas');
            setGoals(goalsData.goals || []);

            const txsRes = await fetch(`${API_BASE_URL}/api/v1/transactions`, { headers });
            const txsData = await txsRes.json().catch(() => ({}));

            if (txsRes.ok && txsData.ok) {
                setTransactions(txsData.transactions || []);
            } else {
                console.warn('No se pudieron cargar transacciones:', txsData.error || txsRes.statusText);
                setTransactions([]);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // Cálculos Gamificados Protegidos
    const validGoals = Array.isArray(goals) ? goals : [];
    const validTransactions = Array.isArray(transactions) ? transactions : [];

    const activeGoals = validGoals.filter((g) => {
        const target = Number(g?.target_amount || 0);
        const saved = Number(g?.total_saved || 0);
        if (!Number.isFinite(target) || target <= 0) return true;
        return saved < target;
    });

    // Total ahorrado consolidado (solo metas activas para KPI principal)
    const currencies = [...new Set(activeGoals.map(g => g.currency || 'DOP'))];
    const showTotalInUSD = currencies.length === 1 && currencies[0] === 'USD';
    const totalSavedAll = activeGoals.reduce((acc, g) => acc + (Number(g.total_saved) || 0), 0);

    const totalPigCoins = activeGoals.reduce((acc, g) => {
        const goalTxs = validTransactions.filter(t => t && t.goal_id === g.id);
        const pc = getPigCoins(g, goalTxs);
        return acc + (isNaN(pc) ? 0 : pc);
    }, 0);

    // Obtener insignias reales
    const allBadges = [];
    validGoals.forEach(g => {
        const goalTxs = validTransactions.filter(t => t && t.goal_id === g.id);
        const achievements = getAchievements(g, goalTxs);
        if (Array.isArray(achievements)) {
            achievements.forEach(a => {
                if (a && !allBadges.find(b => b.id === a.id)) {
                    allBadges.push(a);
                }
            });
        }
    });
    const recentBadges = [...allBadges].reverse().slice(0, 5);

    const [showUnlockModal, setShowUnlockModal] = useState(false);


    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>

                {/* Navbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '14px 20px', borderRadius: '18px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)', border: '1px solid #F3F4F6' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={ASSET.logo()} alt="AlcanciApp" style={{ height: '36px' }} />
                        <h1 style={{ fontSize: '20px', fontWeight: '900', color: '#10B981', margin: 0, letterSpacing: '-0.02em' }}>AlcanciApp</h1>
                    </div>
                    <button onClick={onOpenMenu} style={{ background: '#F9FAFB', border: '1px solid #F3F4F6', color: '#4B5563', cursor: 'pointer', padding: '10px', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Menu size={22} />
                    </button>
                </div>

                {error && (
                    <div style={{ background: '#FEF2F2', color: '#B91C1C', padding: '16px', borderRadius: '16px', marginBottom: '20px', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                        {error}
                        <button onClick={loadData} style={{ display: 'block', marginTop: '8px', background: 'none', border: 'none', color: '#B91C1C', textDecoration: 'underline', cursor: 'pointer', fontWeight: '900' }}>Reintentar</button>
                    </div>
                )}

                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '60px', color: '#9CA3AF', fontSize: '15px', fontWeight: '700' }}>Cargando tu panel...</div>
                ) : validGoals.length === 0 ? (
                    <EmptyGoalsState onCreateClick={onGoToCreate} />
                ) : (
                    <>
                        {/* Saludo con Avatar */}
                        <div style={{ marginBottom: '24px', padding: '0 8px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img
                                src={user && user.avatar ? ASSET.avatar(user.avatar, 128) : ASSET.avatar('1.png', 128)}
                                alt="Avatar"
                                style={{ width: '68px', height: '68px', borderRadius: '50%', border: '3px solid #10B981', padding: '4px', backgroundColor: 'white', flexShrink: 0, boxShadow: '0 4px 12px rgba(16,185,129,0.1)' }}
                            />
                            <div>
                                <div style={{ fontSize: '24px', fontWeight: '900', color: '#111827', letterSpacing: '-0.03em' }}>
                                    ¡Hola, {user?.name || 'Ahorrador'}! 👋
                                </div>
                                <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px', marginBottom: 0, fontWeight: '600' }}>
                                    Tu progreso de ahorro: <strong style={{ color: '#10B981' }}>{fmtPigCoin(totalPigCoins)}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Balance Global Gamificado */}
                        <div style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', borderRadius: '24px', padding: '26px', color: 'white', marginBottom: '24px', boxShadow: '0 12px 30px rgba(16, 185, 129, 0.25)', position: 'relative', overflow: 'hidden' }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', opacity: 0.9, marginBottom: '8px' }}>PigCoins acumulados en metas activas</div>
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', marginBottom: '18px' }}>
                                    <div style={{ fontSize: '42px', fontWeight: '900', lineHeight: 1 }}>{fmtPigCoin(totalPigCoins).replace(' 🐷', '')}</div>
                                    <div style={{ fontSize: '28px', marginBottom: '4px' }}>🐷</div>
                                </div>
                                <div style={{ display: 'flex', gap: '24px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '18px' }}>
                                    <div onClick={() => isUnlocked ? null : setShowUnlockModal(true)} style={{ cursor: isUnlocked ? 'default' : 'pointer' }}>
                                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', fontWeight: '800', textTransform: 'uppercase' }}>Montos reales</div>
                                        <div style={{ fontWeight: '900', fontSize: '16px', textDecoration: isUnlocked ? 'none' : 'underline dashed', textUnderlineOffset: '4px' }}>
                                            {isUnlocked ? fmtRD(totalSavedAll, showTotalInUSD ? 'USD' : 'DOP') : '🔒 Ver montos reales'}
                                        </div>
                                        {isUnlocked && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onHideAmounts(); }}
                                                style={{ marginTop: '8px', background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', borderRadius: '10px', padding: '6px 10px', fontSize: '10px', fontWeight: '800', cursor: 'pointer' }}
                                            >
                                                Ocultar montos
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '3px', fontWeight: '800', textTransform: 'uppercase' }}>Insignias</div>
                                        <div style={{ fontWeight: '900', fontSize: '16px' }}>{allBadges.length}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.1 }}>
                                <Coins size={140} color="white" />
                            </div>
                        </div>

                        {/* Resumen Inteligente */}
                        <DashboardInsights goals={activeGoals} transactions={validTransactions} onGoToDetail={onGoToDetail} />

                        {/* Insignias Recientes */}
                        {recentBadges.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', padding: '0 4px' }}>
                                    <h2 style={{ fontSize: '15px', color: '#111827', fontWeight: '900', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <Award size={18} color="#F59E0B" /> Logros Recientes
                                    </h2>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '10px' }}>
                                    {recentBadges.map(b => (
                                        <div key={b.id} style={{ flexShrink: 0, width: '64px', height: '64px', background: 'white', borderRadius: '50%', border: '2px solid #FEF3C7', padding: '2px', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <img src={ASSET.badge(b.icon)} alt={b.label} style={{ width: '85%', height: '85%', objectFit: 'contain' }} />
                                        </div>
                                    ))}
                                    <button onClick={() => onNavigate('achievements')} style={{ flexShrink: 0, width: '64px', height: '64px', background: '#F3F4F6', borderRadius: '50%', border: '2px dashed #D1D5DB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                                        <Plus size={24} color="#9CA3AF" />
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Listado de Metas */}
                        <div style={{ marginBottom: '12px', paddingLeft: '4px' }}>
                            <h2 style={{ fontSize: '17px', color: '#111827', fontWeight: '900' }}>Tus Planes</h2>
                        </div>
                        {validGoals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                isUnlocked={isUnlocked}
                                goal={{ ...goal, _transactions: validTransactions.filter(t => t.goal_id === goal.id) }}
                                onClick={() => onGoToDetail(goal.id)}
                            />
                        ))}

                        {/* CTA Nueva Meta */}
                        <button
                            onClick={onGoToCreate}
                            style={{ width: '100%', backgroundColor: '#10B981', color: 'white', border: 'none', borderRadius: '20px', padding: '18px', fontSize: '16px', fontWeight: '900', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', marginTop: '16px', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', transition: 'transform 0.2s ease' }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <Plus size={22} />
                            Crear Nueva Meta
                        </button>
                    </>
                )}
            </div>

            <SensitiveUnlockModal
                isOpen={showUnlockModal}
                userEmail={user?.email}
                onClose={() => setShowUnlockModal(false)}
                onUnlock={onUnlock}
            />
        </div>
    );
}

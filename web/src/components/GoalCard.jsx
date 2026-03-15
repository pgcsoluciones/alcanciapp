import { Clock, Lock, Globe, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Target, TrendingUp, Timer } from 'lucide-react';
import { getSuggestedQuota, getRhythmStatus, fmtRD, getPigCoins, getCountdownStatus, fmtPigCoin } from '../lib/savingsCalc';

const iconMap = {
    'vacation': Plane,
    'house': Home,
    'motorcycle': Bike,
    'studies': GraduationCap,
    'gadgets': Laptop,
    'emergency': HeartPulse,
    'business': Briefcase,
};

export default function GoalCard({ goal, isUnlocked, onClick }) {
    const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
    const totalSaved = Number(goal.total_saved || 0);
    const progressPercent = hasTarget ? Math.min((totalSaved / goal.target_amount) * 100, 100) : 0;
    const IconComponent = iconMap[goal.icon] || Target;

    const transactions = goal._transactions || [];
    const rhythm = hasTarget ? getRhythmStatus(goal, transactions) : null;
    const pigCoins = hasTarget ? getPigCoins(goal, transactions) : 0;
    const countdown = getCountdownStatus(goal, transactions);

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                padding: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                marginBottom: '16px',
                cursor: 'pointer',
                border: '1px solid #F3F4F6',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                position: 'relative',
                overflow: 'hidden'
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(-3px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Countdown Floating Tag */}
            {countdown.status !== 'idle' && (
                <div style={{ position: 'absolute', top: 0, right: 0, background: countdown.status === 'on_track' ? '#10B981' : '#F59E0B', color: 'white', padding: '4px 12px', fontSize: '10px', fontWeight: '800', borderBottomLeftRadius: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Timer size={10} />
                    {countdown.label.includes('vence en') ? countdown.label.split('vence en')[1].trim() : countdown.status.toUpperCase()}
                </div>
            )}

            {/* Header: Icono + Nombre + Estado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '48px', height: '48px', backgroundColor: '#F0FDF4', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <IconComponent size={24} color="#10B981" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 2px 0', fontSize: '17px', color: '#111827', fontWeight: '800' }}>{goal.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#6B7280', fontSize: '11px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                <Clock size={10} /> {goal.duration_months}m
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                                {goal.privacy === 'Privada' ? <Lock size={10} /> : <Globe size={10} />} {goal.privacy}
                            </span>
                        </div>
                    </div>
                </div>

                {rhythm && rhythm.status !== 'no_target' && (
                    <div style={{ background: rhythm.bg, color: rhythm.color, padding: '5px 10px', borderRadius: '10px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
                        {rhythm.emoji} {rhythm.label}
                    </div>
                )}
            </div>

            {/* Progreso y PigCoins */}
            {hasTarget ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                        <div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>
                                {fmtPigCoin(pigCoins)}
                            </div>
                            <div style={{ color: '#10B981', fontSize: '12px', fontWeight: '700', marginTop: '2px', opacity: 0.8 }}>
                                {isUnlocked ? fmtRD(totalSaved, goal.currency) : 'Total PigCoins'}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#9CA3AF', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>Objetivo</span>
                            <div style={{ fontSize: '18px', fontWeight: '900', color: '#10B981' }}>
                                {Math.round(progressPercent)}%
                            </div>
                        </div>
                    </div>

                    {/* Barra de progreso con gradiente */}
                    <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', marginBottom: '16px' }}>
                        <div style={{
                            width: `${progressPercent}%`,
                            height: '100%',
                            background: progressPercent >= 100 ? 'linear-gradient(90deg, #059669, #10B981)' : 'linear-gradient(90deg, #10B981, #34D399)',
                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                            borderRadius: '4px'
                        }} />
                    </div>

                    {/* Footer con cuota y frecuencia */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#F9FAFB', borderRadius: '12px', border: '1px solid #F3F4F6' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <TrendingUp size={14} color="#10B981" />
                            <span style={{ fontSize: '11px', color: '#4B5563', fontWeight: '600' }}>
                                Cuota: <span style={{ color: '#111827', fontWeight: '800' }}>1.00 🐷</span>
                            </span>
                        </div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#9CA3AF', textTransform: 'uppercase' }}>
                            {goal.frequency || 'Mensual'}
                        </span>
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>
                    {fmtPigCoin(totalSaved / (goal.target_amount || 250))}
                </div>
            )}
        </div>
    );
}

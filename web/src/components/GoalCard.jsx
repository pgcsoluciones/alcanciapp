import React from 'react';
import { Clock, Lock, Globe, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Target, TrendingUp } from 'lucide-react';
import { getSuggestedQuota, getRhythmStatus, fmtRD } from '../lib/savingsCalc';

const iconMap = {
    'vacation': Plane,
    'house': Home,
    'motorcycle': Bike,
    'studies': GraduationCap,
    'gadgets': Laptop,
    'emergency': HeartPulse,
    'business': Briefcase,
};

export default function GoalCard({ goal, onClick }) {
    const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
    const totalSaved = Number(goal.total_saved || 0);
    const progressPercent = hasTarget ? Math.min((totalSaved / goal.target_amount) * 100, 100) : 0;
    const IconComponent = iconMap[goal.icon] || Target;

    // Cálculos con savingsCalc (sin transactions en la card — usamos solo lo disponible)
    const quota = hasTarget ? getSuggestedQuota(goal) : 0;
    // Para el ritmo en la card usamos data simplificada (sin historial completo)
    const rhythm = hasTarget && goal.total_saved !== undefined
        ? getRhythmStatus(goal, goal._transactions || [])
        : null;

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '16px',
                cursor: 'pointer',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.06)';
                e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
            }}
        >
            {/* Header: Icono + Nombre + Estado */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '44px', height: '44px', backgroundColor: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <IconComponent size={22} color="#4B5563" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '16px', color: '#111827', fontWeight: 'bold' }}>{goal.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#9CA3AF', fontSize: '12px' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <Clock size={12} /> {goal.duration_months}m
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {goal.privacy === 'Privada' ? <Lock size={12} /> : <Globe size={12} />} {goal.privacy}
                            </span>
                            <span>•</span>
                            <span>{goal.frequency || 'Mensual'}</span>
                        </div>
                    </div>
                </div>

                {/* Badge de ritmo si tenemos datos suficientes */}
                {rhythm && rhythm.status !== 'no_target' ? (
                    <div style={{ background: rhythm.bg, color: rhythm.color, padding: '4px 8px', borderRadius: '8px', fontSize: '11px', fontWeight: '700', flexShrink: 0, whiteSpace: 'nowrap' }}>
                        {rhythm.emoji} {rhythm.label}
                    </div>
                ) : (
                    <div style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '600' }}>
                        Activa
                    </div>
                )}
            </div>

            {/* Progreso */}
            {hasTarget ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                            {fmtRD(totalSaved)}
                        </span>
                        <div style={{ textAlign: 'right' }}>
                            <span style={{ color: '#9CA3AF', fontSize: '12px' }}>de {fmtRD(goal.target_amount)}</span>
                            <span style={{ marginLeft: '8px', fontSize: '13px', fontWeight: '700', color: '#10B981' }}>
                                {Math.round(progressPercent)}%
                            </span>
                        </div>
                    </div>

                    {/* Barra de progreso */}
                    <div style={{ width: '100%', height: '6px', background: '#F3F4F6', borderRadius: '3px', overflow: 'hidden', marginBottom: '12px' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: progressPercent >= 100 ? '#059669' : '#10B981', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '3px' }} />
                    </div>

                    {/* Cuota sugerida */}
                    {quota > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E5E7EB' }}>
                            <TrendingUp size={14} color="#6B7280" />
                            <span style={{ fontSize: '12px', color: '#6B7280' }}>
                                Cuota sugerida: <strong style={{ color: '#1F2937' }}>{fmtRD(quota)}</strong> / {(goal.frequency || 'mes').toLowerCase().replace('mensual', 'mes').replace('semanal', 'semana').replace('quincenal', 'quincena')}
                            </span>
                        </div>
                    )}
                </div>
            ) : (
                /* Meta sin objetivo definido */
                <div style={{ fontSize: '18px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                    Ahorrado: {fmtRD(totalSaved)}
                </div>
            )}
        </div>
    );
}

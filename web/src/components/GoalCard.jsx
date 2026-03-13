import React from 'react';
import { Clock, RefreshCw, Lock, Globe, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Target } from 'lucide-react';

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
    const IconComponent = iconMap[goal.icon] || Target; // Fallback to Target if no match or legacy

    return (
        <div
            onClick={onClick}
            style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                padding: '24px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                marginBottom: '16px',
                cursor: 'pointer',
                border: '1px solid #E5E7EB',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                gap: '20px'
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '48px', height: '48px',
                        backgroundColor: '#F3F4F6', borderRadius: '12px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <IconComponent size={24} color="#4B5563" />
                    </div>
                    <div>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#111827', fontWeight: 'bold', letterSpacing: '-0.01em' }}>{goal.name}</h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#6B7280', fontSize: '13px', fontWeight: '500' }}>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Clock size={14} /> {goal.duration_months}m
                            </span>
                            <span>•</span>
                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                {goal.privacy === 'Privada' ? <Lock size={14} /> : <Globe size={14} />} {goal.privacy}
                            </span>
                        </div>
                    </div>
                </div>

                <div style={{ background: '#ECFDF5', color: '#059669', padding: '4px 10px', borderRadius: '8px', fontSize: '12px', fontWeight: '600' }}>
                    Activa
                </div>
            </div>

            {hasTarget ? (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
                        <span style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                            RD$ {totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span style={{ color: '#6B7280', fontSize: '14px', fontWeight: '500' }}>
                            de RD$ {goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                    </div>
                    {/* Barra de progreso limpia */}
                    <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', position: 'relative' }}>
                        <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10B981', transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)', borderRadius: '4px' }} />
                    </div>
                </div>
            ) : (
                <div style={{ fontSize: '20px', fontWeight: '700', color: '#111827', letterSpacing: '-0.02em' }}>
                    Ahorrado: RD$ {totalSaved.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
            )}
        </div>
    );
}

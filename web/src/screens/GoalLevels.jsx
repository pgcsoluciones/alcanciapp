import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowLeft, Target, Award, ChevronRight } from 'lucide-react';
import { API_BASE_URL } from '../lib/config';

export default function GoalLevels({ onBack }) {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadGoals = async () => {
            try {
                const token = localStorage.getItem('alcanciapp:token');
                const res = await fetch(`${API_BASE_URL}/api/v1/goals`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.ok) setGoals(data.goals || []);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        loadGoals();
    }, []);

    const getLevel = (percent) => {
        if (percent >= 100) return { n: 5, label: 'Maestro', color: '#10B981' };
        if (percent >= 75) return { n: 4, label: 'Experto', color: '#34D399' };
        if (percent >= 50) return { n: 3, label: 'Avanzado', color: '#60A5FA' };
        if (percent >= 25) return { n: 2, label: 'Iniciado', color: '#FBBF24' };
        return { n: 1, label: 'Novato', color: '#9CA3AF' };
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ArrowLeft size={20} color="#374151" />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: '900', color: '#111827' }}>Niveles por Meta</h1>
                </div>

                {isLoading ? (
                    <p style={{ textAlign: 'center', color: '#9CA3AF', marginTop: '40px', fontWeight: 'bold' }}>Analizando tu progreso...</p>
                ) : goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '24px', border: '2px dashed #E5E7EB' }}>
                        <Target size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: '600' }}>No tienes metas activas para evaluar niveles.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {goals.map(goal => {
                            const percent = goal.target_amount > 0 ? (Number(goal.total_saved) / goal.target_amount) * 100 : 0;
                            const level = getLevel(percent);
                            return (
                                <div key={goal.id} style={{ background: 'white', borderRadius: '24px', padding: '20px', border: '1px solid #F3F4F6', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#111827' }}>{goal.name}</h3>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                                                <Award size={14} color={level.color} />
                                                <span style={{ fontSize: '12px', fontWeight: '800', color: level.color, textTransform: 'uppercase' }}>Nivel {level.n}: {level.label}</span>
                                            </div>
                                        </div>
                                        <div style={{ fontSize: '20px', fontWeight: '900', color: '#111827' }}>
                                            {Math.round(percent)}%
                                        </div>
                                    </div>

                                    {/* Barra de niveles */}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '4px', height: '10px', marginBottom: '16px' }}>
                                        {[1, 2, 3, 4, 5].map(i => (
                                            <div key={i} style={{
                                                background: i <= level.n ? level.color : '#F3F4F6',
                                                borderRadius: i === 1 ? '10px 0 0 10px' : i === 5 ? '0 10px 10px 0' : '0',
                                                transition: 'all 0.4s ease'
                                            }} />
                                        ))}
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#9CA3AF', fontWeight: '700' }}>
                                        <span>PRÓXIMO HITO</span>
                                        <span style={{ color: '#6B7280' }}>{level.n === 5 ? 'META COMPLETADA' : `${level.n * 25}%`}</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

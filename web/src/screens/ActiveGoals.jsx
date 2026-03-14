import React, { useState, useEffect } from 'react';
import { Target, ArrowLeft, Loader2 } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import { API_BASE_URL } from '../lib/config';

export default function ActiveGoals({ onBack, onSelectGoal }) {
    const [goals, setGoals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadGoals();
    }, []);

    const loadGoals = async () => {
        setIsLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('alcanciapp:token');
            const res = await fetch(`${API_BASE_URL}/api/v1/goals`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al cargar las metas');
            setGoals(data.goals || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', padding: '24px 16px', boxSizing: 'border-box' }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                    <button onClick={onBack} style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '8px', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        <ArrowLeft size={20} color="#374151" />
                    </button>
                    <h1 style={{ fontSize: '20px', margin: 0, fontWeight: '800', color: '#111827' }}>Selecciona una Meta</h1>
                </div>

                {error && (
                    <div style={{ backgroundColor: '#FEF2F2', color: '#B91C1C', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px' }}>
                        {error}
                        <button onClick={loadGoals} style={{ marginLeft: '10px', background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', color: '#B91C1C' }}>Reintentar</button>
                    </div>
                )}

                {isLoading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '60px' }}>
                        <Loader2 className="animate-spin" size={32} color="#10B981" />
                    </div>
                ) : goals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', background: 'white', borderRadius: '24px', border: '1px dashed #D1D5DB' }}>
                        <Target size={48} color="#D1D5DB" style={{ marginBottom: '16px' }} />
                        <p style={{ color: '#6B7280', fontSize: '15px', fontWeight: '500' }}>No tienes metas activas.</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '4px' }}>Toca una meta para registrar tu aporte:</p>
                        {goals.map(goal => (
                            <GoalCard
                                key={goal.id}
                                goal={goal}
                                onClick={() => onSelectGoal(goal.id)}
                            />
                        ))}
                    </div>
                )}
            </div>
            <style>{`
                .animate-spin {
                    animation: spin 1s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}

import React, { useState, useEffect } from 'react';
import { Plus, Target } from 'lucide-react';
import GoalCard from '../components/GoalCard';
import EmptyGoalsState from '../components/EmptyGoalsState';
import { API_BASE_URL } from '../lib/config';
import { ASSET } from '../lib/assets';

export default function Dashboard({ onGoToCreate, onGoToDetail, onLogout }) {
    const [goals, setGoals] = useState([]);
    const [userName, setUserName] = useState('');
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
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Demo logic para nombre
            try {
                const userObj = JSON.parse(localStorage.getItem('alcanciapp:user') || '{}');
                setUserName(userObj.name || 'Juan');
            } catch (e) {
                setUserName('Ahorrador');
            }
            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Error al cargar las metas');
            }

            setGoals(data.goals || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F9FAFB', // Gris muy suave, moderno
            padding: '24px 16px',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', padding: '16px 20px', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1a1a1a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <img src={ASSET.logo()} alt="Alganciapp" style={{ height: '32px' }} />
                        Alcancía
                    </h1>
                    <button
                        onClick={onLogout}
                        style={{ background: '#F3F4F6', border: 'none', color: '#4B5563', fontWeight: '600', cursor: 'pointer', fontSize: '13px', padding: '8px 16px', borderRadius: '12px', transition: 'background-color 0.2s' }}
                    >
                        Salir
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
                    <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Cargando metas...</div>
                ) : goals.length === 0 ? (
                    <EmptyGoalsState onCreateClick={onGoToCreate} />
                ) : (
                    <>
                        <div style={{ marginBottom: '8px', paddingLeft: '4px' }}>
                            <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', letterSpacing: '-0.02em' }}>Hola, {userName}</span> <span style={{ fontSize: '24px' }}>👋</span>
                            <p style={{ color: '#6B7280', fontSize: '14px', marginTop: '4px' }}>Tu disciplina financiera está rindiendo frutos.</p>
                        </div>

                        {/* Balance Global Widget */}
                        <div style={{
                            background: '#10B981',
                            borderRadius: '20px',
                            padding: '24px',
                            color: 'white',
                            marginBottom: '24px',
                            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{ position: 'relative', zIndex: 1 }}>
                                <div style={{ fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9, marginBottom: '8px' }}>
                                    Balance Total Ahorrado
                                </div>
                                <div style={{ fontSize: '36px', fontWeight: '800', letterSpacing: '-0.02em', marginBottom: '16px' }}>
                                    RD$ {goals.reduce((acc, current) => acc + (Number(current.total_saved) || 0), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </div>
                                <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '16px' }}>
                                    <div>
                                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Metas Activas</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{goals.length}</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', opacity: 0.8, marginBottom: '4px' }}>Progreso Global</div>
                                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>
                                            {(() => {
                                                const totalSaved = goals.reduce((sum, g) => sum + (Number(g.total_saved) || 0), 0);
                                                const totalTarget = goals.reduce((sum, g) => sum + (Number(g.target_amount) || 0), 0);
                                                return totalTarget > 0 ? `${Math.round((totalSaved / totalTarget) * 100)}%` : 'N/A';
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {/* Decorative Circle */}
                            <div style={{ position: 'absolute', top: '-40px', right: '-40px', width: '150px', height: '150px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                        </div>

                        {goals.length > 0 && (
                            <div style={{ marginBottom: '24px' }}>
                                <h2 style={{ fontSize: '16px', color: '#374151', fontWeight: '700', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px', paddingLeft: '4px' }}>
                                    <Target size={18} color="#10B981" /> Meta Principal
                                </h2>
                                <GoalCard goal={goals[0]} onClick={() => onGoToDetail(goals[0].id)} />
                                <button
                                    onClick={() => onGoToDetail(goals[0].id)}
                                    style={{ width: '100%', padding: '14px', backgroundColor: '#ECFDF5', color: '#10B981', border: '1px solid #A7F3D0', borderRadius: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '-8px', fontSize: '15px' }}
                                >
                                    Hacer Aporte
                                </button>
                            </div>
                        )}

                        {goals.length > 1 && (
                            <>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingLeft: '4px' }}>
                                    <h2 style={{ fontSize: '16px', color: '#374151', fontWeight: '700', margin: 0 }}>Otras Metas Activas</h2>
                                </div>
                                {goals.slice(1).map(goal => (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        onClick={() => onGoToDetail(goal.id)}
                                    />
                                ))}
                            </>
                        )}

                        <button
                            onClick={onGoToCreate}
                            style={{
                                width: '100%',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '18px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                gap: '8px',
                                marginTop: '24px',
                                boxShadow: '0 4px 12px rgba(76, 175, 80, 0.3)'
                            }}
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

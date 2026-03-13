import React, { useState, useEffect } from 'react';
import { ArrowLeft, Target, TrendingUp, Calendar, ChevronRight, BarChart2, Bell, Share2, Users, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase } from 'lucide-react';
import ContributionForm from '../components/ContributionForm';
import { API_BASE_URL } from '../lib/config';

const iconMap = {
    'vacation': Plane,
    'house': Home,
    'motorcycle': Bike,
    'studies': GraduationCap,
    'gadgets': Laptop,
    'emergency': HeartPulse,
    'business': Briefcase,
};

export default function GoalDetail({ goalId, onBack }) {
    const [goal, setGoal] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        loadData();
    }, [goalId]);

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
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ amount })
            });
            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Error al registrar el aporte');
            }

            // Real load of created tx
            setTransactions(prev => [{ ...data.transaction, created_at: new Date().toISOString() }, ...prev]);
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalAhorrado = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

    if (isLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9FAFB', color: '#6B7280' }}>Cargando detalles...</div>;
    }

    if (!goal) {
        return (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: '#F9FAFB', minHeight: '100vh' }}>
                <p style={{ color: '#4B5563', marginBottom: '16px' }}>No se encontró la meta.</p>
                <button
                    onClick={onBack}
                    style={{ padding: '12px 24px', backgroundColor: '#10B981', color: 'white', borderRadius: '8px', border: 'none', fontWeight: 'bold' }}
                >
                    Volver
                </button>
            </div>
        );
    }

    const hasTarget = typeof goal.target_amount === 'number' && goal.target_amount > 0;
    const progressPercent = hasTarget ? Math.min((totalAhorrado / goal.target_amount) * 100, 100) : 0;
    const remaining = hasTarget ? Math.max(goal.target_amount - totalAhorrado, 0) : 0;

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F9FAFB',
            padding: '24px 16px',
            boxSizing: 'border-box'
        }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                {/* Header Navbar */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
                    <button
                        onClick={onBack}
                        style={{ background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    >
                        <ArrowLeft size={20} color="#374151" />
                    </button>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 0 16px' }}>
                        Detalle de Meta
                    </h1>
                </div>

                {error && (
                    <div style={{ background: '#FEF2F2', color: '#DC2626', padding: '16px', borderRadius: '12px', marginBottom: '20px', fontSize: '14px', border: '1px solid #FCA5A5' }}>
                        {error}
                    </div>
                )}

                {/* Hero Card */}
                <div style={{
                    background: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '20px',
                    padding: '28px 24px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
                    marginBottom: '24px'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ width: '48px', height: '48px', backgroundColor: '#F3F4F6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {(() => {
                                    const IconComponent = iconMap[goal.icon] || Target;
                                    return <IconComponent size={24} color="#4B5563" />;
                                })()}
                            </div>
                            <div>
                                <h2 style={{ fontSize: '22px', margin: '0 0 4px 0', fontWeight: 'bold', color: '#111827' }}>{goal.name}</h2>
                                <p style={{ margin: '0', color: '#6B7280', fontSize: '14px' }}>{goal.duration_months} meses • {goal.frequency}</p>
                            </div>
                        </div>
                        <div style={{ background: '#ECFDF5', color: '#059669', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600' }}>
                            {progressPercent >= 100 ? 'Completada' : 'En Curso'}
                        </div>
                    </div>

                    {hasTarget ? (
                        <>
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                                    Progreso Actual
                                </div>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                                    <span style={{ fontSize: '32px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                                        RD$ {totalAhorrado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </span>
                                    <div style={{ backgroundColor: '#ECFDF5', color: '#10B981', padding: '4px 8px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                                        {Math.round(progressPercent)}%
                                    </div>
                                </div>
                            </div>

                            <div style={{ width: '100%', height: '8px', background: '#F3F4F6', borderRadius: '4px', overflow: 'hidden', marginBottom: '12px' }}>
                                <div style={{ width: `${progressPercent}%`, height: '100%', background: '#10B981', borderRadius: '4px', transition: 'width 0.4s ease-out' }} />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#6B7280', fontWeight: '500', marginBottom: '16px' }}>
                                <span>Restan: RD$ {remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                                <span style={{ color: '#111827', fontWeight: '600' }}>Objetivo: RD$ {goal.target_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                            </div>

                            <p style={{ margin: 0, fontStyle: 'italic', fontSize: '13px', color: '#10B981', textAlign: 'center', fontWeight: '500', backgroundColor: '#ECFDF5', padding: '8px', borderRadius: '8px' }}>
                                {progressPercent === 0 && "El primer paso es el más difícil. ¡Comienza hoy!"}
                                {progressPercent > 0 && progressPercent < 50 && "¡Excelente inicio! Sigue ahorrando con constancia."}
                                {progressPercent >= 50 && progressPercent < 80 && "¡Ya pasaste la mitad! Se ve más cerca, ¿verdad?"}
                                {progressPercent >= 80 && progressPercent < 100 && "¡Estás en la recta final! Ya casi lo logras."}
                                {progressPercent >= 100 && "¡Felicidades! Has cumplido tu objetivo."}
                            </p>
                        </>
                    ) : (
                        <div>
                            <div style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6B7280', marginBottom: '6px', fontWeight: '600' }}>
                                Total Ahorrado
                            </div>
                            <div style={{ fontSize: '36px', fontWeight: '800', color: '#111827', letterSpacing: '-0.02em' }}>
                                RD$ {totalAhorrado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </div>
                        </div>
                    )}
                </div>

                <ContributionForm onSubmit={handleAporte} isLoading={isSubmitting} />

                {/* Next Steps / Placeholders */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '24px'
                }}>
                    <button style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '16px 4px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#9CA3AF' }}>
                        <BarChart2 size={22} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Estadísticas</span>
                    </button>
                    <button style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '16px 4px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#9CA3AF' }}>
                        <Bell size={22} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Avisos</span>
                    </button>
                    <button style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '16px 4px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#9CA3AF' }}>
                        <Users size={22} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Círculos</span>
                    </button>
                    <button style={{ backgroundColor: 'white', border: '1px solid #E5E7EB', padding: '16px 4px', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'not-allowed', color: '#9CA3AF' }}>
                        <Share2 size={22} style={{ marginBottom: '8px' }} />
                        <span style={{ fontSize: '11px', fontWeight: '600' }}>Compartir</span>
                    </button>
                </div>

                {/* Historial */}
                <div style={{ marginTop: '32px' }}>
                    <h3 style={{ fontSize: '18px', color: '#111827', marginBottom: '16px', fontWeight: 'bold' }}>
                        Historial de aportes
                    </h3>

                    {transactions.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '32px 20px', background: 'white', borderRadius: '16px', color: '#6B7280', border: '1px dashed #D1D5DB' }}>
                            Aún no hay transacciones. ¡Realiza tu primer aporte!
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {transactions.map(tx => (
                                <div key={tx.id} style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    background: 'white',
                                    padding: '16px',
                                    borderRadius: '16px',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                    border: '1px solid #F3F4F6'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                        <div style={{ background: '#ECFDF5', padding: '10px', borderRadius: '12px' }}>
                                            <TrendingUp size={20} color="#059669" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>Ingreso Manual</div>
                                            <div style={{ color: '#6B7280', fontSize: '13px', marginTop: '2px' }}>
                                                {new Date(tx.created_at || Date.now()).toLocaleDateString('es-DO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: '#059669', fontSize: '16px' }}>
                                        +RD$ {Number(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

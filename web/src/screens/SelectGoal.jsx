import React, { useState } from 'react';
import GoalTypeCard from '../components/GoalTypeCard';
import { ASSET } from '../lib/assets.js';
import { API_BASE_URL } from '../lib/config.js';
import { ArrowLeft, Plane, Home, Bike, GraduationCap, Laptop, HeartPulse, Briefcase, Plus } from 'lucide-react';

const goalTypes = [
    { id: 'vacation', title: 'Viaje', icon: Plane },
    { id: 'house', title: 'Casa', icon: Home },
    { id: 'motorcycle', title: 'Moto/Auto', icon: Bike },
    { id: 'studies', title: 'Educación', icon: GraduationCap },
    { id: 'gadgets', title: 'Tecnología', icon: Laptop },
    { id: 'emergency', title: 'Emergencia', icon: HeartPulse },
    { id: 'business', title: 'Negocio', icon: Briefcase }
];

const SelectGoal = ({ onBack, onGoalCreated }) => {
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [targetAmount, setTargetAmount] = useState('');
    const [durationMonths, setDurationMonths] = useState(3);
    const [frequency, setFrequency] = useState('Mensual');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleCreateGoal = async () => {
        setErrorMsg('');
        if (!selectedGoalId) {
            setErrorMsg('Por favor, selecciona un tipo de meta.');
            return;
        }
        if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
            setErrorMsg('Por favor, ingresa un monto objetivo válido.');
            return;
        }

        setIsLoading(true);

        try {
            const selectedGoalData = goalTypes.find(g => g.id === selectedGoalId);
            let token = localStorage.getItem('alcanciapp:token');

            if (!token) {
                throw new Error('No hay sesión activa. Acceso denegado.');
            }

            const payload = {
                name: selectedGoalData.title,
                target_amount: Number(targetAmount),
                duration_months: durationMonths,
                icon: selectedGoalData.id,
                privacy: 'Privada',
                frequency
            };

            const res = await fetch(`${API_BASE_URL}/api/v1/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!res.ok || !data.ok) {
                throw new Error(data.error || 'Error al crear la meta');
            }

            if (onGoalCreated) {
                onGoalCreated(data.data || payload);
            }
        } catch (error) {
            console.error('Error creating goal:', error);
            setErrorMsg(error.message || 'Error de conexión. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#F9FAFB',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '24px 16px',
            boxSizing: 'border-box',
            width: '100%',
            margin: '0 auto'
        }}>
            <div style={{ maxWidth: '480px', width: '100%' }}>
                {/* Header Navbar */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
                    {onBack && (
                        <button
                            onClick={onBack}
                            style={{ background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                        >
                            <ArrowLeft size={20} color="#374151" />
                        </button>
                    )}
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 0 16px' }}>
                        Nueva Meta
                    </h1>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h2 style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</h2>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                    }}>
                        {goalTypes.map(goal => (
                            <GoalTypeCard
                                key={goal.id}
                                title={goal.title}
                                Icon={goal.icon}
                                isSelected={selectedGoalId === goal.id}
                                onClick={() => setSelectedGoalId(goal.id)}
                            />
                        ))}
                    </div>
                </div>

                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '24px', border: '1px solid #F3F4F6' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Monto Objetivo (RD$)
                        </label>
                        <input
                            type="number"
                            value={targetAmount}
                            onChange={(e) => setTargetAmount(e.target.value)}
                            placeholder="Ej. 50000"
                            style={{
                                width: '100%',
                                padding: '16px',
                                borderRadius: '12px',
                                border: '1px solid #E5E7EB',
                                backgroundColor: '#F9FAFB',
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#111827',
                                boxSizing: 'border-box',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Plazo estimado
                        </label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {[3, 6, 12].map(months => {
                                const selected = durationMonths === months;
                                return (
                                    <button
                                        key={months}
                                        onClick={() => setDurationMonths(months)}
                                        style={{
                                            flex: 1,
                                            height: '48px',
                                            backgroundColor: selected ? '#10B981' : '#F3F4F6',
                                            color: selected ? 'white' : '#4B5563',
                                            border: selected ? 'none' : '1px solid #E5E7EB',
                                            borderRadius: '12px',
                                            fontWeight: '600',
                                            fontSize: '15px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {months} Meses
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Frecuencia de aportes */}
                    <div style={{ marginTop: '20px' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Frecuencia de aportes
                        </label>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                            {['Diario', 'Semanal', 'Quincenal', 'Mensual'].map(freq => {
                                const sel = frequency === freq;
                                return (
                                    <button
                                        key={freq}
                                        type="button"
                                        onClick={() => setFrequency(freq)}
                                        style={{
                                            padding: '10px 4px',
                                            backgroundColor: sel ? '#10B981' : '#F3F4F6',
                                            color: sel ? 'white' : '#4B5563',
                                            border: sel ? 'none' : '1px solid #E5E7EB',
                                            borderRadius: '10px',
                                            fontWeight: '600',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        {freq}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {errorMsg && (
                        <p style={{ color: '#DC2626', fontSize: '14px', marginTop: '16px', fontWeight: '600' }}>
                            {errorMsg}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleCreateGoal}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        height: '56px',
                        backgroundColor: '#10B981',
                        color: 'white',
                        border: 'none',
                        borderRadius: '16px',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                        transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isLoading ? 'Creando...' : 'Crear Meta'}
                </button>
            </div>
        </div>
    );
};

export default SelectGoal;

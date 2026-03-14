import React, { useState } from 'react';
import GoalTypeCard from '../components/GoalTypeCard';
import { ASSET } from '../lib/assets.js';
import { API_BASE_URL } from '../lib/config.js';
import {
    ArrowLeft, Plane, Home, Bike, GraduationCap, Laptop,
    HeartPulse, Briefcase, Target, Star, Gift, Heart,
    Camera, Car, BookOpen, Hammer, Package
} from 'lucide-react';

// ─── Categorías predefinidas ─────────────────────────────────────────────────
const goalTypes = [
    { id: 'vacation', title: 'Viaje', icon: Plane },
    { id: 'house', title: 'Casa', icon: Home },
    { id: 'motorcycle', title: 'Moto/Auto', icon: Bike },
    { id: 'studies', title: 'Educación', icon: GraduationCap },
    { id: 'gadgets', title: 'Tecnología', icon: Laptop },
    { id: 'emergency', title: 'Emergencia', icon: HeartPulse },
    { id: 'business', title: 'Negocio', icon: Briefcase },
];

// ─── Galería de iconos para meta personalizada ───────────────────────────────
const customIcons = [
    { id: 'target', Icon: Target, label: 'Meta' },
    { id: 'star', Icon: Star, label: 'Estrella' },
    { id: 'gift', Icon: Gift, label: 'Regalo' },
    { id: 'heart', Icon: Heart, label: 'Corazón' },
    { id: 'camera', Icon: Camera, label: 'Cámara' },
    { id: 'car', Icon: Car, label: 'Auto' },
    { id: 'book', Icon: BookOpen, label: 'Libro' },
    { id: 'hammer', Icon: Hammer, label: 'Herramienta' },
    { id: 'home', Icon: Home, label: 'Hogar' },
    { id: 'laptop', Icon: Laptop, label: 'Compu' },
    { id: 'plane', Icon: Plane, label: 'Vuelo' },
    { id: 'briefcase', Icon: Briefcase, label: 'Trabajo' },
];

const DEFAULT_CUSTOM_ICON = 'target';

// ─── Componente principal ────────────────────────────────────────────────────
const SelectGoal = ({ onBack, onGoalCreated }) => {
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [targetAmount, setTargetAmount] = useState('');
    const [durationMonths, setDurationMonths] = useState(3);
    const [frequency, setFrequency] = useState('Mensual');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    // Estados para meta personalizada
    const [customName, setCustomName] = useState('');
    const [customIconId, setCustomIconId] = useState(DEFAULT_CUSTOM_ICON);

    const isCustom = selectedGoalId === 'custom';

    const handleSelectCategory = (id) => {
        setSelectedGoalId(id);
        setErrorMsg('');
    };

    const handleCreateGoal = async () => {
        setErrorMsg('');

        if (!selectedGoalId) {
            setErrorMsg('Por favor, selecciona una categoría.');
            return;
        }
        if (isCustom && !customName.trim()) {
            setErrorMsg('Escribe el nombre de tu meta personalizada.');
            return;
        }
        if (!targetAmount || isNaN(targetAmount) || Number(targetAmount) <= 0) {
            setErrorMsg('Por favor, ingresa un monto objetivo válido.');
            return;
        }

        setIsLoading(true);
        try {
            const token = localStorage.getItem('alcanciapp:token');
            if (!token) throw new Error('No hay sesión activa. Acceso denegado.');

            let goalName, iconId;
            if (isCustom) {
                goalName = customName.trim();
                iconId = customIconId || DEFAULT_CUSTOM_ICON;
            } else {
                const selected = goalTypes.find(g => g.id === selectedGoalId);
                goalName = selected.title;
                iconId = selected.id;
            }

            const payload = {
                name: goalName,
                target_amount: Number(targetAmount),
                duration_months: durationMonths,
                icon: iconId,
                privacy: 'Privada',
                frequency
            };

            const res = await fetch(`${API_BASE_URL}/api/v1/goals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok || !data.ok) throw new Error(data.error || 'Error al crear la meta');

            if (onGoalCreated) onGoalCreated(data.data || payload);
        } catch (error) {
            setErrorMsg(error.message || 'Error de conexión. Inténtalo de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#F9FAFB', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 16px', boxSizing: 'border-box', width: '100%' }}>
            <div style={{ maxWidth: '480px', width: '100%' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '28px' }}>
                    {onBack && (
                        <button onClick={onBack} style={{ background: 'white', border: 'none', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                            <ArrowLeft size={20} color="#374151" />
                        </button>
                    )}
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#111827', margin: '0 0 0 16px' }}>Nueva Meta</h1>
                </div>

                {/* ─── Categorías ─── */}
                <div style={{ marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '13px', color: '#6B7280', fontWeight: '600', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Categoría</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                        {goalTypes.map(goal => (
                            <GoalTypeCard
                                key={goal.id}
                                title={goal.title}
                                Icon={goal.icon}
                                isSelected={selectedGoalId === goal.id}
                                onClick={() => handleSelectCategory(goal.id)}
                            />
                        ))}

                        {/* Tarjeta "Otros" */}
                        <button
                            onClick={() => handleSelectCategory('custom')}
                            style={{
                                background: isCustom ? '#ECFDF5' : 'white',
                                border: `2px ${isCustom ? 'solid' : 'dashed'} ${isCustom ? '#10B981' : '#D1D5DB'}`,
                                borderRadius: '14px',
                                padding: '14px 8px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                minHeight: '74px'
                            }}
                        >
                            <Package size={22} color={isCustom ? '#10B981' : '#9CA3AF'} />
                            <span style={{ fontSize: '12px', fontWeight: '700', color: isCustom ? '#059669' : '#6B7280' }}>Otros</span>
                        </button>
                    </div>
                </div>

                {/* ─── Panel de meta personalizada (solo si selecciona "Otros") ─── */}
                {isCustom && (
                    <div style={{ background: 'white', border: '1px solid #A7F3D0', borderRadius: '16px', padding: '20px', marginBottom: '16px', animation: 'fadeIn 0.2s ease' }}>
                        <div style={{ fontSize: '13px', fontWeight: '700', color: '#059669', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Package size={14} /> Personaliza tu meta
                        </div>

                        {/* Nombre de la meta */}
                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                                Nombre de la meta *
                            </label>
                            <input
                                type="text"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Ej. Viaje a Europa, Nuevo celular, Quinceañera..."
                                maxLength={60}
                                style={{
                                    width: '100%', padding: '12px 14px', borderRadius: '12px',
                                    border: '1px solid #E5E7EB', fontSize: '15px', color: '#111827',
                                    boxSizing: 'border-box', outline: 'none', background: '#F9FAFB',
                                    fontWeight: '600', transition: 'border-color 0.2s'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#10B981'}
                                onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                            />
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px', textAlign: 'right' }}>
                                {customName.length}/60
                            </div>
                        </div>

                        {/* Galería de iconos */}
                        <div>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#374151', marginBottom: '10px' }}>
                                Elige un icono (opcional)
                            </label>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '8px' }}>
                                {customIcons.map(({ id, Icon, label }) => {
                                    const sel = customIconId === id;
                                    return (
                                        <button
                                            key={id}
                                            type="button"
                                            title={label}
                                            onClick={() => setCustomIconId(id)}
                                            style={{
                                                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                                padding: '10px 4px', borderRadius: '12px', border: 'none',
                                                backgroundColor: sel ? '#ECFDF5' : '#F9FAFB',
                                                outline: sel ? '2px solid #10B981' : '1px solid #E5E7EB',
                                                cursor: 'pointer', transition: 'all 0.15s', gap: '4px'
                                            }}
                                        >
                                            <Icon size={20} color={sel ? '#059669' : '#6B7280'} />
                                            <span style={{ fontSize: '9px', color: sel ? '#059669' : '#9CA3AF', fontWeight: '600' }}>{label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── Detalle de la meta (monto, plazo, frecuencia) ─── */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.04)', marginBottom: '24px', border: '1px solid #F3F4F6' }}>

                    {/* Monto */}
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
                                width: '100%', padding: '16px', borderRadius: '12px',
                                border: '1px solid #E5E7EB', backgroundColor: '#F9FAFB',
                                fontSize: '24px', fontWeight: 'bold', color: '#111827',
                                boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = '#10B981'}
                            onBlur={(e) => e.target.style.borderColor = '#E5E7EB'}
                        />
                    </div>

                    {/* Plazo */}
                    <div style={{ marginBottom: '0' }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                            Plazo estimado (meses)
                        </label>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                            {[3, 6, 12].map(months => {
                                const sel = durationMonths === months;
                                return (
                                    <button
                                        key={months}
                                        type="button"
                                        onClick={() => setDurationMonths(months)}
                                        style={{
                                            flex: 1, minWidth: '80px', height: '48px',
                                            backgroundColor: sel ? '#10B981' : '#F3F4F6',
                                            color: sel ? 'white' : '#4B5563',
                                            border: sel ? 'none' : '1px solid #E5E7EB',
                                            borderRadius: '12px', fontWeight: '600', fontSize: '15px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {months} M
                                    </button>
                                );
                            })}
                            <div style={{ flex: '1.5', minWidth: '120px', position: 'relative' }}>
                                <input
                                    type="number"
                                    placeholder="Otro..."
                                    value={![3, 6, 12].includes(durationMonths) ? durationMonths : ''}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setDurationMonths(val === '' ? '' : Number(val));
                                    }}
                                    style={{
                                        width: '100%', height: '48px', padding: '0 12px',
                                        borderRadius: '12px', border: ![3, 6, 12].includes(durationMonths) && durationMonths !== '' ? '2px solid #10B981' : '1px solid #E5E7EB',
                                        fontSize: '15px', fontWeight: '800', outline: 'none',
                                        boxSizing: 'border-box', backgroundColor: ![3, 6, 12].includes(durationMonths) && durationMonths !== '' ? 'white' : '#F9FAFB',
                                        color: '#111827'
                                    }}
                                />
                                {![3, 6, 12].includes(durationMonths) && durationMonths > 0 && (
                                    <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '11px', color: '#059669', fontWeight: '800', textTransform: 'uppercase' }}>meses</div>
                                )}
                            </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '8px', fontWeight: '500' }}>
                            * Puedes seleccionar un plazo rápido o escribir tu propio número de meses.
                        </div>
                    </div>

                    {/* Frecuencia */}
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
                                            borderRadius: '10px', fontWeight: '600', fontSize: '12px',
                                            cursor: 'pointer', transition: 'all 0.2s'
                                        }}
                                    >
                                        {freq}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {errorMsg && (
                        <p style={{ color: '#DC2626', fontSize: '14px', marginTop: '16px', fontWeight: '600', marginBottom: 0 }}>
                            {errorMsg}
                        </p>
                    )}
                </div>

                {/* CTA */}
                <button
                    onClick={handleCreateGoal}
                    disabled={isLoading}
                    style={{
                        width: '100%', height: '56px', backgroundColor: '#10B981', color: 'white',
                        border: 'none', borderRadius: '16px', fontSize: '16px', fontWeight: 'bold',
                        cursor: isLoading ? 'not-allowed' : 'pointer', opacity: isLoading ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)', transition: 'transform 0.1s'
                    }}
                    onMouseDown={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(0.98)')}
                    onMouseUp={(e) => !isLoading && (e.currentTarget.style.transform = 'scale(1)')}
                >
                    {isLoading ? 'Creando...' : 'Crear Meta'}
                </button>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(-6px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default SelectGoal;

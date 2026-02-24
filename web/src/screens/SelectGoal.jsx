import React, { useState } from 'react';
import GoalTypeCard from '../components/GoalTypeCard';
import { ASSET } from '../lib/assets';

const goalTypes = [
    { id: 'vacation', title: 'Viaje', image: ASSET.goal('goal_vacation.png', 256) },
    { id: 'house', title: 'Casa', image: ASSET.goal('goal_house.png', 256) },
    { id: 'motorcycle', title: 'Moto', image: ASSET.goal('goal_motorcycle.png', 256) },
    { id: 'studies', title: 'Educación', image: ASSET.goal('goal_studies.png', 256) },
    { id: 'health', title: 'Salud', image: ASSET.goal('goal_health.png', 256) },
    { id: 'gadgets', title: 'Tecnología', image: ASSET.goal('goal_gadgets.png', 256) }
];

const SelectGoal = ({ onBack, onGoalCreated }) => {
    const [selectedGoalId, setSelectedGoalId] = useState(null);
    const [targetAmount, setTargetAmount] = useState('');
    const [durationMonths, setDurationMonths] = useState(3);
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
            const token = localStorage.getItem('alcanciapp_token');

            // The backend expects specific fields. Adjust based on real API specs.
            // Default privacy and frequency since they aren't in this UI.
            const payload = {
                name: selectedGoalData.title,
                targetAmount: Number(targetAmount),
                durationMonths: durationMonths,
                icon: selectedGoalData.image.split('/').pop(), // e.g. "goal_vacation.png"
                privacy: 'Privada',
                frequency: 'Mensual'
            };

            const res = await fetch('https://alcanciapp-api.fliaprince.workers.dev/api/v1/goals', {
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

            // Success
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
            backgroundImage: `linear-gradient(to bottom, rgba(230,240,255,0.2) 0%, rgba(200,225,250,0.6) 100%), url('${ASSET.bg('bg_ui_goal_island_day.jpg')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px',
            boxSizing: 'border-box',
            position: 'relative',
            width: '100%',
            maxWidth: '430px', // Mobile constraint hasta 430px según user
            margin: '0 auto'
        }}>

            {/* Header / Botón Volver */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative',
                marginBottom: '20px'
            }}>
                {onBack && (
                    <button
                        onClick={onBack}
                        style={{
                            position: 'absolute',
                            left: '0',
                            background: 'transparent',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                            zIndex: 10
                        }}
                    >
                        <img
                            src={ASSET.ui.roundArrowLeft()}
                            alt="Volver"
                            style={{ width: '44px', height: '44px', display: 'block' }}
                        />
                    </button>
                )}

                {/* Header Plaque */}
                <div style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '280px', // Un poco más ajustado para dejar espacio al botón back
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}>
                    <img
                        src={ASSET.ui.bannerRibbonPlaque()}
                        alt="Banner"
                        style={{ width: '100%', height: 'auto', display: 'block' }}
                    />
                    <div style={{
                        position: 'absolute',
                        top: '46%', // Ajuste vertical manual según imagen Plaque
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        width: '85%'
                    }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            fontFamily: 'serif',
                            margin: '0 0 2px 0',
                            textShadow: '1px 2px 3px rgba(0,0,0,0.6)'
                        }}>Establecer Metas</h1>
                        <p style={{
                            color: '#fff9e6',
                            fontSize: '11px',
                            margin: 0,
                            textShadow: '1px 1px 2px rgba(0,0,0,0.6)',
                            lineHeight: '1.2'
                        }}>Elige una Meta para Comenzar tu Ahorro</p>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '380px',
                marginBottom: '24px',
                boxSizing: 'border-box'
            }}>
                {goalTypes.map(goal => (
                    <GoalTypeCard
                        key={goal.id}
                        title={goal.title}
                        imageSrc={goal.image}
                        isSelected={selectedGoalId === goal.id}
                        onClick={() => setSelectedGoalId(goal.id)}
                    />
                ))}
            </div>

            {/* Form Controls - Blur Panel */}
            <div style={{
                width: '100%',
                maxWidth: '380px',
                backgroundColor: 'rgba(255, 255, 255, 0.75)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
                borderRadius: '20px',
                padding: '24px 20px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
                border: '1px solid rgba(255,255,255,0.5)',
                marginBottom: '30px',
                boxSizing: 'border-box'
            }}>
                <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#444', marginBottom: '8px' }}>
                        Monto Objetivo (RD$)
                    </label>
                    <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="Ej. 50000"
                        style={{
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: '1px solid rgba(0,0,0,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.9)',
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#333',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            outline: 'none',
                            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#444', marginBottom: '12px' }}>
                        Plazo (Meses)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                        {[3, 6, 12].map(months => {
                            const selected = durationMonths === months;
                            return (
                                <button
                                    key={months}
                                    onClick={() => setDurationMonths(months)}
                                    style={{
                                        flex: 1,
                                        height: '44px',
                                        backgroundImage: selected ? `url('${ASSET.ui.pill_green()}')` : 'none',
                                        backgroundColor: selected ? 'transparent' : 'rgba(255,255,255,0.8)',
                                        backgroundSize: '100% 100%', // Stretch the pill image if needed, or cover
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        border: selected ? 'none' : '1px solid #ccc',
                                        borderRadius: '22px', // fallback if pill isn't perfectly masking
                                        color: selected ? 'white' : '#666',
                                        fontWeight: 'bold',
                                        fontSize: '15px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        boxShadow: selected ? '0 4px 8px rgba(76, 175, 80, 0.4)' : 'none',
                                        textShadow: selected ? '1px 1px 2px rgba(0,0,0,0.3)' : 'none'
                                    }}
                                >
                                    {months}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {errorMsg && (
                    <p style={{ color: '#d32f2f', fontSize: '14px', marginTop: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                        {errorMsg}
                    </p>
                )}
            </div>

            {/* Button Create */}
            <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
                marginBottom: '40px'
            }}>
                <button
                    onClick={handleCreateGoal}
                    disabled={isLoading}
                    style={{
                        width: '100%',
                        maxWidth: '280px',
                        height: '75px', // Altura mayor para btnPrimaryGreenPlatform real look
                        backgroundImage: `url('${ASSET.ui.btnPrimaryGreenPlatform()}')`,
                        backgroundSize: '100% 100%',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: isLoading ? 'not-allowed' : 'pointer',
                        opacity: isLoading ? 0.7 : 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        paddingBottom: '8px', // offset porque estos assets tienen el text-area más arriba debido a la sombra de la base
                        transition: 'transform 0.1s active'
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        textShadow: '1px 2px 4px rgba(0,0,0,0.5)'
                    }}>
                        {isLoading ? 'Creando...' : 'Crear Meta'}
                    </span>
                </button>
            </div>

        </div>
    );
};

export default SelectGoal;

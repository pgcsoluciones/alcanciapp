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
            backgroundImage: `url('${ASSET.bg('bg_ui_goal_island_day.jpg')}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '20px 16px',
            boxSizing: 'border-box',
            position: 'relative',
            width: '100%',
            maxWidth: '480px', // Mobile first constraint
            margin: '0 auto'
        }}>

            {/* Botón volver discreto (OPCIONAL) */}
            {onBack && (
                <button
                    onClick={onBack}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        left: '16px',
                        background: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '36px',
                        height: '36px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                >
                    ←
                </button>
            )}

            {/* Header Plaque */}
            <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: '320px',
                marginTop: '20px',
                marginBottom: '24px',
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
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    width: '80%'
                }}>
                    <h1 style={{
                        color: 'white',
                        fontSize: '18px',
                        margin: '0 0 4px 0',
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
                    }}>Establecer Metas</h1>
                    <p style={{
                        color: '#f0f0f0',
                        fontSize: '12px',
                        margin: 0,
                        textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                        lineHeight: '1.2'
                    }}>Elige una Meta para Comenzar tu Ahorro</p>
                </div>
            </div>

            {/* Goals Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                width: '100%',
                maxWidth: '340px',
                marginBottom: '24px',
                // Evitamos overflow horizontal
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

            {/* Form Controls */}
            <div style={{
                width: '100%',
                maxWidth: '340px',
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                borderRadius: '16px',
                padding: '20px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                marginBottom: '24px',
                boxSizing: 'border-box'
            }}>
                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#444', marginBottom: '8px' }}>
                        Monto Objetivo (RD$)
                    </label>
                    <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="Ej. 50000"
                        style={{
                            width: '100%',
                            padding: '12px',
                            borderRadius: '8px',
                            border: '1px solid #ccc',
                            fontSize: '16px',
                            boxSizing: 'border-box'
                        }}
                    />
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', color: '#444', marginBottom: '8px' }}>
                        Plazo (Meses)
                    </label>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                        {[3, 6, 12].map(months => (
                            <button
                                key={months}
                                onClick={() => setDurationMonths(months)}
                                style={{
                                    flex: 1,
                                    padding: '10px 0',
                                    borderRadius: '20px',
                                    border: durationMonths === months ? '2px solid #4CAF50' : '1px solid #ccc',
                                    backgroundColor: durationMonths === months ? '#E8F5E9' : 'white',
                                    color: durationMonths === months ? '#2E7D32' : '#666',
                                    fontWeight: durationMonths === months ? 'bold' : 'normal',
                                    fontSize: '14px',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {months}
                            </button>
                        ))}
                    </div>
                </div>

                {errorMsg && (
                    <p style={{ color: '#d32f2f', fontSize: '13px', marginTop: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                        {errorMsg}
                    </p>
                )}
            </div>

            {/* Button Create - Usando la imagen btnPrimaryGreenPlatform de fondo */}
            <button
                onClick={handleCreateGoal}
                disabled={isLoading}
                style={{
                    width: '100%',
                    maxWidth: '300px',
                    height: '60px', // Altura aproximada de la imagen
                    backgroundImage: `url('${ASSET.ui.btnPrimaryGreenPlatform()}')`,
                    backgroundSize: 'contain',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '40px', // Padding fín de pantalla
                    transition: 'transform 0.1s active'
                }}
            >
                <span style={{
                    color: 'white',
                    fontSize: '18px',
                    fontWeight: 'bold',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                    marginTop: '-4px' // Pequeño ajuste visual para que quede centrado respecto a la sombra del botón
                }}>
                    {isLoading ? 'Creando...' : 'Crear Meta'}
                </span>
            </button>

        </div>
    );
};

export default SelectGoal;

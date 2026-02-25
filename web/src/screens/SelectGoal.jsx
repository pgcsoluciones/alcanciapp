import React, { useState } from 'react';
import GoalTypeCard from '../components/GoalTypeCard';
import { ASSET } from '../lib/assets.js';

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
            let token = localStorage.getItem('alcanciapp_token');

            if (!token) {
                // Intentar obtener token anónimo si no hay uno
                const authRes = await fetch('https://alcanciapp-api.fliaprince.workers.dev/api/v1/auth/anonymous', {
                    method: 'POST'
                });
                const authData = await authRes.json();
                if (authData.ok && authData.data?.token) {
                    token = authData.data.token;
                    localStorage.setItem('alcanciapp_token', token);
                } else {
                    throw new Error('No se pudo establecer conexión segura (Token inválido).');
                }
            }

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
            // Overlay gradient suave (oscuro 15% arriba, 25% abajo) seguido de la imagen real estática sin repetir
            backgroundImage: `linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.25) 100%), url('${ASSET.bg('bg_ui_goal_island_day.jpg')}')`,
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
                    maxWidth: '360px', // Más amplio para no montar textos
                    marginTop: '15px', // Bajar el banner un poco 
                    minHeight: '110px', // Reservar alto fijo
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    filter: 'drop-shadow(0 6px 8px rgba(0,0,0,0.4))'
                }}>
                    <img
                        src={ASSET.ui.bannerRibbonPlaque()}
                        alt="Banner"
                        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />

                    {/* Título en el ribbon rojo */}
                    <div style={{
                        position: 'relative',
                        zIndex: 2,
                        marginTop: '-18px', // Ajuste respecto al espacio real del ribbon
                        textAlign: 'center',
                        width: '90%'
                    }}>
                        <h1 style={{
                            color: 'white',
                            fontSize: '22px',
                            fontWeight: '900',
                            fontFamily: 'system-ui, sans-serif',
                            margin: '0',
                            textShadow: '0px 2px 3px rgba(0,0,0,0.6), 0px -1px 2px rgba(150,0,0,0.6)',
                            WebkitTextStroke: '0.5px #600'
                        }}>Establecer Metas</h1>
                    </div>

                    {/* Subtítulo en la madera */}
                    <div style={{
                        position: 'relative',
                        zIndex: 2,
                        marginTop: '16px', // Espacio respecto al titulo
                        textAlign: 'center',
                        width: '85%'
                    }}>
                        <p style={{
                            color: '#5a3d2b', // Marrón oscuro como en la madera
                            fontSize: '14px',
                            fontWeight: 'bold',
                            fontFamily: 'system-ui, sans-serif',
                            margin: 0,
                            lineHeight: '1.2'
                        }}>Elige una Meta para Comenzar tu Ahorro</p>
                    </div>
                </div>
            </div>

            {/* Goals Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '16px',
                width: '100%',
                maxWidth: '430px', // Ocupar casi todo el espacio
                padding: '0 8px',
                marginBottom: '28px',
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

            {/* Form Controls - Panel de Pergamino */}
            <div style={{
                width: '100%',
                maxWidth: '430px',
                backgroundImage: `url('${ASSET.ui.scrollParchment()}')`,
                backgroundSize: '100% 100%', // Stretch sin romper esquinas (el pergamino es flexible centralmente)
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundColor: 'transparent',
                padding: '36px 32px', // Mayor padding para salvar pliegues del scroll
                filter: 'drop-shadow(0 8px 16px rgba(0,0,0,0.4))',
                marginBottom: '20px',
                boxSizing: 'border-box',
                position: 'relative'
            }}>
                <div style={{ marginBottom: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(90,61,43,0.3), transparent)', flex: 1 }}></div>
                        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#5a3d2b', padding: '0 12px', textAlign: 'center' }}>
                            Propósito de Ahorro
                        </label>
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(90,61,43,0.3), transparent)', flex: 1 }}></div>
                    </div>

                    <input
                        type="number"
                        value={targetAmount}
                        onChange={(e) => setTargetAmount(e.target.value)}
                        placeholder="Ej. 50000"
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '16px',
                            border: 'none',
                            backgroundColor: 'rgba(255,250,240,0.6)',
                            fontSize: '26px',
                            fontWeight: '900',
                            color: '#4a2f1c',
                            textAlign: 'center',
                            boxSizing: 'border-box',
                            outline: 'none',
                            boxShadow: 'inset 0 4px 6px rgba(0,0,0,0.2), 0 2px 2px rgba(255,255,255,0.7)'
                        }}
                    />
                </div>

                <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '12px' }}>
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(90,61,43,0.3), transparent)', flex: 1 }}></div>
                        <label style={{ fontSize: '13px', fontWeight: 'bold', color: '#5a3d2b', padding: '0 12px', textAlign: 'center' }}>
                            Plazo para la Meta
                        </label>
                        <div style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(90,61,43,0.3), transparent)', flex: 1 }}></div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                        {[3, 6, 12].map(months => {
                            const selected = durationMonths === months;
                            return (
                                <button
                                    key={months}
                                    onClick={() => setDurationMonths(months)}
                                    style={{
                                        flex: 1,
                                        height: '54px', // Tamaño más grande y de aspecto madera/verde
                                        backgroundImage: `url('${selected ? ASSET.ui.pill_green() : ASSET.ui.pill_brown()}')`,
                                        backgroundColor: 'transparent',
                                        backgroundSize: '100% 100%',
                                        backgroundPosition: 'center',
                                        backgroundRepeat: 'no-repeat',
                                        border: 'none',
                                        color: selected ? 'white' : '#fff0d4',
                                        fontWeight: '800',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.1s',
                                        filter: selected ? 'drop-shadow(0 4px 6px rgba(0,0,0,0.5))' : 'drop-shadow(0 2px 3px rgba(0,0,0,0.4))',
                                        textShadow: selected ? '1px 2px 2px rgba(0,80,0,0.6)' : '1px 2px 2px rgba(0,0,0,0.8)',
                                        transform: selected ? 'translateY(1px)' : 'none'
                                    }}
                                >
                                    {months} Meses
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
                marginTop: 'auto', // Pegar al fondo ocupando espacio disponible
                marginBottom: '20px'
            }}>
                <button
                    onClick={handleCreateGoal}
                    disabled={isLoading}
                    style={{
                        width: '94vw',
                        maxWidth: '460px', // Crecimiento masivo
                        height: '96px', // Altura mayor para que resalte
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
                        paddingBottom: '12px', // offset para la sombra inferiorde la base de la plataforma
                        transition: 'transform 0.1s active',
                        filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.3))'
                    }}
                >
                    <span style={{
                        color: 'white',
                        fontSize: '26px',
                        fontWeight: '900',
                        fontFamily: 'system-ui, sans-serif',
                        textShadow: '0px 2px 4px rgba(0,0,0,0.6), 0px -1px 1px rgba(0,100,0,0.8)'
                    }}>
                        {isLoading ? 'Creando...' : 'Crear Meta'}
                    </span>
                </button>
            </div>

        </div>
    );
};

export default SelectGoal;

import React, { useState, useEffect } from 'react'
import SelectGoal from './screens/SelectGoal'
import { API_BASE_URL } from './lib/config.js'

function App() {
    const [apiStatus, setApiStatus] = useState('Conectando...')
    // Vista actual: 'dashboard', 'selectGoal' o 'createGoal' (este último se dejará temporalmente por historia, pero usaremos selectGoal)
    const [currentView, setCurrentView] = useState('dashboard')

    // Estado de la meta guardada (leída de localStorage)
    const [savedGoal, setSavedGoal] = useState(null)

    // Estado del formulario
    const [goalName, setGoalName] = useState('')
    const [goalDuration, setGoalDuration] = useState('1')
    const [goalFreq, setGoalFreq] = useState('Mensual')
    const [goalPrivacy, setGoalPrivacy] = useState('Privada')

    // Estado de validación
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')

    // Cargar meta de localStorage al iniciar
    useEffect(() => {
        const storedGoal = localStorage.getItem('alcanciapp:goal')
        if (storedGoal) {
            try {
                setSavedGoal(JSON.parse(storedGoal))
            } catch (e) {
                console.error('Error parseando meta guardada:', e)
            }
        }
    }, [])

    useEffect(() => {
        fetch(`${API_BASE_URL}/health`)
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    setApiStatus('API conectada correctamente')
                } else {
                    setApiStatus('Error conectando con API')
                }
            })
            .catch(error => {
                console.error('Error fetching API:', error)
                setApiStatus('Error conectando con API')
            })
    }, [])

    const handleSaveGoal = (e) => {
        e.preventDefault()
        setFormError('')
        setFormSuccess('')

        if (!goalName.trim()) {
            setFormError('El nombre de la meta es obligatorio.')
            return
        }

        if (!goalDuration) {
            setFormError('Debe seleccionar la duración en meses.')
            return
        }

        const newGoal = {
            name: goalName.trim(),
            durationMonths: parseInt(goalDuration, 10),
            frequency: goalFreq,
            privacy: goalPrivacy,
            createdAt: new Date().toISOString()
        }

        // Guardar en localStorage
        localStorage.setItem('alcanciapp:goal', JSON.stringify(newGoal))
        setSavedGoal(newGoal)

        setFormSuccess(`¡Meta "${goalName}" guardada en modo ${goalPrivacy} para aportar de forma ${goalFreq} por ${goalDuration} mes(es)!`)

        // Limpiamos
        setGoalName('')
        setGoalDuration('1')
        setGoalFreq('Mensual')
        setGoalPrivacy('Privada')
    }

    const handleDeleteGoal = () => {
        localStorage.removeItem('alcanciapp:goal')
        setSavedGoal(null)
    }

    const handleBack = () => {
        setCurrentView('dashboard')
        setFormError('')
        setFormSuccess('')
    }

    const handleGoalCreated = (goalData) => {
        // Guardamos en local para la demo del panel
        localStorage.setItem('alcanciapp:goal', JSON.stringify(goalData))
        setSavedGoal(goalData)
        setCurrentView('dashboard')
    }

    // Estilos inline compartidos
    const inputStyle = {
        width: '100%',
        padding: '12px',
        marginBottom: '16px',
        border: '1px solid #ccc',
        borderRadius: '8px',
        fontSize: '16px',
        boxSizing: 'border-box'
    }

    const labelStyle = {
        display: 'block',
        marginBottom: '6px',
        fontWeight: 'bold',
        fontSize: '14px',
        color: '#444'
    }

    return (
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
            <h1>AlcanciApp (Web)</h1>

            {currentView === 'dashboard' ? (
                // --- VISTA DASHBOARD ---
                <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '16px' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>Mi Alcancía</h2>

                    {/* Botón de crear (se oculta si ya hay meta, opcional) 
                        Se dejó visible tal cual o si quieres ocultarlo:
                        Descomenta el !savedGoal */}

                    <button
                        onClick={() => setCurrentView('selectGoal')}
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: '#4CAF50',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            minHeight: '44px',
                            display: savedGoal ? 'none' : 'block'
                        }}>
                        Crear Meta de Ahorro
                    </button>

                    {/* Mostrar meta guardada si existe */}
                    {savedGoal && (
                        <div style={{ padding: '16px', backgroundColor: '#f9f9f9', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e0e0e0' }}>
                            <h3 style={{ fontSize: '16px', marginBottom: '12px', color: '#2c3e50' }}>Meta activa: {savedGoal.name}</h3>
                            <ul style={{ listStyleType: 'none', padding: 0, margin: 0, fontSize: '14px', color: '#555', lineHeight: '1.6' }}>
                                <li><strong>Duración:</strong> {savedGoal.durationMonths} mes(es)</li>
                                <li><strong>Frecuencia:</strong> {savedGoal.frequency}</li>
                                <li><strong>Privacidad:</strong> {savedGoal.privacy}</li>
                                <li><strong>Creada:</strong> {new Date(savedGoal.createdAt).toLocaleDateString()}</li>
                            </ul>

                            <button
                                onClick={handleDeleteGoal}
                                style={{
                                    width: '100%',
                                    marginTop: '16px',
                                    padding: '12px',
                                    backgroundColor: '#fff',
                                    color: '#d32f2f',
                                    border: '1px solid #d32f2f',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: 'bold',
                                    cursor: 'pointer'
                                }}>
                                Borrar meta
                            </button>
                        </div>
                    )}

                    {/* Estado de conexión a la API */}
                    <p style={{
                        marginTop: '24px',
                        textAlign: 'center',
                        fontWeight: 'bold',
                        fontSize: '14px',
                        color: apiStatus === 'API conectada correctamente' ? 'green' : (apiStatus === 'Error conectando con API' ? 'red' : 'gray')
                    }}>
                        {apiStatus}
                    </p>
                </div>
            ) : currentView === 'selectGoal' ? (
                <SelectGoal
                    onBack={() => setCurrentView('dashboard')}
                    onGoalCreated={handleGoalCreated}
                />
            ) : (
                // --- VISTA CREAR META ---
                <div style={{ padding: '24px', border: '1px solid #eee', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginTop: '16px' }}>
                    <h2 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>Nueva Meta de Ahorro</h2>

                    <form onSubmit={handleSaveGoal}>
                        <label style={labelStyle}>Nombre de la meta</label>
                        <input
                            type="text"
                            style={inputStyle}
                            placeholder="Ej. Vacaciones"
                            value={goalName}
                            onChange={(e) => setGoalName(e.target.value)}
                        />

                        <label style={labelStyle}>Duración (meses)</label>
                        <select style={inputStyle} value={goalDuration} onChange={(e) => setGoalDuration(e.target.value)}>
                            {[...Array(12)].map((_, i) => (
                                <option key={i + 1} value={i + 1}>{i + 1} mes(es)</option>
                            ))}
                        </select>

                        <label style={labelStyle}>Frecuencia de aporte</label>
                        <select style={inputStyle} value={goalFreq} onChange={(e) => setGoalFreq(e.target.value)}>
                            <option value="Diario">Diario</option>
                            <option value="Semanal">Semanal</option>
                            <option value="Quincenal">Quincenal</option>
                            <option value="Mensual">Mensual</option>
                        </select>

                        <label style={labelStyle}>Modo privacidad</label>
                        <select style={inputStyle} value={goalPrivacy} onChange={(e) => setGoalPrivacy(e.target.value)}>
                            <option value="Privada">Privada</option>
                            <option value="Compartida en círculo">Compartida en círculo</option>
                        </select>

                        {formError && (
                            <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                                {formError}
                            </p>
                        )}

                        {formSuccess && (
                            <div style={{ padding: '12px', backgroundColor: '#e8f5e9', border: '1px solid #4CAF50', borderRadius: '8px', marginBottom: '16px', color: '#2e7d32', fontSize: '14px', textAlign: 'center' }}>
                                {formSuccess}
                            </div>
                        )}

                        <button
                            type="submit"
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#2196F3',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                minHeight: '44px',
                                marginBottom: '12px'
                            }}>
                            Guardar (demo)
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#f5f5f5',
                                color: '#333',
                                border: '1px solid #ccc',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                minHeight: '44px'
                            }}>
                            Volver
                        </button>
                    </form>
                </div>
            )}
        </div>
    )
}

export default App

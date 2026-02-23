import React, { useState, useEffect } from 'react'
import { ASSET } from './lib/assets.js'

function App() {
    const [apiStatus, setApiStatus] = useState('Conectando...')
    // Vista actual: 'login', 'dashboard' o 'createGoal'
    const [currentView, setCurrentView] = useState('login')

    // Estado del login
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [loginError, setLoginError] = useState('')

    // Estado del formulario
    const [goalName, setGoalName] = useState('')
    const [goalDuration, setGoalDuration] = useState('1')
    const [goalFreq, setGoalFreq] = useState('Mensual')
    const [goalPrivacy, setGoalPrivacy] = useState('Privada')
    // Estado de validación
    const [formError, setFormError] = useState('')
    const [formSuccess, setFormSuccess] = useState('')
    useEffect(() => {
        fetch('https://alcanciapp-api.fliaprince.workers.dev/health')
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

    // --- MANEJADORES DE LOGIN ---
    const handleLogin = (e) => {
        e.preventDefault()
        setLoginError('')
        if (!loginEmail.trim() || !loginPassword.trim()) {
            setLoginError('Por favor ingresa correo y contraseña.')
            return
        }
        // Simulación de Auth
        setCurrentView('dashboard')
    }
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
        setFormSuccess(`¡Meta "${goalName}" guardada en modo ${goalPrivacy} para aportar de forma ${goalFreq} por ${goalDuration} mes(es)!`)
        // Limpiamos
        setGoalName('')
        setGoalDuration('1')
        setGoalFreq('Mensual')
        setGoalPrivacy('Privada')
    }
    const handleBack = () => {
        setCurrentView('dashboard')
        setFormError('')
        setFormSuccess('')
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

    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768)

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 768)
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    if (currentView === 'login') {
        const bgGradient = 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 60%, rgba(10,12,20,0.85) 100%)'
        const bgImage = 'url(/assets/bg/ui/bg_ui_home_sunrise.jpg)'

        return (
            <div style={{
                minHeight: '100vh',
                backgroundImage: `${bgGradient}, ${bgImage}`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: isDesktop ? 'center top' : 'center',
                backgroundColor: isDesktop ? 'rgba(10,12,20,0.85)' : 'transparent', // fallback final color
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px',
                fontFamily: 'sans-serif'
            }}>
                <div style={{
                    width: '100%',
                    maxWidth: '380px',
                    maxHeight: '85vh',
                    overflow: 'auto',
                    backgroundColor: 'rgba(255, 255, 255, 0.72)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255, 215, 130, 0.55)',
                    borderRadius: '22px',
                    padding: '24px 20px',
                    boxShadow: '0 18px 60px rgba(0,0,0,0.25), inset 0 0 0 1px rgba(255,255,255,0.35)',
                    textAlign: 'center'
                }}>
                    <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'center' }}>
                        <div style={{
                            padding: '14px 18px',
                            display: 'inline-block'
                        }}>
                            <img
                                src={ASSET.logo()}
                                alt="AlcanciApp Logo"
                                style={{
                                    width: '100%',
                                    maxWidth: '240px',
                                    minWidth: '180px',
                                    height: 'auto',
                                    display: 'block',
                                    filter: 'drop-shadow(0 14px 30px rgba(0,0,0,0.35)) drop-shadow(0 0 18px rgba(255, 210, 90, 0.45))'
                                }}
                            />
                        </div>
                    </div>

                    <h2 style={{ fontSize: '22px', marginBottom: '24px', color: '#333' }}>Bienvenido de nuevo</h2>

                    <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
                        <label style={labelStyle}>Correo electrónico</label>
                        <input
                            type="email"
                            style={inputStyle}
                            placeholder="tu@correo.com"
                            value={loginEmail}
                            onChange={(e) => setLoginEmail(e.target.value)}
                        />

                        <label style={labelStyle}>Contraseña</label>
                        <input
                            type="password"
                            style={inputStyle}
                            placeholder="••••••••"
                            value={loginPassword}
                            onChange={(e) => setLoginPassword(e.target.value)}
                        />

                        {loginError && (
                            <p style={{ color: 'red', fontSize: '14px', marginBottom: '16px', textAlign: 'center', fontWeight: 'bold' }}>
                                {loginError}
                            </p>
                        )}

                        <button
                            type="submit"
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
                                marginBottom: '16px',
                                cursor: 'pointer'
                            }}>
                            INICIAR SESIÓN
                        </button>
                    </form>

                    <button
                        type="button"
                        style={{
                            width: '100%',
                            padding: '16px',
                            backgroundColor: 'transparent',
                            color: '#4CAF50',
                            border: '2px solid #4CAF50',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: 'bold',
                            minHeight: '44px',
                            marginBottom: '16px',
                            cursor: 'pointer'
                        }}>
                        CREAR CUENTA
                    </button>

                    <a href="#" style={{ color: '#666', fontSize: '14px', textDecoration: 'none' }}>
                        ¿Olvidaste tu contraseña?
                    </a>
                </div>
            </div>
        )
    }

    return (
        <div style={{
            minHeight: '100vh',
            backgroundImage: currentView === 'dashboard' ? `linear-gradient(rgba(240, 245, 250, 0.9), rgba(240, 245, 250, 0.9)), url(${ASSET.bg('bg_ui_dashboard.jpg')})` :
                currentView === 'createGoal' ? `linear-gradient(rgba(240, 245, 250, 0.9), rgba(240, 245, 250, 0.9)), url(${ASSET.bg('bg_ui_create_goal.jpg')})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundAttachment: 'fixed',
            padding: '16px',
            fontFamily: 'sans-serif',
            color: '#333'
        }}>
            <div style={{ maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', backgroundColor: 'rgba(255,255,255,0.8)', padding: '16px', borderRadius: '16px', backdropFilter: 'blur(10px)' }}>
                    <img
                        src={ASSET.logo()}
                        alt="AlcanciApp"
                        style={{ width: '140px', height: 'auto' }}
                    />
                </div>

                {currentView === 'dashboard' ? (
                    // --- VISTA DASHBOARD ---
                    <div style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
                        <h2 style={{ fontSize: '22px', marginBottom: '8px', color: '#1a1a1a' }}>Mi Alcancía</h2>
                        <p style={{ color: '#666', marginBottom: '20px', fontSize: '14px' }}>Tus metas de ahorro activas</p>

                        {/* Demo de una Meta en el Dashboard */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#fff',
                            padding: '16px',
                            borderRadius: '16px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                            marginBottom: '24px',
                            border: '1px solid #eee'
                        }}>
                            <img src={ASSET.goal('goal_custom.png', 256)} alt="Icono de meta" style={{ width: '60px', height: '60px', marginRight: '16px', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} />
                            <div>
                                <h3 style={{ fontSize: '18px', margin: '0 0 6px 0', color: '#2c3e50' }}>{goalName || "Mi primera meta"}</h3>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', backgroundColor: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{goalFreq || "Mensual"}</span>
                                    <span style={{ fontSize: '12px', backgroundColor: '#e8f5e9', color: '#2e7d32', padding: '4px 8px', borderRadius: '12px', fontWeight: 'bold' }}>{goalPrivacy || "Privada"}</span>
                                </div>
                            </div>
                        </div>

                        {/* Botón original */}
                        <button
                            onClick={() => setCurrentView('createGoal')}
                            style={{
                                width: '100%',
                                padding: '16px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                minHeight: '44px'
                            }}>
                            Crear Meta de Ahorro
                        </button>
                        {/* Estado de conexión a la API */}
                        <p style={{
                            marginTop: '16px',
                            textAlign: 'center',
                            fontWeight: 'bold',
                            fontSize: '14px',
                            color: apiStatus === 'API conectada correctamente' ? 'green' : (apiStatus === 'Error conectando con API' ? 'red' : 'gray')
                        }}>
                            {apiStatus}
                        </p>
                    </div>
                ) : (
                    // --- VISTA CREAR META ---
                    <div style={{ padding: '24px', backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid rgba(255,255,255,0.5)', borderRadius: '20px', boxShadow: '0 8px 32px rgba(0,0,0,0.1)', backdropFilter: 'blur(10px)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #eee' }}>
                            <img src={ASSET.goal('goal_custom.png', 256)} alt="Nueva Meta" style={{ width: '48px', height: '48px', marginRight: '16px' }} />
                            <h2 style={{ fontSize: '20px', margin: 0, color: '#2c3e50' }}>Nueva Meta de Ahorro</h2>
                        </div>
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
        </div>
    )
}
export default App
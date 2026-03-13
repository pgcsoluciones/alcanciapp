import React, { useState, useEffect } from 'react'
import SelectGoal from './screens/SelectGoal'
import Login from './screens/Login'
import Register from './screens/Register'
import Dashboard from './screens/Dashboard'
import GoalDetail from './screens/GoalDetail'
import { API_BASE_URL } from './lib/config.js'

function App() {
    const [apiStatus, setApiStatus] = useState('Conectando...')
    const [token, setToken] = useState(localStorage.getItem('alcanciapp:token') || null)
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('alcanciapp:user') || 'null'))

    // Vista actual
    const [currentView, setCurrentView] = useState(!token ? 'login' : 'dashboard')

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

    const handleLoginSuccess = (newToken, newUser) => {
        localStorage.setItem('alcanciapp:token', newToken)
        localStorage.setItem('alcanciapp:user', JSON.stringify(newUser))
        setToken(newToken)
        setUser(newUser)
        setCurrentView('dashboard')
    }

    const handleLogout = () => {
        localStorage.removeItem('alcanciapp:token')
        localStorage.removeItem('alcanciapp:user')
        setToken(null)
        setUser(null)
        setCurrentView('login')
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

            {currentView === 'login' ? (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onGoToRegister={() => setCurrentView('register')}
                />
            ) : currentView === 'register' ? (
                <Register
                    onGoToLogin={() => setCurrentView('login')}
                />
            ) : currentView === 'dashboard' ? (
                <Dashboard
                    onLogout={handleLogout}
                    onGoToCreate={() => setCurrentView('selectGoal')}
                    onGoToDetail={(id) => {
                        // Navegación a detalle de meta, por ahora se loguea
                        console.log('Navigating to detail: ', id);
                        setCurrentView(`detail:${id}`);
                    }}
                />
            ) : currentView === 'selectGoal' ? (
                <SelectGoal
                    onBack={() => setCurrentView('dashboard')}
                    onGoalCreated={(goalData) => {
                        setCurrentView('dashboard') // Se refrescará la lista automáticamente al montarse Dashboard
                    }}
                />
            ) : currentView.startsWith('detail:') ? (
                <GoalDetail
                    goalId={currentView.split(':')[1]}
                    onBack={() => setCurrentView('dashboard')}
                />
            ) : (
                <div />
            )}
        </div>
    )
}

export default App

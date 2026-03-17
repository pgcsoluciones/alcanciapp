import React, { useState, useEffect } from 'react'
import SelectGoal from './screens/SelectGoal'
import Login from './screens/Login'
import Register from './screens/Register'
import Dashboard from './screens/Dashboard'
import GoalDetail from './screens/GoalDetail'
import { API_BASE_URL } from './lib/config.js'
import Sidebar from './components/Sidebar'
import Profile from './screens/Profile'
import ActiveGoals from './screens/ActiveGoals'
import Achievements from './screens/Achievements'
import GoalLevels from './screens/GoalLevels'
import Coach from './screens/Coach'
import ChallengesCircles from './screens/ChallengesCircles'

function App() {
    const [apiStatus, setApiStatus] = useState('Conectando...')
    const [token, setToken] = useState(localStorage.getItem('alcanciapp:token') || null)
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('alcanciapp:user') || 'null'))

    // Estado del menú lateral
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)

    // Vista actual
    const [currentView, setCurrentView] = useState(!token ? 'login' : 'dashboard')

    // Privacidad (Modo Real) - 5 minutos
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [unlockUntil, setUnlockUntil] = useState(null)

    // Estado de la meta guardada (leída de localStorage)
    const [savedGoal, setSavedGoal] = useState(null)

    // Timer para reset de privacidad
    useEffect(() => {
        if (!isUnlocked || !unlockUntil) return

        const interval = setInterval(() => {
            if (new Date() >= new Date(unlockUntil)) {
                setIsUnlocked(false)
                setUnlockUntil(null)
            }
        }, 1000);

        return () => clearInterval(interval)
    }, [isUnlocked, unlockUntil])

    const handleUnlock = (until) => {
        const unlockDate = until ? new Date(until) : null
        if (!unlockDate || Number.isNaN(unlockDate.getTime()) || unlockDate <= new Date()) {
            setUnlockUntil(null)
            setIsUnlocked(false)
            return
        }

        setUnlockUntil(until)
        setIsUnlocked(true)
    }

    const handleHideAmounts = () => {
        setIsUnlocked(false)
        setUnlockUntil(null)
    }

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

    const handleUpdateUser = (updatedUser) => {
        localStorage.setItem('alcanciapp:user', JSON.stringify(updatedUser))
        setUser(updatedUser)
    }

    const handleNavigate = (view) => {
        setCurrentView(view)
        window.scrollTo(0, 0)
    }

    return (
        <div style={{ maxWidth: '480px', margin: '0 auto', fontFamily: 'sans-serif' }}>
            {token && (
                <Sidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    onNavigate={handleNavigate}
                    user={user}
                    onLogout={handleLogout}
                />
            )}

            {currentView === 'login' ? (
                <Login
                    onLoginSuccess={handleLoginSuccess}
                    onGoToRegister={() => setCurrentView('register')}
                />
            ) : currentView === 'register' ? (
                <Register
                    onLoginSuccess={handleLoginSuccess}
                    onGoToLogin={() => setCurrentView('login')}
                />
            ) : currentView === 'dashboard' ? (
                <Dashboard
                    user={user}
                    isUnlocked={isUnlocked}
                    onUnlock={handleUnlock}
                    onHideAmounts={handleHideAmounts}
                    onOpenMenu={() => setIsSidebarOpen(true)}
                    onLogout={handleLogout}
                    onGoToCreate={() => handleNavigate('selectGoal')}
                    onGoToDetail={(id) => {
                        handleNavigate(`detail:${id}`);
                    }}
                />
            ) : currentView === 'selectGoal' ? (
                <SelectGoal
                    onBack={() => handleNavigate('dashboard')}
                    onGoalCreated={(goalData) => {
                        handleNavigate('dashboard')
                    }}
                />
            ) : currentView.startsWith('detail:') ? (
                <GoalDetail
                    goalId={currentView.split(':')[1]}
                    isUnlocked={isUnlocked}
                    onUnlock={handleUnlock}
                    onHideAmounts={handleHideAmounts}
                    onBack={() => handleNavigate('dashboard')}
                />
            ) : currentView === 'profile' ? (
                <Profile
                    user={user}
                    onSave={handleUpdateUser}
                    onBack={() => handleNavigate('dashboard')}
                />
            ) : currentView === 'activeGoals' || currentView === 'registrarAporte' ? (
                <ActiveGoals
                    onBack={() => handleNavigate('dashboard')}
                    onSelectGoal={(id) => handleNavigate(`detail:${id}`)}
                />
            ) : currentView === 'achievements' ? (
                <Achievements onBack={() => handleNavigate('dashboard')} />
            ) : currentView === 'goalLevels' ? (
                <GoalLevels onBack={() => handleNavigate('dashboard')} />
            ) : currentView === 'coach' ? (
                <Coach onBack={() => handleNavigate('dashboard')} />
            ) : currentView === 'challenges' ? (
                <ChallengesCircles type="challenges" onBack={() => handleNavigate('dashboard')} />
            ) : currentView === 'circles' ? (
                <ChallengesCircles type="circles" onBack={() => handleNavigate('dashboard')} />
            ) : (
                <div />
            )}
        </div>
    )
}

export default App;

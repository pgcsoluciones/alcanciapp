import React, { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import SelectGoal from './screens/SelectGoal'
import Login from './screens/Login'
import Register from './screens/Register'
import Dashboard from './screens/Dashboard'
import GoalDetail from './screens/GoalDetail'
import { API_BASE_URL } from './lib/config.js'
import Sidebar from './components/Sidebar'
import Profile from './screens/Profile'
import ActiveGoals from './screens/ActiveGoals'
import ArchivedGoals from './screens/ArchivedGoals'
import Achievements from './screens/Achievements'
import GoalLevels from './screens/GoalLevels'
import Coach from './screens/Coach'
import ChallengesCircles from './screens/ChallengesCircles'
import SuperAdminDashboard from './screens/SuperAdminDashboard.jsx'

function App() {
    const [token, setToken] = useState(localStorage.getItem('alcanciapp:token') || null)
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('alcanciapp:user') || 'null'))

    const isSuperAdminMode = useMemo(() => {
        const params = new URLSearchParams(window.location.search)
        return params.get('superadmin') === '1'
    }, [])

    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const [currentView, setCurrentView] = useState(!token ? 'login' : 'dashboard')
    const [isUnlocked, setIsUnlocked] = useState(false)
    const [unlockUntil, setUnlockUntil] = useState(null)

    useEffect(() => {
        document.body.classList.toggle('superadmin-mode', isSuperAdminMode)
        return () => {
            document.body.classList.remove('superadmin-mode')
        }
    }, [isSuperAdminMode])

    useEffect(() => {
        if (!isUnlocked || !unlockUntil) return

        const interval = setInterval(() => {
            if (new Date() >= new Date(unlockUntil)) {
                setIsUnlocked(false)
                setUnlockUntil(null)
            }
        }, 1000)

        return () => clearInterval(interval)
    }, [isUnlocked, unlockUntil])

    useEffect(() => {
        if (!token) return

        let cancelled = false

        const syncProfile = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/profile`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })

                const data = await res.json().catch(() => ({}))

                if (!res.ok || !data.ok) {
                    const isInvalidSession =
                        res.status === 401 || data?.error === 'Invalid or expired session'

                    if (!isInvalidSession || cancelled) return

                    localStorage.removeItem('alcanciapp:token')
                    localStorage.removeItem('alcanciapp:user')
                    setToken(null)
                    setUser(null)
                    setCurrentView('login')
                    return
                }

                if (cancelled) return

                const profile = data.profile || null
                localStorage.setItem('alcanciapp:user', JSON.stringify(profile))
                setUser(profile)
            } catch (e) {
                // no-op
            }
        }

        syncProfile()

        return () => {
            cancelled = true
        }
    }, [token])

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

        if (isSuperAdminMode) {
            window.location.href = window.location.pathname
            return
        }

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

    if (isSuperAdminMode) {
        const superAdminNode = !token ? (
            <div
                style={{
                    minHeight: '100vh',
                    width: '100vw',
                    display: 'grid',
                    placeItems: 'center',
                    background: '#f5f7fb',
                    padding: 24,
                    fontFamily: 'sans-serif'
                }}
            >
                <div
                    style={{
                        width: '100%',
                        maxWidth: 520,
                        background: '#ffffff',
                        border: '1px solid #e5e7eb',
                        borderRadius: 18,
                        padding: 24,
                        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
                    }}
                >
                    <div style={{ fontSize: 28, fontWeight: 800, color: '#14213d' }}>
                        Super Admin
                    </div>
                    <div style={{ color: '#6b7280', marginTop: 8, lineHeight: 1.5 }}>
                        Primero inicia sesión en la app con un usuario que tenga rol administrativo
                        y luego vuelve a abrir esta vista con <strong>?superadmin=1</strong>.
                    </div>
                    <button
                        onClick={() => {
                            window.location.href = window.location.pathname
                        }}
                        style={{
                            marginTop: 18,
                            border: 'none',
                            borderRadius: 12,
                            padding: '12px 16px',
                            background: '#14213d',
                            color: '#ffffff',
                            fontWeight: 700,
                            cursor: 'pointer',
                        }}
                    >
                        Ir a la app normal
                    </button>
                </div>
            </div>
        ) : (
            <div
                className="superadmin-app-shell"
                style={{
                    width: '100vw',
                    minHeight: '100vh',
                    margin: 0,
                    padding: 0
                }}
            >
                <SuperAdminDashboard token={token} onLogout={handleLogout} />
            </div>
        )

        return createPortal(superAdminNode, document.body)
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
                    onNavigate={handleNavigate}
                    onGoToCreate={() => handleNavigate('selectGoal')}
                    onGoToDetail={(id) => {
                        handleNavigate(`detail:${id}`)
                    }}
                />
            ) : currentView === 'selectGoal' ? (
                <SelectGoal
                    onBack={() => handleNavigate('dashboard')}
                    onGoalCreated={() => {
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
            ) : currentView === 'archivedGoals' ? (
                <ArchivedGoals
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

export default App

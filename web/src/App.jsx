import React, { useState, useEffect } from 'react'
import { API_BASE_URL } from './lib/config'

function App() {
  const [apiStatus, setApiStatus] = useState('Conectando...')

  // Vista actual: 'dashboard' o 'createGoal'
  const [currentView, setCurrentView] = useState('dashboard')

  // Estado del formulario
  const [goalName, setGoalName] = useState('')
  const [goalDuration, setGoalDuration] = useState('1')
  const [goalFreq, setGoalFreq] = useState('Mensual')
  const [goalPrivacy, setGoalPrivacy] = useState('Privada')

  // Estado de validación
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')

  useEffect(() => {
    const ensureSession = async () => {
      const existing = localStorage.getItem('alcanciapp_token')
      if (existing) return existing

      const r = await fetch(`${API_BASE_URL}/api/v1/auth/anonymous`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const j = await r.json().catch(() => ({}))
      if (!r.ok || !j.ok || !j.token) throw new Error(j?.error || 'No se pudo crear sesión')

      localStorage.setItem('alcanciapp_token', j.token)
      return j.token
    }

    fetch(`${API_BASE_URL}/health`)
      .then((response) => response.json())
      .then(async (data) => {
        if (data.ok) {
          setApiStatus('API conectada correctamente')
          try {
            await ensureSession()
          } catch (err) {
            console.error('Session error:', err)
            setApiStatus('Error creando sesión')
          }
        } else {
          setApiStatus('Error conectando con API')
        }
      })
      .catch((error) => {
        console.error('Error fetching API:', error)
        setApiStatus('Error conectando con API')
      })
  }, [])

  const handleSaveGoal = async (e) => {
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

    try {
      const token = localStorage.getItem('alcanciapp_token')
      if (!token) {
        setFormError('No hay sesión activa. Recarga la página.')
        return
      }

      const payload = {
        name: goalName.trim(),
        duration_months: Number(goalDuration),
        frequency: goalFreq,
        privacy: goalPrivacy
      }

      const r = await fetch(`${API_BASE_URL}/api/v1/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      const j = await r.json().catch(() => ({}))

      if (!r.ok || j?.ok === false) {
        throw new Error(j?.error || `No se pudo crear la meta (${r.status})`)
      }

      setFormSuccess('✅ Meta creada correctamente.')

      // Limpiamos
      setGoalName('')
      setGoalDuration('1')
      setGoalFreq('Mensual')
      setGoalPrivacy('Privada')

      // Volvemos al dashboard
      setCurrentView('dashboard')
    } catch (err) {
      console.error(err)
      setFormError(err?.message || 'Error creando la meta')
    }
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

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px', fontFamily: 'sans-serif' }}>
      <h1>AlcanciApp (Web)</h1>

      {currentView === 'dashboard' ? (
        // --- VISTA DASHBOARD ---
        <div
          style={{
            padding: '24px',
            border: '1px solid #eee',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: '16px'
          }}
        >
          <h2 style={{ fontSize: '18px', marginBottom: '16px', textAlign: 'center' }}>Mi Alcancía</h2>

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
            }}
          >
            Crear Meta de Ahorro
          </button>

          {/* Estado de conexión a la API */}
          <p
            style={{
              marginTop: '16px',
              textAlign: 'center',
              fontWeight: 'bold',
              fontSize: '14px',
              color:
                apiStatus === 'API conectada correctamente'
                  ? 'green'
                  : apiStatus === 'Error conectando con API' || apiStatus === 'Error creando sesión'
                    ? 'red'
                    : 'gray'
            }}
          >
            {apiStatus}
          </p>
        </div>
      ) : (
        // --- VISTA CREAR META ---
        <div
          style={{
            padding: '24px',
            border: '1px solid #eee',
            borderRadius: '12px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            marginTop: '16px'
          }}
        >
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
                <option key={i + 1} value={i + 1}>
                  {i + 1} mes(es)
                </option>
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
              <p
                style={{
                  color: 'red',
                  fontSize: '14px',
                  marginBottom: '16px',
                  textAlign: 'center',
                  fontWeight: 'bold'
                }}
              >
                {formError}
              </p>
            )}

            {formSuccess && (
              <div
                style={{
                  padding: '12px',
                  backgroundColor: '#e8f5e9',
                  border: '1px solid #4CAF50',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  color: '#2e7d32',
                  fontSize: '14px',
                  textAlign: 'center'
                }}
              >
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
              }}
            >
              Guardar
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
              }}
            >
              Volver
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default App
import React, { useEffect, useMemo, useState } from 'react'
import { API_BASE_URL } from '../lib/config.js'
import SuperAdminLayout from '../components/SuperAdminLayout.jsx'

function MetricCard({ label, value, hint }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 20,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ fontSize: 13, color: '#6b7280', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 10 }}>{value}</div>
      {hint ? <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 10 }}>{hint}</div> : null}
    </div>
  )
}

function SuperAdminDashboard({ token, onLogout }) {
  const [section, setSection] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [data, setData] = useState(null)

  useEffect(() => {
    let cancelled = false

    const loadOverview = async () => {
      try {
        setLoading(true)
        setError('')

        const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/metrics/overview`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const json = await res.json().catch(() => ({}))

        if (!res.ok || !json?.ok) {
          throw new Error(json?.error || 'No se pudo cargar el dashboard de Super Admin')
        }

        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Error cargando dashboard')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadOverview()

    return () => {
      cancelled = true
    }
  }, [token])

  const metrics = data?.metrics || {}
  const latestUsers = useMemo(() => data?.latest_users || [], [data])

  return (
    <SuperAdminLayout
      currentSection={section}
      onNavigate={setSection}
      onLogout={onLogout}
    >
      {section !== 'dashboard' ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: 24,
          }}
        >
          <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            {section}
          </div>
          <div style={{ color: '#6b7280' }}>
            Este módulo se conectará en el siguiente bloque.
          </div>
        </div>
      ) : loading ? (
        <div
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 18,
            padding: 24,
          }}
        >
          Cargando métricas de Super Admin...
        </div>
      ) : error ? (
        <div
          style={{
            background: '#fff7ed',
            border: '1px solid #fdba74',
            color: '#9a3412',
            borderRadius: 18,
            padding: 24,
            fontWeight: 700,
          }}
        >
          {error}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <div style={{ fontSize: 30, fontWeight: 800 }}>Dashboard ejecutivo</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 8 }}>
              Vista general de usuarios, metas, monetización y crecimiento.
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 18,
            }}
          >
            <MetricCard label="Usuarios registrados" value={metrics.users_total ?? 0} hint="Base total actual" />
            <MetricCard label="Metas activas" value={metrics.goals_active_total ?? 0} hint="Objetivos en curso" />
            <MetricCard label="Metas archivadas" value={metrics.goals_archived_total ?? 0} hint="Histórico cerrado" />
            <MetricCard label="Admins activos" value={metrics.admins_total ?? 0} hint="Roles administrativos vigentes" />
            <MetricCard label="Códigos de compra" value={metrics.purchase_codes_total ?? 0} hint="Inventario generado" />
            <MetricCard label="Suscripciones activas" value={metrics.subscriptions_active_total ?? 0} hint="Planes premium/sponsored activos" />
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: 18,
              padding: 22,
              boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
            }}
          >
            <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 14 }}>
              Usuarios recientes
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Nombre</th>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Correo</th>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Plan</th>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>País</th>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Dispositivo</th>
                    <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Registro</th>
                  </tr>
                </thead>
                <tbody>
                  {latestUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '18px 10px', color: '#6b7280' }}>
                        No hay usuarios recientes para mostrar.
                      </td>
                    </tr>
                  ) : (
                    latestUsers.map((user) => (
                      <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '14px 10px', fontWeight: 700 }}>{user.name || 'Sin alias'}</td>
                        <td style={{ padding: '14px 10px' }}>{user.email_masked || 'Sin correo'}</td>
                        <td style={{ padding: '14px 10px' }}>{user.current_plan_code || 'free'}</td>
                        <td style={{ padding: '14px 10px' }}>{user.registration_country_code || '—'}</td>
                        <td style={{ padding: '14px 10px' }}>{user.registration_device_type || '—'}</td>
                        <td style={{ padding: '14px 10px' }}>{user.created_at || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </SuperAdminLayout>
  )
}

export default SuperAdminDashboard

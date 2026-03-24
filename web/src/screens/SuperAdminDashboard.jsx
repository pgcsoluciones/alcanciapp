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

function SectionCard({ title, subtitle, children }) {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 18,
        padding: 22,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{title}</div>
      {subtitle ? (
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 18 }}>{subtitle}</div>
      ) : null}
      {children}
    </div>
  )
}

function AdminUsersSection({ token }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [form, setForm] = useState({
    user_id: '',
    role: 'admin_support',
    status: 'active',
  })

  const loadAdmins = async () => {
    try {
      setLoading(true)
      setError('')

      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/admin-users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo cargar la lista de admins')
      }

      setItems(json.items || [])
    } catch (err) {
      setError(err.message || 'Error cargando admins')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAdmins()
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/admin-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      const json = await res.json().catch(() => ({}))

      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo crear el admin')
      }

      setSuccess('Admin creado correctamente')
      setForm({
        user_id: '',
        role: 'admin_support',
        status: 'active',
      })

      await loadAdmins()
    } catch (err) {
      setError(err.message || 'Error creando admin')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <SectionCard
        title="Agregar admin"
        subtitle="Crea un usuario administrativo usando un user_id existente."
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              User ID
            </label>
            <input
              type="text"
              value={form.user_id}
              onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
              placeholder="UUID del usuario existente"
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Rol
            </label>
            <select
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="super_admin">super_admin</option>
              <option value="admin_support">admin_support</option>
              <option value="admin_analyst">admin_analyst</option>
              <option value="admin_viewer">admin_viewer</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
              Estado
            </label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
              style={{
                width: '100%',
                border: '1px solid #d1d5db',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 14,
                outline: 'none',
                background: '#fff',
              }}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </select>
          </div>

          {error ? (
            <div
              style={{
                background: '#fff7ed',
                border: '1px solid #fdba74',
                color: '#9a3412',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {error}
            </div>
          ) : null}

          {success ? (
            <div
              style={{
                background: '#ecfdf5',
                border: '1px solid #86efac',
                color: '#166534',
                borderRadius: 12,
                padding: '12px 14px',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              {success}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            style={{
              border: 'none',
              borderRadius: 12,
              padding: '12px 16px',
              background: '#14213d',
              color: '#ffffff',
              fontWeight: 700,
              cursor: 'pointer',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? 'Guardando...' : 'Crear admin'}
          </button>
        </form>
      </SectionCard>

      <SectionCard
        title="Admins actuales"
        subtitle="Listado de roles administrativos activos e inactivos."
      >
        {loading ? (
          <div style={{ color: '#6b7280' }}>Cargando admins...</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Nombre</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Correo</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Rol</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Estado</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>User ID</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Creado</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: '18px 10px', color: '#6b7280' }}>
                      No hay admins registrados.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '14px 10px', fontWeight: 700 }}>{item.name || 'Sin alias'}</td>
                      <td style={{ padding: '14px 10px' }}>{item.email_masked || 'Sin correo'}</td>
                      <td style={{ padding: '14px 10px' }}>{item.role}</td>
                      <td style={{ padding: '14px 10px' }}>{item.status}</td>
                      <td style={{ padding: '14px 10px', fontFamily: 'monospace', fontSize: 12 }}>{item.user_id}</td>
                      <td style={{ padding: '14px 10px' }}>{item.created_at || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>
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
      {section === 'roles' || section === 'admins' || section === 'Roles / Admins' ? (
        <AdminUsersSection token={token} />
      ) : section !== 'dashboard' ? (
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

          <SectionCard title="Usuarios recientes">
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
          </SectionCard>
        </div>
      )}
    </SuperAdminLayout>
  )
}

export default SuperAdminDashboard
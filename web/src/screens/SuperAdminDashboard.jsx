import { useEffect, useMemo, useState } from 'react'
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

function SectionCard({ title, subtitle, children, actions }) {
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
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: subtitle ? 18 : 12,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 13, color: '#6b7280' }}>{subtitle}</div>
          ) : null}
        </div>
        {actions ? <div>{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}

function Notice({ tone = 'neutral', children }) {
  const tones = {
    neutral: {
      background: '#f8fafc',
      border: '#e2e8f0',
      color: '#334155',
    },
    success: {
      background: '#ecfdf5',
      border: '#86efac',
      color: '#166534',
    },
    warning: {
      background: '#fff7ed',
      border: '#fdba74',
      color: '#9a3412',
    },
  }

  const style = tones[tone] || tones.neutral

  return (
    <div
      style={{
        background: style.background,
        border: `1px solid ${style.border}`,
        color: style.color,
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {children}
    </div>
  )
}

function Field({ label, children, hint }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
        {label}
      </label>
      {children}
      {hint ? (
        <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6 }}>
          {hint}
        </div>
      ) : null}
    </div>
  )
}

function TextInput(props) {
  return (
    <input
      {...props}
      style={{
        width: '100%',
        border: '1px solid #d1d5db',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        ...(props.style || {}),
      }}
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      style={{
        width: '100%',
        border: '1px solid #d1d5db',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        resize: 'vertical',
        minHeight: 90,
        ...(props.style || {}),
      }}
    />
  )
}

function SelectInput(props) {
  return (
    <select
      {...props}
      style={{
        width: '100%',
        border: '1px solid #d1d5db',
        borderRadius: 12,
        padding: '12px 14px',
        fontSize: 14,
        outline: 'none',
        background: '#fff',
        ...(props.style || {}),
      }}
    />
  )
}

function PrimaryButton({ children, disabled, onClick, type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: 'none',
        borderRadius: 12,
        padding: '12px 16px',
        background: '#14213d',
        color: '#ffffff',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, disabled, onClick, type = 'button', style }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        border: '1px solid #cbd5e1',
        borderRadius: 12,
        padding: '12px 16px',
        background: '#ffffff',
        color: '#0f172a',
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

function translateMode(value) {
  if (value === 'disabled') return 'Desactivado'
  if (value === 'optional') return 'Opcional'
  if (value === 'required') return 'Requerido'
  return value || '—'
}

function translateBatchStatus(value) {
  if (value === 'draft') return 'Borrador'
  if (value === 'active') return 'Activo'
  if (value === 'inactive') return 'Inactivo'
  if (value === 'closed') return 'Cerrado'
  return value || '—'
}

function translateCodeStatus(value) {
  if (value === 'available') return 'Disponible'
  if (value === 'assigned') return 'Asignado'
  if (value === 'used') return 'Usado'
  if (value === 'disabled') return 'Deshabilitado'
  if (value === 'expired') return 'Expirado'
  return value || '—'
}

function MiniStat({ label, value, tone = 'neutral' }) {
  const palette = {
    neutral: { bg: '#ffffff', border: '#e5e7eb', text: '#0f172a', label: '#64748b' },
    primary: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8', label: '#1e40af' },
    success: { bg: '#ecfdf5', border: '#86efac', text: '#166534', label: '#15803d' },
    warning: { bg: '#fff7ed', border: '#fdba74', text: '#9a3412', label: '#c2410c' },
  }

  const style = palette[tone] || palette.neutral

  return (
    <div
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        borderRadius: 12,
        padding: 12,
      }}
    >
      <div style={{ fontSize: 11, color: style.label, fontWeight: 800, letterSpacing: 0.2 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, marginTop: 6, color: style.text }}>
        {value}
      </div>
    </div>
  )
}

function StatusPill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#f1f5f9', color: '#334155', border: '#cbd5e1' },
    success: { bg: '#ecfdf5', color: '#166534', border: '#86efac' },
    warning: { bg: '#fff7ed', color: '#9a3412', border: '#fdba74' },
    primary: { bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  }

  const style = tones[tone] || tones.neutral

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 800,
        background: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
    >
      {children}
    </span>
  )
}

function Chevron({ expanded }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 28,
        height: 28,
        borderRadius: 999,
        background: expanded ? '#14213d' : '#f1f5f9',
        color: expanded ? '#ffffff' : '#0f172a',
        fontSize: 16,
        fontWeight: 900,
        transition: 'all 0.2s ease',
      }}
    >
      {expanded ? '−' : '+'}
    </span>
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
        throw new Error(json?.error || 'No se pudo cargar la lista de administradores')
      }

      setItems(json.items || [])
    } catch (err) {
      setError(err.message || 'Error cargando administradores')
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
        throw new Error(json?.error || 'No se pudo crear el administrador')
      }

      setSuccess('Administrador creado correctamente')
      setForm({
        user_id: '',
        role: 'admin_support',
        status: 'active',
      })

      await loadAdmins()
    } catch (err) {
      setError(err.message || 'Error creando administrador')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
      <SectionCard
        title="Agregar administrador"
        subtitle="Crea un usuario administrativo usando un user_id existente."
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Field label="User ID">
            <TextInput
              type="text"
              value={form.user_id}
              onChange={(e) => setForm((prev) => ({ ...prev, user_id: e.target.value }))}
              placeholder="UUID del usuario existente"
            />
          </Field>

          <Field label="Rol">
            <SelectInput
              value={form.role}
              onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="super_admin">super_admin</option>
              <option value="admin_support">admin_support</option>
              <option value="admin_analyst">admin_analyst</option>
              <option value="admin_viewer">admin_viewer</option>
            </SelectInput>
          </Field>

          <Field label="Estado">
            <SelectInput
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="active">active</option>
              <option value="inactive">inactive</option>
            </SelectInput>
          </Field>

          {error ? <Notice tone="warning">{error}</Notice> : null}
          {success ? <Notice tone="success">{success}</Notice> : null}

          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? 'Guardando...' : 'Crear administrador'}
          </PrimaryButton>
        </form>
      </SectionCard>

      <SectionCard
        title="Administradores actuales"
        subtitle="Listado de roles administrativos activos e inactivos."
      >
        {loading ? (
          <div style={{ color: '#6b7280' }}>Cargando administradores...</div>
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
                      No hay administradores registrados.
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

function CodesSection({ token }) {
  const [mode, setMode] = useState('disabled')
  const [savedMode, setSavedMode] = useState('disabled')
  const [modeLoading, setModeLoading] = useState(true)
  const [modeSaving, setModeSaving] = useState(false)

  const [batches, setBatches] = useState([])
  const [batchesLoading, setBatchesLoading] = useState(true)

  const [expandedBatchId, setExpandedBatchId] = useState('')
  const [codes, setCodes] = useState([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [generatingBatchId, setGeneratingBatchId] = useState('')
  const [downloadingBatchId, setDownloadingBatchId] = useState('')

  const [form, setForm] = useState({
    batch_name: '',
    code_prefix: '',
    quantity: 20,
    export_enabled: true,
    notes: '',
  })
  const [creatingBatch, setCreatingBatch] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadMode = async () => {
    try {
      setModeLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/purchase-codes/mode`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo cargar el modo de códigos')
      }

      const nextMode = json?.item?.value?.mode || 'disabled'
      setMode(nextMode)
      setSavedMode(nextMode)
    } catch (err) {
      setError(err.message || 'Error cargando modo de códigos')
    } finally {
      setModeLoading(false)
    }
  }

  const loadBatches = async (preferredBatchId = null) => {
    try {
      setBatchesLoading(true)
      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/purchase-code-batches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron cargar los lotes')
      }

      const items = json.items || []
      setBatches(items)

      const nextExpanded =
        preferredBatchId ||
        expandedBatchId ||
        (items.length > 0 ? items[0].id : '')

      setExpandedBatchId(nextExpanded)
      return items
    } catch (err) {
      setError(err.message || 'Error cargando lotes')
      return []
    } finally {
      setBatchesLoading(false)
    }
  }

  const loadCodes = async (batchId) => {
    if (!batchId) {
      setCodes([])
      return
    }

    try {
      setCodesLoading(true)
      const res = await fetch(
        `${API_BASE_URL}/api/v1/superadmin/purchase-codes?batch_id=${encodeURIComponent(batchId)}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron cargar los códigos del lote')
      }

      setCodes(json.items || [])
    } catch (err) {
      setError(err.message || 'Error cargando códigos')
    } finally {
      setCodesLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const boot = async () => {
      setError('')
      setSuccess('')
      await loadMode()
      const items = await loadBatches()
      if (!cancelled) {
        const firstId = expandedBatchId || (items[0]?.id || '')
        if (firstId) {
          await loadCodes(firstId)
        }
      }
    }

    boot()

    return () => {
      cancelled = true
    }
  }, [token])

  useEffect(() => {
    if (expandedBatchId) {
      loadCodes(expandedBatchId)
    } else {
      setCodes([])
    }
  }, [expandedBatchId])

  const selectedBatch = useMemo(
    () => batches.find((item) => item.id === expandedBatchId) || null,
    [batches, expandedBatchId]
  )

  const moduleTotals = useMemo(() => {
    return batches.reduce(
      (acc, item) => {
        acc.codes_total += Number(item.codes_total || 0)
        acc.available_total += Number(item.available_total || 0)
        acc.used_total += Number(item.used_total || 0)
        return acc
      },
      {
        codes_total: 0,
        available_total: 0,
        used_total: 0,
      }
    )
  }, [batches])

  const handleSaveMode = async () => {
    try {
      setModeSaving(true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/purchase-codes/mode`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          mode,
          reason: 'Actualización desde panel visual Super Admin',
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo guardar el modo')
      }

      setSavedMode(mode)
      setSuccess('Modo de validación actualizado correctamente')
    } catch (err) {
      setError(err.message || 'Error guardando modo')
    } finally {
      setModeSaving(false)
    }
  }

  const handleCreateBatch = async (e) => {
    e.preventDefault()

    try {
      setCreatingBatch(true)
      setError('')
      setSuccess('')

      const res = await fetch(`${API_BASE_URL}/api/v1/superadmin/purchase-code-batches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          batch_name: form.batch_name.trim(),
          code_prefix: form.code_prefix.trim().toUpperCase(),
          quantity: Number(form.quantity || 0),
          export_enabled: Boolean(form.export_enabled),
          notes: form.notes.trim(),
        }),
      })

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudo crear el lote')
      }

      const newBatchId = json?.item?.id || ''
      await loadBatches(newBatchId)

      setForm({
        batch_name: '',
        code_prefix: '',
        quantity: 20,
        export_enabled: true,
        notes: '',
      })

      setSuccess('Lote creado correctamente')
    } catch (err) {
      setError(err.message || 'Error creando lote')
    } finally {
      setCreatingBatch(false)
    }
  }

  const handleGenerateCodes = async (batchId) => {
    if (!batchId) return

    try {
      setGeneratingBatchId(batchId)
      setError('')
      setSuccess('')

      const res = await fetch(
        `${API_BASE_URL}/api/v1/superadmin/purchase-code-batches/${encodeURIComponent(batchId)}/generate`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      const json = await res.json().catch(() => ({}))
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || 'No se pudieron generar los códigos')
      }

      await loadBatches(batchId)
      await loadCodes(batchId)

      setSuccess(`Se generaron ${json?.item?.generated_total || 0} códigos para el lote seleccionado`)
    } catch (err) {
      setError(err.message || 'Error generando códigos')
    } finally {
      setGeneratingBatchId('')
    }
  }

  const handleDownloadBatch = async (batch) => {
    if (!batch?.id) return

    try {
      setDownloadingBatchId(batch.id)
      setError('')
      setSuccess('')

      const res = await fetch(
        `${API_BASE_URL}/api/v1/superadmin/purchase-code-batches/${encodeURIComponent(batch.id)}/export`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      if (!res.ok) {
        const text = await res.text()
        try {
          const json = JSON.parse(text)
          throw new Error(json?.error || 'No se pudo descargar el lote')
        } catch {
          throw new Error('No se pudo descargar el lote')
        }
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      const safeName = (batch.batch_name || 'lote').replace(/[^a-zA-Z0-9_-]+/g, '-')
      a.href = url
      a.download = `${safeName}-codigos.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)

      setSuccess(`Lote descargado correctamente: ${batch.batch_name}`)
    } catch (err) {
      setError(err.message || 'Error descargando lote')
    } finally {
      setDownloadingBatchId('')
    }
  }

  const handleToggleBatch = (batchId) => {
    setExpandedBatchId((current) => (current === batchId ? '' : batchId))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        <SectionCard
          title="Modo de validación"
          subtitle="Controla si el registro permite, sugiere o exige código de compra."
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Modo actual">
              <SelectInput
                value={mode}
                disabled={modeLoading || modeSaving}
                onChange={(e) => setMode(e.target.value)}
              >
                <option value="disabled">Desactivado</option>
                <option value="optional">Opcional</option>
                <option value="required">Requerido</option>
              </SelectInput>
            </Field>

            <Notice tone="neutral">
              Guardado actualmente: <strong>{translateMode(savedMode)}</strong>
            </Notice>

            <PrimaryButton
              onClick={handleSaveMode}
              disabled={modeLoading || modeSaving || mode === savedMode}
            >
              {modeSaving ? 'Guardando...' : 'Guardar modo'}
            </PrimaryButton>
          </div>
        </SectionCard>

        <SectionCard
          title="Resumen del módulo"
          subtitle="Vista rápida del inventario consolidado de códigos."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
              gap: 14,
            }}
          >
            <MiniStat label="LOTES" value={batches.length} tone="neutral" />
            <MiniStat label="CÓDIGOS TOTALES" value={moduleTotals.codes_total} tone="primary" />
            <MiniStat label="DISPONIBLES" value={moduleTotals.available_total} tone="success" />
            <MiniStat label="USADOS" value={moduleTotals.used_total} tone="warning" />
          </div>

          {selectedBatch ? (
            <div
              style={{
                marginTop: 16,
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 14,
                padding: 14,
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: '#475569', marginBottom: 8 }}>
                LOTE ACTIVO
              </div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{selectedBatch.batch_name}</div>
              <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                Prefijo <strong>{selectedBatch.code_prefix || '—'}</strong> · Estado{' '}
                <strong>{translateBatchStatus(selectedBatch.status)}</strong>
              </div>
            </div>
          ) : (
            <div
              style={{
                marginTop: 16,
                background: '#f8fafc',
                border: '1px dashed #cbd5e1',
                borderRadius: 14,
                padding: 14,
                color: '#64748b',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Aún no hay lote activo seleccionado.
            </div>
          )}
        </SectionCard>
      </div>

      <Notice tone="neutral">
        Los correos vinculados a códigos de compra serán utilizados únicamente para notificaciones y seguimiento operativo dentro de AlcanciApp. No serán expuestos públicamente ni cedidos a terceros.
      </Notice>

      {error ? <Notice tone="warning">{error}</Notice> : null}
      {success ? <Notice tone="success">{success}</Notice> : null}

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24 }}>
        <SectionCard
          title="Crear lote"
          subtitle="Genera una agrupación de códigos lista para producción o pruebas."
        >
          <form onSubmit={handleCreateBatch} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nombre del lote">
              <TextInput
                value={form.batch_name}
                onChange={(e) => setForm((prev) => ({ ...prev, batch_name: e.target.value }))}
                placeholder="Ej: Lote Abril 001"
              />
            </Field>

            <Field label="Prefijo de código" hint="Usa solo letras y números. Ej: ALC">
              <TextInput
                value={form.code_prefix}
                onChange={(e) => setForm((prev) => ({ ...prev, code_prefix: e.target.value.toUpperCase() }))}
                placeholder="ALC"
                maxLength={12}
              />
            </Field>

            <Field label="Cantidad">
              <TextInput
                type="number"
                min="1"
                max="500"
                value={form.quantity}
                onChange={(e) => setForm((prev) => ({ ...prev, quantity: e.target.value }))}
              />
            </Field>

            <Field label="Notas internas">
              <TextArea
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Notas operativas o contexto del lote"
              />
            </Field>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontSize: 14,
                fontWeight: 700,
                color: '#334155',
              }}
            >
              <input
                type="checkbox"
                checked={form.export_enabled}
                onChange={(e) => setForm((prev) => ({ ...prev, export_enabled: e.target.checked }))}
              />
              Permitir exportación del lote
            </label>

            <PrimaryButton type="submit" disabled={creatingBatch}>
              {creatingBatch ? 'Creando lote...' : 'Crear lote'}
            </PrimaryButton>
          </form>
        </SectionCard>

        <SectionCard
          title="Lotes existentes"
          subtitle="Cada lote se despliega como acordeón con sus métricas y acciones."
          actions={
            <SecondaryButton
              onClick={() => loadBatches(expandedBatchId)}
              disabled={batchesLoading}
            >
              {batchesLoading ? 'Actualizando...' : 'Recargar'}
            </SecondaryButton>
          }
        >
          {batchesLoading ? (
            <div style={{ color: '#6b7280' }}>Cargando lotes...</div>
          ) : batches.length === 0 ? (
            <div style={{ color: '#6b7280' }}>No hay lotes creados todavía.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {batches.map((batch) => {
                const isExpanded = expandedBatchId === batch.id
                const hasCodes = Number(batch.codes_total || 0) > 0
                const canExport = Number(batch.export_enabled || 0) === 1

                return (
                  <div
                    key={batch.id}
                    style={{
                      border: isExpanded ? '2px solid #14213d' : '1px solid #e5e7eb',
                      borderRadius: 18,
                      background: '#ffffff',
                      overflow: 'hidden',
                      boxShadow: isExpanded ? '0 12px 28px rgba(20, 33, 61, 0.08)' : 'none',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleBatch(batch.id)}
                      style={{
                        width: '100%',
                        border: 'none',
                        background: isExpanded ? '#f8fafc' : '#ffffff',
                        padding: 18,
                        textAlign: 'left',
                        cursor: 'pointer',
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1fr) auto',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div style={{ fontSize: 17, fontWeight: 800 }}>
                            {batch.batch_name || 'Lote sin nombre'}
                          </div>
                          <StatusPill tone={isExpanded ? 'primary' : 'neutral'}>
                            {translateBatchStatus(batch.status)}
                          </StatusPill>
                          {selectedBatch?.id === batch.id ? (
                            <StatusPill tone="success">Lote activo</StatusPill>
                          ) : null}
                        </div>

                        <div
                          style={{
                            marginTop: 8,
                            display: 'flex',
                            gap: 10,
                            flexWrap: 'wrap',
                            fontSize: 13,
                            color: '#6b7280',
                          }}
                        >
                          <span>
                            Prefijo: <strong style={{ color: '#0f172a' }}>{batch.code_prefix || '—'}</strong>
                          </span>
                          <span>
                            Cantidad esperada: <strong style={{ color: '#0f172a' }}>{batch.quantity ?? 0}</strong>
                          </span>
                          <span>
                            Creado: <strong style={{ color: '#0f172a' }}>{batch.created_at || '—'}</strong>
                          </span>
                        </div>

                        <div
                          style={{
                            marginTop: 12,
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                            gap: 10,
                          }}
                        >
                          <MiniStat label="TOTAL" value={batch.codes_total ?? 0} tone="neutral" />
                          <MiniStat label="DISPONIBLES" value={batch.available_total ?? 0} tone="success" />
                          <MiniStat label="USADOS" value={batch.used_total ?? 0} tone="warning" />
                          <MiniStat label="EXPORTABLE" value={canExport ? 'Sí' : 'No'} tone="primary" />
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          justifySelf: 'end',
                        }}
                      >
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>
                          {isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
                        </div>
                        <Chevron expanded={isExpanded} />
                      </div>
                    </button>

                    {isExpanded ? (
                      <div
                        style={{
                          padding: 18,
                          borderTop: '1px solid #e5e7eb',
                          background: '#f8fafc',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16,
                        }}
                      >
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(0, 1fr) auto',
                            gap: 16,
                            alignItems: 'start',
                          }}
                        >
                          <div
                            style={{
                              background: '#ffffff',
                              border: '1px solid #e5e7eb',
                              borderRadius: 14,
                              padding: 14,
                            }}
                          >
                            <div style={{ fontSize: 12, color: '#64748b', fontWeight: 800, marginBottom: 10 }}>
                              DETALLES DEL LOTE
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Nombre</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {batch.batch_name || '—'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Prefijo</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {batch.code_prefix || '—'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Estado</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {translateBatchStatus(batch.status)}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Exportación</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {canExport ? 'Permitida' : 'No permitida'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Creado</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {batch.created_at || '—'}
                                </div>
                              </div>
                              <div>
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700 }}>Última exportación</div>
                                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 4 }}>
                                  {batch.last_exported_at || 'Aún no exportado'}
                                </div>
                              </div>
                            </div>

                            {batch.notes ? (
                              <div
                                style={{
                                  marginTop: 14,
                                  padding: 12,
                                  borderRadius: 12,
                                  background: '#f8fafc',
                                  border: '1px solid #e2e8f0',
                                }}
                              >
                                <div style={{ fontSize: 12, color: '#64748b', fontWeight: 700, marginBottom: 6 }}>
                                  Notas internas
                                </div>
                                <div style={{ fontSize: 13, color: '#334155', whiteSpace: 'pre-line' }}>
                                  {batch.notes}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                            <SecondaryButton
                              onClick={() => handleDownloadBatch(batch)}
                              disabled={downloadingBatchId === batch.id || !canExport}
                            >
                              {downloadingBatchId === batch.id ? 'Descargando...' : 'Descargar códigos'}
                            </SecondaryButton>

                            <PrimaryButton
                              onClick={() => handleGenerateCodes(batch.id)}
                              disabled={generatingBatchId === batch.id || hasCodes}
                              style={{
                                background: hasCodes ? '#64748b' : '#14213d',
                              }}
                            >
                              {generatingBatchId === batch.id
                                ? 'Generando...'
                                : hasCodes
                                  ? 'Ya generado'
                                  : 'Generar códigos'}
                            </PrimaryButton>
                          </div>
                        </div>

                        <Notice tone="neutral">
                          Al desplegar un lote, ese lote pasa a ser el lote activo para la tabla inferior de códigos.
                        </Notice>
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Códigos del lote seleccionado"
        subtitle={selectedBatch ? `Lote activo: ${selectedBatch.batch_name}` : 'Selecciona un lote para ver sus códigos'}
      >
        {!selectedBatch ? (
          <div style={{ color: '#6b7280' }}>Aún no has seleccionado un lote.</div>
        ) : codesLoading ? (
          <div style={{ color: '#6b7280' }}>Cargando códigos...</div>
        ) : codes.length === 0 ? (
          <div style={{ color: '#6b7280' }}>Este lote todavía no tiene códigos generados.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e5e7eb' }}>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Código</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Estado</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Correo asignado</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Correo vinculado</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Usado el</th>
                  <th style={{ padding: '12px 10px', fontSize: 13, color: '#6b7280' }}>Creado</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '14px 10px', fontWeight: 800, fontFamily: 'monospace' }}>{item.code}</td>
                    <td style={{ padding: '14px 10px' }}>{translateCodeStatus(item.status)}</td>
                    <td style={{ padding: '14px 10px', fontSize: 12 }}>{item.assigned_user_email || '—'}</td>
                    <td style={{ padding: '14px 10px', fontSize: 12 }}>{item.used_by_user_email || '—'}</td>
                    <td style={{ padding: '14px 10px' }}>{item.used_at || '—'}</td>
                    <td style={{ padding: '14px 10px' }}>{item.created_at || '—'}</td>
                  </tr>
                ))}
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
      ) : section === 'codes' || section === 'Códigos' ? (
        <CodesSection token={token} />
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
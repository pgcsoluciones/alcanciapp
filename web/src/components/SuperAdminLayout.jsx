import React from 'react'

const sidebarItems = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'users', label: 'Usuarios' },
  { key: 'admins', label: 'Roles / Admins' },
  { key: 'codes', label: 'Códigos' },
  { key: 'settings', label: 'Configuración' },
]

function SuperAdminLayout({ currentSection = 'dashboard', onNavigate, onLogout, children }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f5f7fb',
        color: '#14213d',
        display: 'grid',
        gridTemplateColumns: '260px 1fr',
      }}
    >
      <aside
        style={{
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          padding: '24px 18px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, color: '#6b7280', textTransform: 'uppercase' }}>
            AlcanciApp
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, marginTop: 6 }}>
            Super Admin
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 6 }}>
            Consola administrativa desktop-first
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sidebarItems.map((item) => {
            const isActive = currentSection === item.key
            return (
              <button
                key={item.key}
                onClick={() => onNavigate?.(item.key)}
                style={{
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: 12,
                  padding: '12px 14px',
                  background: isActive ? '#14213d' : '#f3f4f6',
                  color: isActive ? '#ffffff' : '#1f2937',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {item.label}
              </button>
            )
          })}
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={onLogout}
            style={{
              width: '100%',
              border: 'none',
              borderRadius: 12,
              padding: '12px 14px',
              background: '#ef4444',
              color: '#fff',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header
          style={{
            background: '#ffffff',
            borderBottom: '1px solid #e5e7eb',
            padding: '18px 28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 24, fontWeight: 800 }}>Panel de control</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
              Gestión administrativa, monetización y trazabilidad
            </div>
          </div>

          <div
            style={{
              background: '#ecfdf5',
              color: '#065f46',
              border: '1px solid #a7f3d0',
              padding: '8px 12px',
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            Super Admin activo
          </div>
        </header>

        <section style={{ padding: '24px 28px' }}>
          {children}
        </section>
      </main>
    </div>
  )
}

export default SuperAdminLayout

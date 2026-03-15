# Auditoría Auth V1 (fuente productiva real)

## 1) Fuente de verdad confirmada

### Backend productivo
- `wrangler.toml` raíz define `main = "src/index.js"`.
- Por lo tanto, el Worker productivo de Auth/Goals/Transactions vive en `src/`.

### Frontend productivo
- La SPA productiva de esta auditoría es `web/src/`.

### D1 productiva
- `wrangler.toml` raíz enlaza D1 con binding `DB`, `database_name = "alcanciapp-d1"`.

### Desalineación detectada backend/migraciones
- El Worker productivo usa `src/`, pero las migraciones avanzadas (0002..0011) están en `api/migrations/` (no en `migrations/` raíz).
- En `migrations/` raíz solo existe `0001_init.sql`.
- Riesgo: el código de `src/` puede ejecutarse contra una base productiva sin refinamientos de Auth esperados en `api/migrations/0011_auth_refinement.sql`.

---

## 2) Rutas Auth reales en backend productivo (`src/`)

### Existentes
- `POST /api/v1/auth/anonymous`

### No implementadas (faltantes para Auth V1 por código mágico)
- `POST /api/v1/auth/request-token`
- `POST /api/v1/auth/verify-token`

### Soporte actual de sesión
- Sí existe sesión persistente basada en `sessions.token_hash` + `expires_at` y middleware `authenticateUser`.
- Token bearer se valida por hash (sha256 + pepper) contra tabla `sessions`.

### Reautenticación temporal 5 minutos (unlock de montos)
- No existe en backend productivo una ruta que emita/verifique código y escriba `unlock_until`.
- El frontend intenta consumir ese flujo, pero el backend productivo no tiene esos endpoints.

---

## 3) Correcciones aplicadas en frontend productivo (`web/src/`)

### `web/src/App.jsx`
- Se corrigió el enrutado de vistas Auth:
  - `currentView === 'login'` renderiza `Login`.
  - `currentView === 'register'` renderiza `Register`.
- Se corrigió navegación de Login:
  - `onGoToRegister` ahora cambia a `setCurrentView('register')`.

### `web/src/screens/Register.jsx`
- Se corrigió payload al solicitar código:
  - Antes: `type: 'login'`
  - Ahora: `type: 'register'`

### Estado de endpoints Login/Register
- Login y Register siguen apuntando a `/api/v1/auth/request-token` y `/api/v1/auth/verify-token`.
- Esos endpoints **no existen** todavía en `src/` (backend productivo).
- Conclusión: navegación UI corregida, contrato backend pendiente.

---

## 4) Compilación frontend productivo

### Error encontrado
- `web/src/screens/Dashboard.jsx` tenía declaraciones duplicadas de estado React:
  - `showPasswordModal`/`setShowPasswordModal`
  - `isVerifying`/`setIsVerifying`
- Eso rompía `npm run build`.

### Corrección aplicada
- Se removieron las declaraciones duplicadas iniciales y se dejó una sola definición funcional en el bloque de re-auth modal.

---

## 5) Revisión de schema/migración Auth V1

### Estado observado
- En fuente productiva (`migrations/` raíz), no está `0011_auth_refinement.sql`.
- `api/migrations/0011_auth_refinement.sql` define:
  - tabla `auth_tokens` con `email`, `token_hash`, `expires_at`
  - `ALTER TABLE sessions ADD COLUMN unlock_until DATETIME`

### Conflicto potencial `auth_tokens / ON CONFLICT`
- La tabla `auth_tokens` de 0011 no define unique key natural para upsert por email+tipo.
- Si se implementa `INSERT ... ON CONFLICT(email, type)` fallará porque:
  - no hay columna `type`
  - no existe índice/constraint `UNIQUE(email, type)`.

### Estructura recomendada V1 (segura y limpia)
Para magic code + unlock temporal, usar tablas/constraints explícitas:

1. `users`
   - `id`, `email UNIQUE`, `name`, `created_at`, `updated_at`.

2. `auth_codes` (códigos efímeros)
   - `id`, `email`, `purpose` (`login|register|unlock`), `code_hash`, `expires_at`, `consumed_at`, `created_at`.
   - Índices:
     - `INDEX(email, purpose, expires_at)`
     - opcional `UNIQUE(email, purpose)` si la política es "un código activo por propósito".

3. `sessions`
   - mantener `token_hash`, `expires_at`.
   - agregar `unlock_until` para ventana de 5 minutos.

4. Reglas de negocio mínimas
   - `request-token`: rate limit por email+IP, invalidar/reemplazar código activo previo.
   - `verify-token`:
     - validar hash+expiración+no consumido,
     - marcar `consumed_at`,
     - emitir/rotar sesión (`sessions`),
     - para `purpose=unlock`, solo extender `unlock_until = now + 5 min`.

5. Seguridad
   - Nunca guardar código en plano.
   - TTL corto (5-10 min), intentos limitados, auditoría básica de intentos.

---

## 6) Qué queda pendiente para cerrar Auth V1 real
- Implementar en `src/routes/auth.js`:
  - `request-token`
  - `verify-token` (login/register/unlock)
- Alinear migraciones productivas en carpeta raíz (`migrations/`) y aplicar sobre D1 enlazada en `wrangler.toml` raíz.
- Ajustar frontend para manejar respuestas reales de V1 (errores, cooldown, expiración, lockout).

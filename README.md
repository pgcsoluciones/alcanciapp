# AlcanciApp

Este es el monorepo para AlcanciApp, dividido en frontend (`/web`) y backend (`/api`).

## Estructura
- `/web`: Aplicación en React + Vite. Diseñada Mobile-First (Max width: 480px).
- `/api`: Backend serverless usando Cloudflare Workers.

## Cómo ejecutar en Codespaces (Entorno en línea)

Necesitarás **dos terminales** abiertas en tu entorno de Codespaces.

### 1. Ejecutar la Web (Frontend)
En la **Terminal 1**:
1. Entra a la carpeta web:
   ```bash
   cd web
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Verás que Vite genera un enlace (ej. `http://localhost:5173`). Codespaces te dará la opción de abrirlo en el navegador o hacer forward del puerto.

### 2. Ejecutar la API (Backend)
En la **Terminal 2**:
1. Entra a la carpeta api:
   ```bash
   cd api
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el Worker en Codespaces:
   ```bash
   npm run dev
   ```
4. Verás que el worker usa internamente `http://localhost:8787`. Al igual que con la web, **Codespaces te mostrará una notificación** diciendo "Su aplicación se está ejecutando en el puerto 8787" y te dará la opción de **Hacer forward del puerto** (abrir en el navegador).
5. Abre la URL que Codespaces te genera (ej. `https://tu-usuario-tu-repo-8787.app.github.dev`) y simplemente añade `/health` al final de la ruta para ver tu JSON:
   Debe devolver: `{"ok":true,"name":"alcanciapp-api"}`

## Cómo probar en Móvil (360px / 390px)

1. Abre la URL del Frontend (`/web`) en una nueva pestaña del navegador.
2. Abre las Herramientas de Desarrollador (Developer Tools):
   - Mac: `Cmd + Option + I`
   - Windows/Linux: `F12` o `Ctrl + Shift + I`
3. Activa la vista de **Device Toolbar** (icono de móviles y tablets).
   - Atajo: `Cmd + Shift + M` (Mac) o `Ctrl + Shift + M` (Win/Linux).
4. En el menú desplegable superior, selecciona **Responsive**.
5. Escribe manualmente los tamaños para probar:
   - Ancho: `360` (prueba)
   - Ancho: `390` (prueba)
6. **Verifica:**
   - Que no haya scroll horizontal lateral.
   - Que el botón se vea grande y ocupe casi todo el ancho.
   - Que los textos no se corten.

## Pruebas de la API (cURL)

La API cuenta con endpoints para manejo de Metas (*Goals*) y *Transacciones* bajo sesiones anónimas. En tu terminal puedes ejecutarlas de esta manera usando la URL de producción.

### 1. Crear Sesión Anónima
```bash
curl -X POST https://alcanciapp-api.fliaprince.workers.dev/api/v1/auth/anonymous
# Devuelve: {"ok":true,"token":"...","user":{"id":"..."}}
```

### 2. Crear Meta (Sustituye TU_TOKEN)
```bash
curl -X POST https://alcanciapp-api.fliaprince.workers.dev/api/v1/goals \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Ahorro Coche", "duration_months":12, "frequency":"Mensual", "privacy":"Privada"}'
```

### 3. Listar Metas Propias (Sustituye TU_TOKEN)
```bash
curl -H "Authorization: Bearer TU_TOKEN" \
  https://alcanciapp-api.fliaprince.workers.dev/api/v1/goals
```

### 4. Borrar Meta Propia (Sustituye TU_TOKEN y TU_GOAL_ID)
```bash
curl -X DELETE https://alcanciapp-api.fliaprince.workers.dev/api/v1/goals/TU_GOAL_ID \
  -H "Authorization: Bearer TU_TOKEN"
```

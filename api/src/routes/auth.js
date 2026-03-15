// src/routes/auth.js
import { sha256 } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleAuth(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    if (method !== 'POST') {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
        // ── [POST] /api/v1/auth/request-token ─────────────────────────────
        if (path === '/api/v1/auth/request-token') {
            const { email } = await request.json();
            if (!email || !email.includes('@')) {
                return new Response(JSON.stringify({ ok: false, error: "Email inválido" }), { status: 400, headers: baseHeaders });
            }

            // 1. Generar token de 6 dígitos
            const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const tokenHash = await sha256(rawToken + pepper);

            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutos

            // 2. Guardar en DB
            const tokenId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO auth_tokens (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?) " +
                "ON CONFLICT(email) DO UPDATE SET token_hash=excluded.token_hash, expires_at=excluded.expires_at"
            ).bind(tokenId, email.toLowerCase(), tokenHash, expiresAt).run();

            // 3. Simular envío de email (log en consola)
            console.log(`[MAGIC LINK] Token para ${email}: ${rawToken}`);

            return new Response(JSON.stringify({ ok: true, message: "Token enviado al correo (Simulado)" }), { status: 200, headers: baseHeaders });
        }

        // ── [POST] /api/v1/auth/verify-token ──────────────────────────────
        if (path === '/api/v1/auth/verify-token') {
            const { email, token } = await request.json();
            if (!email || !token) {
                return new Response(JSON.stringify({ ok: false, error: "Email y token requeridos" }), { status: 400, headers: baseHeaders });
            }

            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const tokenHash = await sha256(token + pepper);

            // 1. Validar token
            const authToken = await env.DB.prepare(
                "SELECT * FROM auth_tokens WHERE email = ? AND token_hash = ? AND expires_at > datetime('now')"
            ).bind(email.toLowerCase(), tokenHash).first();

            if (!authToken) {
                return new Response(JSON.stringify({ ok: false, error: "Token inválido o expirado" }), { status: 401, headers: baseHeaders });
            }

            // 2. Buscar o crear usuario
            let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(email.toLowerCase()).first();
            let userId = user?.id;

            if (!user) {
                userId = crypto.randomUUID();
                await env.DB.prepare("INSERT INTO users (id, email) VALUES (?, ?)")
                    .bind(userId, email.toLowerCase()).run();
                user = { id: userId, email: email.toLowerCase() };
            }

            // 3. Crear sesión
            const sessionId = crypto.randomUUID();
            const rawSessionToken = crypto.randomUUID();
            const sessionHash = await sha256(rawSessionToken + pepper);
            const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await env.DB.prepare(
                "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
            ).bind(sessionId, userId, sessionHash, sessionExpires).run();

            // 4. Limpiar token usado
            await env.DB.prepare("DELETE FROM auth_tokens WHERE email = ?").bind(email.toLowerCase()).run();

            return new Response(JSON.stringify({
                ok: true,
                token: rawSessionToken,
                user: { id: userId, email: email.toLowerCase(), name: user.name, avatar: user.avatar }
            }), { status: 200, headers: baseHeaders });
        }

        return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

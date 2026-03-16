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
            const { email, type } = await request.json();
            if (!email || !email.includes('@')) {
                return new Response(JSON.stringify({ ok: false, error: "Email inválido" }), { status: 400, headers: baseHeaders });
            }

            const normalizedEmail = email.toLowerCase();

            // Validar que el usuario ya existe (impedir auto-registro)
            const existingUser = await env.DB.prepare(
                "SELECT id FROM users WHERE email = ?"
            ).bind(normalizedEmail).first();

            if (!existingUser) {
                return new Response(JSON.stringify({ ok: false, error: "Usuario no autorizado" }), { status: 403, headers: baseHeaders });
            }

            // Generar token de 6 dígitos
            const rawToken = Math.floor(100000 + Math.random() * 900000).toString();
            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const tokenHash = await sha256(rawToken + pepper);
            const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

            // Eliminar token previo para evitar conflictos D1
            await env.DB.prepare(
                "DELETE FROM auth_tokens WHERE email = ?"
            ).bind(normalizedEmail).run();

            // INSERT limpio, sin ON CONFLICT
            const tokenId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO auth_tokens (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?)"
            ).bind(tokenId, normalizedEmail, tokenHash, expiresAt).run();

            console.log(`[MAGIC CODE] Código para ${normalizedEmail} (${type || 'access'}): ${rawToken}`);

            return new Response(JSON.stringify({
                ok: true,
                message: "Código enviado al correo",
                debug_token: rawToken
            }), { status: 200, headers: baseHeaders });
        }

        // ── [POST] /api/v1/auth/verify-token ──────────────────────────────
        if (path === '/api/v1/auth/verify-token') {
            const { email, token, isUnlock } = await request.json();
            if (!email || !token) {
                return new Response(JSON.stringify({ ok: false, error: "Email y código requeridos" }), { status: 400, headers: baseHeaders });
            }

            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const tokenHash = await sha256(token + pepper);

            // 1. Validar token
            const authToken = await env.DB.prepare(
                "SELECT * FROM auth_tokens WHERE email = ? AND token_hash = ? AND expires_at > datetime('now')"
            ).bind(email.toLowerCase(), tokenHash).first();

            if (!authToken) {
                return new Response(JSON.stringify({ ok: false, error: "Código inválido o expirado" }), { status: 401, headers: baseHeaders });
            }

            // 2. Si solo es UNLOCK, actualizar sesión actual
            if (isUnlock) {
                const authHeader = request.headers.get("Authorization");
                if (!authHeader) {
                    return new Response(JSON.stringify({ ok: false, error: "Sesión no encontrada" }), { status: 401, headers: baseHeaders });
                }
                const sessionToken = authHeader.split(" ")[1];
                const sessionHash = await sha256(sessionToken + pepper);
                const unlockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

                await env.DB.prepare(
                    "UPDATE sessions SET unlock_until = ? WHERE token_hash = ?"
                ).bind(unlockUntil, sessionHash).run();

                await env.DB.prepare("DELETE FROM auth_tokens WHERE email = ?").bind(email.toLowerCase()).run();

                return new Response(JSON.stringify({ ok: true, unlock_until: unlockUntil }), { status: 200, headers: baseHeaders });
            }

            // 3. Validar que el usuario existe (no se permite auto-registro)
            const normalizedEmail = email.toLowerCase();
            const user = await env.DB.prepare(
                "SELECT * FROM users WHERE email = ?"
            ).bind(normalizedEmail).first();

            if (!user) {
                return new Response(JSON.stringify({ ok: false, error: "Usuario no autorizado" }), { status: 403, headers: baseHeaders });
            }

            const userId = user.id;

            // 4. Crear sesión
            const sessionId = crypto.randomUUID();
            const rawSessionToken = crypto.randomUUID();
            const sessionHash = await sha256(rawSessionToken + pepper);
            const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            await env.DB.prepare(
                "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
            ).bind(sessionId, userId, sessionHash, sessionExpires).run();

            // 5. Limpiar token usado
            await env.DB.prepare("DELETE FROM auth_tokens WHERE email = ?").bind(normalizedEmail).run();

            return new Response(JSON.stringify({
                ok: true,
                token: rawSessionToken,
                user: {
                    id: userId,
                    email: normalizedEmail,
                    name: user.name || email.split('@')[0],
                    avatar: user.avatar
                }
            }), { status: 200, headers: baseHeaders });
        }

        return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

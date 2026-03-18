// src/routes/auth.js
import { sha256, authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

function jsonResponse(payload, status, corsHeaders) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json"
        }
    });
}

function createSessionToken() {
    const rawToken = crypto.getRandomValues(new Uint8Array(32));
    return btoa(String.fromCharCode(...rawToken))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

function createSixDigitCode() {
    const random = crypto.getRandomValues(new Uint32Array(1))[0] % 1000000;
    return String(random).padStart(6, '0');
}

function normalizeEmail(value) {
    return String(value || '').trim().toLowerCase();
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function usersHasEmailColumn(env) {
    const columns = await env.DB.prepare("PRAGMA table_info(users)").all();
    const rows = Array.isArray(columns?.results) ? columns.results : [];
    return rows.some((col) => col?.name === 'email');
}

async function findOrCreateUserByEmail(env, email) {
    const hasEmailColumn = await usersHasEmailColumn(env);

    if (hasEmailColumn) {
        const existing = await env.DB.prepare("SELECT id, email FROM users WHERE email = ? LIMIT 1")
            .bind(email)
            .first();

        if (existing?.id) {
            return { id: existing.id, email: existing.email || email };
        }

        const userId = crypto.randomUUID();
        await env.DB.prepare("INSERT INTO users (id, email) VALUES (?, ?)")
            .bind(userId, email)
            .run();

        return { id: userId, email };
    }

    // Fallback legacy schema sin email en users
    const userId = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO users (id) VALUES (?)")
        .bind(userId)
        .run();

    return { id: userId, email };
}

export async function handleAnonymousAuth(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const userId = crypto.randomUUID();
        const sessionId = crypto.randomUUID();
        const token = createSessionToken();

        const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
        const tokenHash = await sha256(token + pepper);

        const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expiresAt = date.toISOString();

        const batch = await env.DB.batch([
            env.DB.prepare("INSERT INTO users (id) VALUES (?)").bind(userId),
            env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
                .bind(sessionId, userId, tokenHash, expiresAt)
        ]);

        if (batch[0].error || batch[1].error) {
            throw new Error("D1 Error saving user or session");
        }

        return jsonResponse({ ok: true, token, user: { id: userId } }, 200, corsHeaders);
    } catch (e) {
        console.error("Auth Error:", e);
        return jsonResponse({ ok: false, error: e.message }, 500, corsHeaders);
    }
}

export async function handleRequestToken(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const email = normalizeEmail(body?.email);

        if (!isValidEmail(email)) {
            return jsonResponse({ ok: false, error: 'Correo inválido' }, 400, corsHeaders);
        }

        const code = createSixDigitCode();
        const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
        const tokenHash = await sha256(code + pepper);
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

        const batch = await env.DB.batch([
            env.DB.prepare("DELETE FROM auth_tokens WHERE email = ?").bind(email),
            env.DB.prepare("INSERT INTO auth_tokens (id, email, token_hash, expires_at) VALUES (?, ?, ?, ?)")
                .bind(crypto.randomUUID(), email, tokenHash, expiresAt)
        ]);

        if (batch[0]?.error || batch[1]?.error) {
            throw new Error(batch[0]?.error || batch[1]?.error || 'No se pudo guardar el código');
        }

        // Integración de correo pendiente en V1: por ahora se registra en logs para verificación operativa.
        console.log(`[AUTH][request-token] email=${email} code=${code}`);

        const response = { ok: true, message: 'Código enviado' };
        if (env.AUTH_DEBUG_CODES === 'true') {
            response.debug_code = code;
        }

        return jsonResponse(response, 200, corsHeaders);
    } catch (e) {
        console.error("Request Token Error:", e);
        return jsonResponse({ ok: false, error: e.message || 'Error solicitando código' }, 500, corsHeaders);
    }
}

export async function handleVerifyToken(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
        const body = await request.json();
        const email = normalizeEmail(body?.email);
        const token = String(body?.token || '').trim();
        const isUnlock = Boolean(body?.isUnlock);

        if (!isValidEmail(email) || !/^\d{6}$/.test(token)) {
            return jsonResponse({ ok: false, error: 'Código o correo inválido' }, 400, corsHeaders);
        }

        const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
        const tokenHash = await sha256(token + pepper);

        const authCode = await env.DB.prepare(
            "SELECT id FROM auth_tokens WHERE email = ? AND token_hash = ? AND expires_at > datetime('now') LIMIT 1"
        ).bind(email, tokenHash).first();

        if (!authCode?.id) {
            return jsonResponse({ ok: false, error: 'Código incorrecto o expirado' }, 401, corsHeaders);
        }

        await env.DB.prepare("DELETE FROM auth_tokens WHERE email = ?").bind(email).run();

        if (isUnlock) {
            const authResult = await authenticateUser(request, env);
            if (authResult.error) {
                return jsonResponse({ ok: false, error: authResult.error }, authResult.status || 401, corsHeaders);
            }

            const unlockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            const update = await env.DB.prepare(
                "UPDATE sessions SET unlock_until = ? WHERE token_hash = ? AND user_id = ?"
            ).bind(unlockUntil, authResult.tokenHash, authResult.userId).run();

            if ((update?.meta?.changes || 0) < 1) {
                return jsonResponse({ ok: false, error: 'No se pudo extender sesión segura' }, 500, corsHeaders);
            }

            return jsonResponse({ ok: true, unlock_until: unlockUntil }, 200, corsHeaders);
        }

        const user = await findOrCreateUserByEmail(env, email);
        const sessionToken = createSessionToken();
        const sessionHash = await sha256(sessionToken + pepper);
        const sessionId = crypto.randomUUID();
        const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await env.DB.prepare(
            "INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)"
        ).bind(sessionId, user.id, sessionHash, sessionExpiresAt).run();

        return jsonResponse({ ok: true, token: sessionToken, user }, 200, corsHeaders);
    } catch (e) {
        console.error("Verify Token Error:", e);
        return jsonResponse({ ok: false, error: e.message || 'Error verificando código' }, 500, corsHeaders);
    }
}

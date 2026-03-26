import { authenticateUser } from '../lib/auth.js';
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

async function ensureProfilesTable(env) {
    await env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id TEXT PRIMARY KEY,
            name TEXT,
            email TEXT,
            avatar TEXT,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    `).run();
}

export async function handleProfile(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const authResult = await authenticateUser(request, env);

    if (authResult.error) {
        return jsonResponse({ ok: false, error: authResult.error }, authResult.status || 401, corsHeaders);
    }

    const { userId, tokenHash } = authResult;
    const method = request.method;
    const url = new URL(request.url);
    const path = url.pathname;

    try {
        await ensureProfilesTable(env);

        if (method === 'GET' && path === '/api/v1/profile') {
            const profile = await env.DB.prepare(
                `SELECT
                    up.user_id,
                    up.name,
                    up.email,
                    up.avatar,
                    u.current_plan_code
                 FROM users u
                 LEFT JOIN user_profiles up ON up.user_id = u.id
                 WHERE u.id = ?
                 LIMIT 1`
            ).bind(userId).first();

            return jsonResponse({
                ok: true,
                profile: {
                    id: userId,
                    name: profile?.name || '',
                    email: profile?.email || '',
                    avatar: profile?.avatar || '1.png',
                    current_plan_code: profile?.current_plan_code || 'free'
                }
            }, 200, corsHeaders);
        }

        if (method === 'PATCH' && path === '/api/v1/profile') {
            const body = await request.json();
            const name = String(body?.name || '').trim();
            const email = String(body?.email || '').trim().toLowerCase();
            const avatar = String(body?.avatar || '1.png').trim() || '1.png';

            await env.DB.prepare(
                `INSERT INTO user_profiles (user_id, name, email, avatar, updated_at)
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                 ON CONFLICT(user_id) DO UPDATE SET
                    name = excluded.name,
                    email = excluded.email,
                    avatar = excluded.avatar,
                    updated_at = CURRENT_TIMESTAMP`
            ).bind(userId, name, email, avatar).run();

            return jsonResponse({ ok: true, profile: { id: userId, name, email, avatar } }, 200, corsHeaders);
        }

        if (method === 'POST' && path === '/api/v1/profile/verify-password') {
            const body = await request.json().catch(() => ({}));
            const password = String(body?.password || '');
            const configuredPin = String(env.PROFILE_UNLOCK_PIN || '').trim();

            if (!configuredPin) {
                return jsonResponse({ ok: false, error: 'Validación no configurada' }, 400, corsHeaders);
            }

            if (!password || password !== configuredPin) {
                return jsonResponse({ ok: false, error: 'Contraseña incorrecta' }, 401, corsHeaders);
            }

            const unlockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();
            const update = await env.DB.prepare(
                "UPDATE sessions SET unlock_until = ? WHERE token_hash = ? AND user_id = ?"
            ).bind(unlockUntil, tokenHash, userId).run();

            if ((update?.meta?.changes || 0) < 1) {
                return jsonResponse({ ok: false, error: 'No se pudo validar sesión' }, 500, corsHeaders);
            }

            return jsonResponse({ ok: true, unlock_until: unlockUntil }, 200, corsHeaders);
        }

        return jsonResponse({ ok: false, error: 'Profile route not found' }, 404, corsHeaders);
    } catch (e) {
        return jsonResponse({ ok: false, error: e.message }, 500, corsHeaders);
    }
}
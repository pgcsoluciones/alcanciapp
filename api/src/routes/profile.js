// src/routes/profile.js
// PATCH /api/v1/profile — Guarda nombre, email y avatar del usuario autenticado.
// Las columnas name, email, avatar, password_hash se añadieron en la migración 0010.
import { authenticateUser, sha256 } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleProfile(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const baseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    const authResult = await authenticateUser(request, env);
    if (authResult.error) {
        return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
            status: authResult.status,
            headers: baseHeaders
        });
    }

    const { userId } = authResult;
    const method = request.method;

    try {
        // ── [PATCH] /api/v1/profile ──────────────────────────────────────────
        if (method === 'PATCH') {
            const body = await request.json();

            // Extraer y validar campos permitidos
            const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : null;
            const email = typeof body.email === 'string' ? body.email.trim().slice(0, 200) : null;
            const avatar = typeof body.avatar === 'string' ? body.avatar.trim().slice(0, 100) : null;
            const password = typeof body.password === 'string' ? body.password : null;

            // Al menos un campo debe venir
            if (name === null && email === null && avatar === null && password === null) {
                return new Response(JSON.stringify({ ok: false, error: 'Ningún campo válido recibido' }), {
                    status: 400, headers: baseHeaders
                });
            }

            // Construir query dinámico (solo actualizamos los campos recibidos)
            const sets = [];
            const vals = [];
            if (name !== null) { sets.push('name = ?'); vals.push(name); }
            if (email !== null) { sets.push('email = ?'); vals.push(email); }
            if (avatar !== null) { sets.push('avatar = ?'); vals.push(avatar); }
            if (password !== null) {
                const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
                const hash = await sha256(password + pepper);
                sets.push('password_hash = ?');
                vals.push(hash);
            }
            vals.push(userId);

            await env.DB.prepare(
                `UPDATE users SET ${sets.join(', ')} WHERE id = ?`
            ).bind(...vals).run();

            return new Response(JSON.stringify({
                ok: true,
                user: { id: userId, name, email, avatar }
            }), { status: 200, headers: baseHeaders });
        }

        // ── [POST] /api/v1/profile/verify-password ───────────────────────────
        // Este endpoint valida la contraseña y activa el "Modo Real" por 5 minutos.
        if (method === 'POST') {
            const body = await request.json();
            const password = body.password;

            if (!password) {
                return new Response(JSON.stringify({ ok: false, error: 'Contraseña requerida' }), { status: 400, headers: baseHeaders });
            }

            const user = await env.DB.prepare(
                "SELECT password_hash FROM users WHERE id = ?"
            ).bind(userId).first();

            // Si el usuario no tiene contraseña (V1 anonymous), permitimos pero no activamos unlock_until?
            // El usuario dice "No dejar validación simulada". Si no hay hash, no puede validar real.
            if (!user || !user.password_hash) {
                return new Response(JSON.stringify({ ok: false, error: 'No has configurado una contraseña en tu perfil.' }), { status: 400, headers: baseHeaders });
            }

            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const hash = await sha256(password + pepper);

            if (hash === user.password_hash) {
                // Activar desbloqueo por 5 minutos en la sesión actual
                const authHeader = request.headers.get("Authorization");
                const token = authHeader.split(" ")[1];
                const tokenHash = await sha256(token + pepper);

                const unlockUntil = new Date(Date.now() + 5 * 60 * 1000).toISOString();

                await env.DB.prepare(
                    "UPDATE sessions SET unlock_until = ? WHERE token_hash = ?"
                ).bind(unlockUntil, tokenHash).run();

                return new Response(JSON.stringify({ ok: true, unlock_until: unlockUntil }), { status: 200, headers: baseHeaders });
            } else {
                return new Response(JSON.stringify({ ok: false, error: 'Contraseña incorrecta' }), { status: 401, headers: baseHeaders });
            }
        }

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

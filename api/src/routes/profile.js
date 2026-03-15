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

            // Al menos un campo debe venir (password removido)
            if (name === null && email === null && avatar === null) {
                return new Response(JSON.stringify({ ok: false, error: 'Ningún campo válido recibido' }), {
                    status: 400, headers: baseHeaders
                });
            }

            // Construir query dinámico
            const sets = [];
            const vals = [];
            if (name !== null) { sets.push('name = ?'); vals.push(name); }
            if (email !== null) { sets.push('email = ?'); vals.push(email); }
            if (avatar !== null) { sets.push('avatar = ?'); vals.push(avatar); }
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
        // OBSOLETO: Ahora se usa /api/v1/auth/verify-token con isUnlock: true
        if (method === 'POST') {
            return new Response(JSON.stringify({ ok: false, error: 'Este endpoint es obsoleto. Usa el flujo de código mágico.' }), { status: 410, headers: baseHeaders });
        }

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

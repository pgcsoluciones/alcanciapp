// src/routes/piggyBanks.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handlePiggyBanks(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const authResult = await authenticateUser(request, env);
    if (authResult.error) {
        return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { userId } = authResult;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const method = request.method;
    const baseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    try {
        // ── [POST] /api/v1/piggy-banks/link ───────────────────────────────
        // Vincula una alcancía física al usuario por su código único
        if (method === 'POST' && pathSegments[3] === 'link') {
            const body = await request.json();
            const code = (body.code || '').trim().toUpperCase();
            const goalId = body.goal_id || null;

            if (!code) {
                return new Response(JSON.stringify({ ok: false, error: 'Código de alcancía requerido' }), { status: 400, headers: baseHeaders });
            }

            // Buscar alcancía por código
            const piggyBank = await env.DB.prepare(
                'SELECT * FROM piggy_banks WHERE code = ?'
            ).bind(code).first();

            if (!piggyBank) {
                return new Response(JSON.stringify({ ok: false, error: 'Código no válido. Verifica que el código de tu alcancía sea correcto.' }), { status: 404, headers: baseHeaders });
            }

            if (piggyBank.linked_user_id && piggyBank.linked_user_id !== userId) {
                return new Response(JSON.stringify({ ok: false, error: 'Esta alcancía ya está vinculada a otro usuario.' }), { status: 409, headers: baseHeaders });
            }

            // Vincular
            await env.DB.prepare(
                `UPDATE piggy_banks SET linked_user_id = ?, linked_goal_id = ?, status = 'active', linked_at = CURRENT_TIMESTAMP WHERE code = ?`
            ).bind(userId, goalId, code).run();

            return new Response(JSON.stringify({ ok: true, message: '¡Alcancía vinculada exitosamente!', code }), { status: 200, headers: baseHeaders });
        }

        // ── [GET] /api/v1/piggy-banks/mine ─────────────────────────────
        if (method === 'GET' && pathSegments[3] === 'mine') {
            const { results } = await env.DB.prepare(
                'SELECT * FROM piggy_banks WHERE linked_user_id = ?'
            ).bind(userId).all();

            return new Response(JSON.stringify({ ok: true, piggy_banks: results }), { status: 200, headers: baseHeaders });
        }

        return new Response(JSON.stringify({ error: 'Ruta de alcancía no válida' }), { status: 404, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

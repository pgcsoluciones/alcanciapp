// src/routes/badges.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleBadges(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const authResult = await authenticateUser(request, env);

    if (authResult.error) {
        return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { userId } = authResult;
    const method = request.method;
    const baseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    try {
        // [GET] /api/v1/badges -> LISTAR LOGROS DEL USUARIO Y CATÁLOGO
        if (method === 'GET') {
            // 1. Obtener catálogo completo
            const catalog = await env.DB.prepare(
                "SELECT * FROM badges_catalog ORDER BY category ASC"
            ).all();

            // 2. Obtener insignias del usuario
            const userBadges = await env.DB.prepare(
                "SELECT * FROM user_badges WHERE user_id = ? ORDER BY unlocked_at DESC"
            ).bind(userId).all();

            return new Response(JSON.stringify({
                ok: true,
                catalog: catalog.results,
                user_badges: userBadges.results
            }), { status: 200, headers: baseHeaders });
        }

        return new Response(JSON.stringify({ error: "Method not supported" }), { status: 405, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

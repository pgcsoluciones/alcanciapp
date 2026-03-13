// src/routes/goals.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleGoals(request, env) {
    const corsHeaders = getCorsHeaders(env);

    // 1. Aplicar Auth Middleware y recuperar `userId`
    const authResult = await authenticateUser(request, env);
    if (authResult.error) {
        return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
            status: authResult.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
    }

    const { userId } = authResult;
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);
    const method = request.method;

    const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    try {
        // [POST] /api/v1/goals -> CREAR UNA META
        if (method === 'POST' && pathSegments.length === 3) {
            const body = await request.json();

            // Validaciones
            if (!body.name || !body.duration_months || !body.frequency || !body.privacy) {
                return new Response(JSON.stringify({ ok: false, error: "Faltan campos (name, duration_months, frequency, privacy)" }), {
                    status: 400, headers: baseHeaders
                });
            }

            const goalId = crypto.randomUUID();

            const stmt = env.DB.prepare(
                "INSERT INTO goals (id, user_id, name, duration_months, frequency, privacy) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(goalId, userId, body.name, body.duration_months, body.frequency, body.privacy);

            const result = await stmt.run();
            if (result.error) throw new Error("Db Error");

            return new Response(JSON.stringify({
                ok: true,
                goal: {
                    id: goalId,
                    name: body.name,
                    duration_months: body.duration_months,
                    frequency: body.frequency,
                    privacy: body.privacy
                }
            }), { status: 201, headers: baseHeaders });
        }


        // [GET] /api/v1/goals -> LISTAR METAS DEL USUARIO
        if (method === 'GET' && pathSegments.length === 3) {
            const { results } = await env.DB.prepare(
                "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC"
            ).bind(userId).all();

            return new Response(JSON.stringify({
                ok: true,
                goals: results
            }), { status: 200, headers: baseHeaders });
        }


        // [GET] /api/v1/goals/:id -> LEER UNA META
        if (method === 'GET' && pathSegments.length === 4) {
            const goalId = pathSegments[3];
            const goal = await env.DB.prepare(
                "SELECT * FROM goals WHERE id = ? AND user_id = ?"
            ).bind(goalId, userId).first();

            if (!goal) {
                return new Response(JSON.stringify({ ok: false, error: "Meta no encontrada o no pertenece al usuario" }), {
                    status: 404, headers: baseHeaders
                });
            }

            return new Response(JSON.stringify({ ok: true, goal }), { status: 200, headers: baseHeaders });
        }


        // [DELETE] /api/v1/goals/:id -> BORRAR UNA META
        if (method === 'DELETE' && pathSegments.length === 4) {
            const goalId = pathSegments[3];

            // Se valida obligatoriamente con el user_id para no borrar otras metas
            const result = await env.DB.prepare(
                "DELETE FROM goals WHERE id = ? AND user_id = ?"
            ).bind(goalId, userId).run();

            if (result.meta && result.meta.changes === 0) {
                return new Response(JSON.stringify({ ok: false, error: "No encontrada" }), {
                    status: 404, headers: baseHeaders
                });
            }

            return new Response(JSON.stringify({ ok: true, deleted: goalId }), { status: 200, headers: baseHeaders });
        }


        return new Response(JSON.stringify({ error: "Route not found or method unsupported" }), {
            status: 404, headers: baseHeaders
        });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 500, headers: baseHeaders
        });
    }
}

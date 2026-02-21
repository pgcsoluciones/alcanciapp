// src/routes/transactions.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleTransactions(request, env) {
    const corsHeaders = getCorsHeaders(env);

    // 1. Enforce Auth
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
        // [POST] /api/v1/goals/:id/transactions
        if (method === 'POST' && pathSegments[2] === 'goals' && pathSegments[4] === 'transactions') {
            const goalId = pathSegments[3];
            const body = await request.json();

            if (typeof body.amount !== 'number') {
                return new Response(JSON.stringify({ ok: false, error: "Valida amount en formato número" }), { status: 400, headers: baseHeaders });
            }

            // Verificar tenencia de la meta antes de hacer inserción (evita transacciones huerfanas de otro user)
            const goal = await env.DB.prepare(
                "SELECT id FROM goals WHERE id = ? AND user_id = ?"
            ).bind(goalId, userId).first();

            if (!goal) {
                return new Response(JSON.stringify({ ok: false, error: "Meta inaccesible" }), { status: 403, headers: baseHeaders });
            }

            const txId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO goal_transactions (id, goal_id, user_id, amount) VALUES (?, ?, ?, ?)"
            ).bind(txId, goalId, userId, body.amount).run();

            return new Response(JSON.stringify({ ok: true, transaction: { id: txId, amount: body.amount } }), { status: 201, headers: baseHeaders });
        }


        // [GET] /api/v1/goals/:id/transactions
        if (method === 'GET' && pathSegments[2] === 'goals' && pathSegments[4] === 'transactions') {
            const goalId = pathSegments[3];

            // Por seguridad, filtramos by goal_id y ademas garantizamos que pertenezca con user_id de la sesión
            const { results } = await env.DB.prepare(
                "SELECT * FROM goal_transactions WHERE goal_id = ? AND user_id = ? ORDER BY created_at DESC"
            ).bind(goalId, userId).all();

            return new Response(JSON.stringify({ ok: true, transactions: results }), { status: 200, headers: baseHeaders });
        }

        // [DELETE] /api/v1/transactions/:id
        if (method === 'DELETE' && pathSegments[2] === 'transactions' && pathSegments.length === 4) {
            const txId = pathSegments[3];

            const result = await env.DB.prepare(
                "DELETE FROM goal_transactions WHERE id = ? AND user_id = ?"
            ).bind(txId, userId).run();

            if (result.meta && result.meta.changes === 0) {
                return new Response(JSON.stringify({ ok: false, error: "Not found or not your transaction" }), { status: 404, headers: baseHeaders });
            }

            return new Response(JSON.stringify({ ok: true, deleted: txId }), { status: 200, headers: baseHeaders });
        }


        return new Response(JSON.stringify({ error: "Invalid transaction route" }), { status: 404, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

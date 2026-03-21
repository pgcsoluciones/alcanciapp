// src/routes/goals.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

async function hasArchivedAtColumn(env) {
    try {
        const columns = await env.DB.prepare("PRAGMA table_info(goals)").all();
        const rows = Array.isArray(columns?.results) ? columns.results : (Array.isArray(columns) ? columns : []);
        return rows.some((c) => c.name === 'archived_at');
    } catch (e) {
        console.error("Error checking columns:", e);
        return false;
    }
}

async function ensureArchivedAtColumn(env) {
    const exists = await hasArchivedAtColumn(env);
    if (exists) return true;

    try {
        await env.DB.prepare("ALTER TABLE goals ADD COLUMN archived_at TEXT").run();
        return true;
    } catch (e) {
        const existsAfter = await hasArchivedAtColumn(env);
        if (existsAfter) return true;
        console.error("Error ensuring archived_at column:", e);
        return false;
    }
}

export async function handleGoals(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

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

            const name = String(body.name || '').trim();
            const durationMonths = Number(body.duration_months);
            const frequency = String(body.frequency || '').trim();
            const privacy = String(body.privacy || '').trim();
            const targetAmountRaw = body.target_amount ?? body.targetAmount;
            const targetAmount = Number(targetAmountRaw);
            const icon = body.icon ? String(body.icon).trim() : null;
            const currency = body.currency ? String(body.currency).trim().toUpperCase() : 'DOP';

            // Validaciones básicas
            if (!name || !durationMonths || !frequency || !privacy) {
                return new Response(JSON.stringify({
                    ok: false,
                    error: "Faltan campos (name, duration_months, frequency, privacy)"
                }), {
                    status: 400,
                    headers: baseHeaders
                });
            }

            // Validación de target_amount
            if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                return new Response(JSON.stringify({
                    ok: false,
                    error: "target_amount es obligatorio y debe ser mayor que 0"
                }), {
                    status: 400,
                    headers: baseHeaders
                });
            }

            // Validación simple de currency
            if (!['DOP', 'USD'].includes(currency)) {
                return new Response(JSON.stringify({
                    ok: false,
                    error: "currency debe ser DOP o USD"
                }), {
                    status: 400,
                    headers: baseHeaders
                });
            }

            const goalId = crypto.randomUUID();

            const stmt = env.DB.prepare(`
                INSERT INTO goals
                (id, user_id, name, duration_months, frequency, privacy, target_amount, icon, currency)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `).bind(
                goalId,
                userId,
                name,
                durationMonths,
                frequency,
                privacy,
                targetAmount,
                icon,
                currency
            );

            const result = await stmt.run();
            if (result.error) throw new Error("Db Error");

            return new Response(JSON.stringify({
                ok: true,
                goal: {
                    id: goalId,
                    name,
                    duration_months: durationMonths,
                    frequency,
                    privacy,
                    target_amount: targetAmount,
                    icon,
                    currency
                }
            }), { status: 201, headers: baseHeaders });
        }

        // [GET] /api/v1/goals -> LISTAR METAS ACTIVAS DEL USUARIO
        if (method === 'GET' && pathSegments.length === 3) {
            const hasArchived = await hasArchivedAtColumn(env);
            const query = hasArchived
                ? "SELECT * FROM goals WHERE user_id = ? AND archived_at IS NULL ORDER BY created_at DESC"
                : "SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC";
            const { results } = await env.DB.prepare(query).bind(userId).all();

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
                    status: 404,
                    headers: baseHeaders
                });
            }

            return new Response(JSON.stringify({ ok: true, goal }), { status: 200, headers: baseHeaders });
        }

        // [PATCH] /api/v1/goals/:id/archive -> ARCHIVAR META
        if (method === 'PATCH' && pathSegments.length === 5 && pathSegments[4] === 'archive') {
            const goalId = pathSegments[3];
            const hasArchived = await ensureArchivedAtColumn(env);
            if (!hasArchived) {
                return new Response(JSON.stringify({ ok: false, error: "No se pudo preparar archivado (archived_at)" }), {
                    status: 500,
                    headers: baseHeaders
                });
            }

            const result = await env.DB.prepare(
                "UPDATE goals SET archived_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ? AND archived_at IS NULL"
            ).bind(goalId, userId).run();

            if ((result?.meta?.changes || 0) < 1) {
                return new Response(JSON.stringify({ ok: false, error: "No encontrada o ya archivada" }), {
                    status: 404,
                    headers: baseHeaders
                });
            }

            return new Response(JSON.stringify({ ok: true, archived: goalId }), { status: 200, headers: baseHeaders });
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
                    status: 404,
                    headers: baseHeaders
                });
            }

            return new Response(JSON.stringify({ ok: true, deleted: goalId }), { status: 200, headers: baseHeaders });
        }

        return new Response(JSON.stringify({ error: "Route not found or method unsupported" }), {
            status: 404,
            headers: baseHeaders
        });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 500,
            headers: baseHeaders
        });
    }
}

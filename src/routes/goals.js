// src/routes/goals.js
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

async function hasArchivedAtColumn(env) {
    try {
        const columns = await env.DB.prepare("PRAGMA table_info(goals)").all();
        const rows = Array.isArray(columns?.results)
            ? columns.results
            : (Array.isArray(columns) ? columns : []);
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

function jsonResponse(payload, status, headers) {
    return new Response(JSON.stringify(payload), {
        status,
        headers: { ...headers, "Content-Type": "application/json" }
    });
}

export async function handleGoals(request, env) {
    const corsHeaders = getCorsHeaders(request, env);

    const authResult = await authenticateUser(request, env);
    if (authResult.error) {
        return jsonResponse(
            { ok: false, error: authResult.error },
            authResult.status,
            corsHeaders
        );
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

            if (!name || !durationMonths || !frequency || !privacy) {
                return jsonResponse(
                    {
                        ok: false,
                        error: "Faltan campos (name, duration_months, frequency, privacy)"
                    },
                    400,
                    baseHeaders
                );
            }

            if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                return jsonResponse(
                    {
                        ok: false,
                        error: "target_amount es obligatorio y debe ser mayor que 0"
                    },
                    400,
                    baseHeaders
                );
            }

            if (!['DOP', 'USD'].includes(currency)) {
                return jsonResponse(
                    {
                        ok: false,
                        error: "currency debe ser DOP o USD"
                    },
                    400,
                    baseHeaders
                );
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

            return jsonResponse(
                {
                    ok: true,
                    goal: {
                        id: goalId,
                        name,
                        duration_months: durationMonths,
                        frequency,
                        privacy,
                        target_amount: targetAmount,
                        icon,
                        currency,
                        archived_at: null
                    }
                },
                201,
                baseHeaders
            );
        }

        // [GET] /api/v1/goals -> LISTAR METAS ACTIVAS DEL USUARIO
        if (method === 'GET' && pathSegments.length === 3) {
            const hasArchived = await hasArchivedAtColumn(env);

            const query = hasArchived
                ? `
                    SELECT
                        g.*,
                        COALESCE(
                            (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                            0
                        ) AS total_saved
                    FROM goals g
                    WHERE g.user_id = ?
                      AND g.archived_at IS NULL
                    ORDER BY g.created_at DESC
                `
                : `
                    SELECT
                        g.*,
                        COALESCE(
                            (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                            0
                        ) AS total_saved
                    FROM goals g
                    WHERE g.user_id = ?
                    ORDER BY g.created_at DESC
                `;

            const { results } = await env.DB.prepare(query).bind(userId).all();

            return jsonResponse(
                {
                    ok: true,
                    goals: results || []
                },
                200,
                baseHeaders
            );
        }

        // [GET] /api/v1/goals/archived -> LISTAR METAS ARCHIVADAS
        // IMPORTANTE: debe ir antes de /api/v1/goals/:id
        if (method === 'GET' && pathSegments.length === 4 && pathSegments[3] === 'archived') {
            const hasArchived = await hasArchivedAtColumn(env);

            if (!hasArchived) {
                return jsonResponse(
                    { ok: true, goals: [] },
                    200,
                    baseHeaders
                );
            }

            const { results } = await env.DB.prepare(`
                SELECT
                    g.*,
                    COALESCE(
                        (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                        0
                    ) AS total_saved
                FROM goals g
                WHERE g.user_id = ?
                  AND g.archived_at IS NOT NULL
                ORDER BY g.archived_at DESC, g.created_at DESC
            `).bind(userId).all();

            return jsonResponse(
                {
                    ok: true,
                    goals: results || []
                },
                200,
                baseHeaders
            );
        }

        // [GET] /api/v1/goals/:id -> LEER UNA META
        if (method === 'GET' && pathSegments.length === 4) {
            const goalId = pathSegments[3];

            if (goalId === 'archived') {
                return jsonResponse(
                    { ok: false, error: "Ruta no válida" },
                    404,
                    baseHeaders
                );
            }

            const goal = await env.DB.prepare(`
                SELECT
                    g.*,
                    COALESCE(
                        (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                        0
                    ) AS total_saved
                FROM goals g
                WHERE g.id = ?
                  AND g.user_id = ?
            `).bind(goalId, userId).first();

            if (!goal) {
                return jsonResponse(
                    { ok: false, error: "Meta no encontrada o no pertenece al usuario" },
                    404,
                    baseHeaders
                );
            }

            return jsonResponse(
                { ok: true, goal },
                200,
                baseHeaders
            );
        }

        // [PATCH] /api/v1/goals/:id/archive -> ARCHIVAR META COMPLETADA
        if (method === 'PATCH' && pathSegments.length === 5 && pathSegments[4] === 'archive') {
            const goalId = pathSegments[3];
            const hasArchived = await ensureArchivedAtColumn(env);

            if (!hasArchived) {
                return jsonResponse(
                    { ok: false, error: "No se pudo preparar archivado (archived_at)" },
                    500,
                    baseHeaders
                );
            }

            const goal = await env.DB.prepare(`
                SELECT
                    g.*,
                    COALESCE(
                        (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                        0
                    ) AS total_saved
                FROM goals g
                WHERE g.id = ?
                  AND g.user_id = ?
            `).bind(goalId, userId).first();

            if (!goal) {
                return jsonResponse(
                    { ok: false, error: "Meta no encontrada" },
                    404,
                    baseHeaders
                );
            }

            if (goal.archived_at) {
                return jsonResponse(
                    { ok: false, error: "La meta ya está archivada" },
                    409,
                    baseHeaders
                );
            }

            const targetAmount = Number(goal.target_amount || 0);
            const totalSaved = Number(goal.total_saved || 0);

            if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
                return jsonResponse(
                    { ok: false, error: "Solo se pueden archivar metas completadas con objetivo válido" },
                    400,
                    baseHeaders
                );
            }

            if (totalSaved < targetAmount) {
                return jsonResponse(
                    { ok: false, error: "Solo se pueden archivar metas ya completadas" },
                    400,
                    baseHeaders
                );
            }

            const result = await env.DB.prepare(`
                UPDATE goals
                SET archived_at = CURRENT_TIMESTAMP
                WHERE id = ?
                  AND user_id = ?
                  AND archived_at IS NULL
            `).bind(goalId, userId).run();

            if ((result?.meta?.changes || 0) < 1) {
                return jsonResponse(
                    { ok: false, error: "No encontrada o ya archivada" },
                    404,
                    baseHeaders
                );
            }

            const archivedGoal = await env.DB.prepare(`
                SELECT
                    g.*,
                    COALESCE(
                        (SELECT SUM(t.amount) FROM goal_transactions t WHERE t.goal_id = g.id),
                        0
                    ) AS total_saved
                FROM goals g
                WHERE g.id = ?
                  AND g.user_id = ?
            `).bind(goalId, userId).first();

            return jsonResponse(
                {
                    ok: true,
                    archived: goalId,
                    goal: archivedGoal || null
                },
                200,
                baseHeaders
            );
        }

        // [DELETE] /api/v1/goals/:id -> BORRAR UNA META
        if (method === 'DELETE' && pathSegments.length === 4) {
            const goalId = pathSegments[3];

            if (goalId === 'archived') {
                return jsonResponse(
                    { ok: false, error: "Ruta no válida" },
                    404,
                    baseHeaders
                );
            }

            const result = await env.DB.prepare(
                "DELETE FROM goals WHERE id = ? AND user_id = ?"
            ).bind(goalId, userId).run();

            if (result.meta && result.meta.changes === 0) {
                return jsonResponse(
                    { ok: false, error: "No encontrada" },
                    404,
                    baseHeaders
                );
            }

            return jsonResponse(
                { ok: true, deleted: goalId },
                200,
                baseHeaders
            );
        }

        return jsonResponse(
            { error: "Route not found or method unsupported" },
            404,
            baseHeaders
        );

    } catch (e) {
        console.error("handleGoals error:", e);
        return jsonResponse(
            { ok: false, error: e.message },
            500,
            baseHeaders
        );
    }
}
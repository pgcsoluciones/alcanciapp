import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

async function ensureArchivedAtColumn(env) {
  try {
    const columns = await env.DB.prepare("PRAGMA table_info(goals)").all();
    const results = columns?.results || columns || [];
    const hasArchivedAt = results.some((col) => col.name === 'archived_at');

    if (!hasArchivedAt) {
      await env.DB.prepare("ALTER TABLE goals ADD COLUMN archived_at TEXT").run();
    }
  } catch (error) {
    // Si falla por columna ya existente o por variación del driver, no rompemos
    const msg = String(error?.message || error || '').toLowerCase();
    if (
      !msg.includes('duplicate column') &&
      !msg.includes('already exists')
    ) {
      throw error;
    }
  }
}

function json(data, status, headers) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...headers, "Content-Type": "application/json" }
  });
}

export async function handleGoals(request, env) {
  const corsHeaders = getCorsHeaders(request, env);
  const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  const authResult = await authenticateUser(request, env);
  if (authResult.error) {
    return json(
      { ok: false, error: authResult.error },
      authResult.status,
      corsHeaders
    );
  }

  const { userId } = authResult;
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const method = request.method;

  try {
    // Nos aseguramos de que exista archived_at para no romper el flujo
    await ensureArchivedAtColumn(env);

    // [POST] /api/v1/goals -> CREAR UNA META
    if (method === 'POST' && pathSegments.length === 3) {
      const body = await request.json();

      if (!body.name || !body.duration_months || !body.frequency || !body.privacy) {
        return json(
          { ok: false, error: "Faltan campos (name, duration_months, frequency, privacy)" },
          400,
          corsHeaders
        );
      }

      const currency = body.currency || 'DOP';
      if (!['DOP', 'USD'].includes(currency)) {
        return json(
          { ok: false, error: "Moneda no soportada. Use 'DOP' o 'USD'." },
          400,
          corsHeaders
        );
      }

      const goalId = crypto.randomUUID();

      const frontTarget =
        body.target_amount !== undefined ? body.target_amount : body.targetAmount;

      const targetAmount =
        frontTarget !== undefined && frontTarget !== null && frontTarget !== ''
          ? Number(frontTarget)
          : null;

      if (targetAmount !== null && (!Number.isFinite(targetAmount) || targetAmount <= 0)) {
        return json(
          { ok: false, error: "target_amount debe ser un número mayor que 0." },
          400,
          corsHeaders
        );
      }

      const durationMonths = Number(body.duration_months);
      if (!Number.isFinite(durationMonths) || durationMonths <= 0) {
        return json(
          { ok: false, error: "duration_months debe ser mayor que 0." },
          400,
          corsHeaders
        );
      }

      const stmt = env.DB.prepare(`
        INSERT INTO goals (
          id,
          user_id,
          name,
          duration_months,
          frequency,
          privacy,
          target_amount,
          icon,
          currency,
          archived_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      `).bind(
        goalId,
        userId,
        body.name,
        durationMonths,
        body.frequency,
        body.privacy,
        targetAmount,
        body.icon || null,
        currency
      );

      const result = await stmt.run();
      if (result.error) {
        throw new Error("Db Error");
      }

      return json(
        {
          ok: true,
          goal: {
            id: goalId,
            name: body.name,
            icon: body.icon || null,
            duration_months: durationMonths,
            frequency: body.frequency,
            privacy: body.privacy,
            target_amount: targetAmount,
            currency,
            archived_at: null
          }
        },
        201,
        corsHeaders
      );
    }

    // [GET] /api/v1/goals/archived -> LISTAR METAS ARCHIVADAS DEL USUARIO
    if (
      method === 'GET' &&
      pathSegments.length === 4 &&
      pathSegments[3] === 'archived'
    ) {
      const { results } = await env.DB.prepare(`
        SELECT
          g.*,
          COALESCE((
            SELECT SUM(t.amount)
            FROM goal_transactions t
            WHERE t.goal_id = g.id
          ), 0) AS total_saved
        FROM goals g
        WHERE g.user_id = ?
          AND g.archived_at IS NOT NULL
        ORDER BY g.archived_at DESC, g.created_at DESC
      `).bind(userId).all();

      return json(
        { ok: true, goals: results || [] },
        200,
        corsHeaders
      );
    }

    // [GET] /api/v1/goals -> LISTAR METAS ACTIVAS DEL USUARIO
    if (method === 'GET' && pathSegments.length === 3) {
      const { results } = await env.DB.prepare(`
        SELECT
          g.*,
          COALESCE((
            SELECT SUM(t.amount)
            FROM goal_transactions t
            WHERE t.goal_id = g.id
          ), 0) AS total_saved
        FROM goals g
        WHERE g.user_id = ?
          AND g.archived_at IS NULL
        ORDER BY g.created_at DESC
      `).bind(userId).all();

      return json(
        { ok: true, goals: results || [] },
        200,
        corsHeaders
      );
    }

    // [GET] /api/v1/goals/:id -> LEER UNA META
    if (method === 'GET' && pathSegments.length === 4) {
      const goalId = pathSegments[3];

      const goal = await env.DB.prepare(`
        SELECT
          g.*,
          COALESCE((
            SELECT SUM(t.amount)
            FROM goal_transactions t
            WHERE t.goal_id = g.id
          ), 0) AS total_saved
        FROM goals g
        WHERE g.id = ?
          AND g.user_id = ?
      `).bind(goalId, userId).first();

      if (!goal) {
        return json(
          { ok: false, error: "Meta no encontrada o no pertenece al usuario" },
          404,
          corsHeaders
        );
      }

      return json({ ok: true, goal }, 200, corsHeaders);
    }

    // [DELETE] /api/v1/goals/:id -> BORRAR UNA META
    if (method === 'DELETE' && pathSegments.length === 4) {
      const goalId = pathSegments[3];

      const result = await env.DB.prepare(`
        DELETE FROM goals
        WHERE id = ?
          AND user_id = ?
      `).bind(goalId, userId).run();

      if (result.meta && result.meta.changes === 0) {
        return json(
          { ok: false, error: "No encontrada" },
          404,
          corsHeaders
        );
      }

      return json(
        { ok: true, deleted: goalId },
        200,
        corsHeaders
      );
    }

    // [PATCH] /api/v1/goals/:id/archive -> ARCHIVAR UNA META COMPLETADA
    if (
      method === 'PATCH' &&
      pathSegments.length === 5 &&
      pathSegments[4] === 'archive'
    ) {
      const goalId = pathSegments[3];

      const goal = await env.DB.prepare(`
        SELECT
          g.id,
          g.name,
          g.target_amount,
          g.archived_at,
          COALESCE((
            SELECT SUM(t.amount)
            FROM goal_transactions t
            WHERE t.goal_id = g.id
          ), 0) AS total_saved
        FROM goals g
        WHERE g.id = ?
          AND g.user_id = ?
      `).bind(goalId, userId).first();

      if (!goal) {
        return json(
          { ok: false, error: "Meta no encontrada" },
          404,
          corsHeaders
        );
      }

      if (goal.archived_at) {
        return json(
          { ok: false, error: "La meta ya está archivada" },
          409,
          corsHeaders
        );
      }

      const targetAmount = Number(goal.target_amount || 0);
      const totalSaved = Number(goal.total_saved || 0);

      if (!Number.isFinite(targetAmount) || targetAmount <= 0) {
        return json(
          { ok: false, error: "Solo se pueden archivar metas con objetivo válido y completado." },
          400,
          corsHeaders
        );
      }

      if (totalSaved < targetAmount) {
        return json(
          { ok: false, error: "Solo se pueden archivar metas completadas." },
          400,
          corsHeaders
        );
      }

      const result = await env.DB.prepare(`
        UPDATE goals
        SET archived_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?
          AND archived_at IS NULL
      `).bind(goalId, userId).run();

      if (result.meta && result.meta.changes === 0) {
        return json(
          { ok: false, error: "No se pudo archivar la meta" },
          400,
          corsHeaders
        );
      }

      return json(
        {
          ok: true,
          archived: goalId,
          archived_at: new Date().toISOString()
        },
        200,
        corsHeaders
      );
    }

    return json(
      { ok: false, error: "Route not found or method unsupported" },
      404,
      corsHeaders
    );
  } catch (e) {
    return json(
      {
        ok: false,
        error: e?.message || "Internal Server Error"
      },
      500,
      corsHeaders
    );
  }
}
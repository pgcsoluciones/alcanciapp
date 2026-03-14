// src/lib/badges.js

/**
 * Evalúa y otorga insignias basadas en la transacción actual y el estado de la meta.
 */
export async function evaluateBadges(db, userId, goalId, txAmount, env) {
    const badgesToGrant = [];

    // 1. Obtener datos de la meta y transacciones anteriores
    const goal = await db.prepare(
        "SELECT *, COALESCE((SELECT SUM(amount) FROM goal_transactions WHERE goal_id = ?), 0) as total_saved FROM goals WHERE id = ?"
    ).bind(goalId, goalId).first();

    const transactions = await db.prepare(
        "SELECT * FROM goal_transactions WHERE goal_id = ? ORDER BY created_at DESC"
    ).bind(goalId).all();

    const allTransactionsCount = await db.prepare(
        "SELECT COUNT(*) as count FROM goal_transactions WHERE user_id = ?"
    ).bind(userId).first();

    const txCount = transactions.results.length;
    const totalSaved = goal.total_saved;
    const targetAmount = goal.target_amount;
    const percent = targetAmount ? (totalSaved / targetAmount) * 100 : 0;

    // --- A. Primer Aporte ---
    if (allTransactionsCount.count === 1) {
        badgesToGrant.push({ code: 'first_contribution' });
    }

    // --- B. Doble Cuota (2 tx mismo día) ---
    const today = new Date().toISOString().split('T')[0];
    const todayTxs = transactions.results.filter(t => t.created_at.startsWith(today));
    if (todayTxs.length >= 2) {
        badgesToGrant.push({ code: 'double_quota' });
    }

    // --- C. Hitos de Progreso ---
    if (percent >= 25) badgesToGrant.push({ code: 'hitos_25', goal_id: goalId });
    if (percent >= 50) badgesToGrant.push({ code: 'hitos_50', goal_id: goalId });
    if (percent >= 75) badgesToGrant.push({ code: 'hitos_75', goal_id: goalId });
    if (percent >= 100) badgesToGrant.push({ code: 'goal_completed', goal_id: goalId });

    // --- D. Lógica de Constancia y Puntualidad (Suscinta para V1) ---
    // Nota: Para V1 Real, simplificamos: si tiene X aportes, se asume constancia si no hay lógica de periodos compleja aún
    if (txCount >= 3) badgesToGrant.push({ code: 'constancy_3', goal_id: goalId });
    if (txCount >= 7) badgesToGrant.push({ code: 'constancy_7', goal_id: goalId });
    if (txCount >= 5) badgesToGrant.push({ code: 'punctual_5', goal_id: goalId });
    if (txCount >= 10) badgesToGrant.push({ code: 'racha_10', goal_id: goalId });

    // 2. Insertar insignias (ignorando duplicados por el UNIQUE en la DB)
    for (const badge of badgesToGrant) {
        try {
            const id = crypto.randomUUID();
            await db.prepare(
                "INSERT OR IGNORE INTO user_badges (id, user_id, badge_code, goal_id) VALUES (?, ?, ?, ?)"
            ).bind(id, userId, badge.code, badge.goal_id || null).run();
        } catch (e) {
            console.error("Error otorgando insignia:", badge.code, e);
        }
    }

    return badgesToGrant;
}

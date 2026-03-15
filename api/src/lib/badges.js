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

    // --- D. Lógica de Rachas y Puntualidad Real ---
    const freq = (goal.frequency || 'Mensual').toLowerCase();
    let daysPerPeriod = 30.42;
    if (freq.includes('quincenal')) daysPerPeriod = 15;
    if (freq.includes('semanal')) daysPerPeriod = 7;
    if (freq.includes('diario')) daysPerPeriod = 1;

    // Calcular atrasos: Un aporte es puntual si se hace dentro del periodo esperado.
    // Para simplificar V1 Real: analizamos los últimos N aportes y vemos la distancia entre ellos.
    const sortedTxs = [...transactions.results].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    let punctualStreak = 0;
    let maxPunctualStreak = 0;
    let wasBehindAtSomePoint = false;

    // Evaluar puntualidad básica: si la distancia entre aportes es <= daysPerPeriod + 2 días de gracia
    for (let i = 0; i < sortedTxs.length; i++) {
        const currentTxDate = new Date(sortedTxs[i].created_at);
        const prevTxDate = i > 0 ? new Date(sortedTxs[i - 1].created_at) : new Date(goal.created_at);

        const diffDays = (currentTxDate - prevTxDate) / (1000 * 3600 * 24);

        if (diffDays <= daysPerPeriod + 2) {
            punctualStreak++;
        } else {
            wasBehindAtSomePoint = true;
            punctualStreak = 1; // Resetea racha pero el aporte actual cuenta como el inicio de una nueva
        }
        maxPunctualStreak = Math.max(maxPunctualStreak, punctualStreak);
    }

    if (maxPunctualStreak >= 5) badgesToGrant.push({ code: 'punctual_5', goal_id: goalId });
    if (maxPunctualStreak >= 10) badgesToGrant.push({ code: 'racha_10', goal_id: goalId });

    // --- E. Recuperación (Fénix) ---
    // Si estuvo atrasado alguna vez y hoy su ritmo es 'on_track' o 'ahead'
    const periodsElapsed = Math.floor((new Date() - new Date(goal.created_at)) / (daysPerPeriod * 24 * 3600 * 1000));
    const currentPigCoins = totalSaved / (targetAmount / (periodsElapsed || 1)); // Estimación rápida
    if (wasBehindAtSomePoint && (totalSaved / (targetAmount / (goal.duration_months || 1)) >= periodsElapsed)) {
        badgesToGrant.push({ code: 'recovery', goal_id: goalId });
    }

    // --- F. Constancia (3 y 7 aportes) ---
    if (txCount >= 3) badgesToGrant.push({ code: 'constancy_3', goal_id: goalId });
    if (txCount >= 7) badgesToGrant.push({ code: 'constancy_7', goal_id: goalId });

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

/**
 * savingsCalc.js
 * Lógica pura de cálculo para el plan de ahorro de AlcanciApp.
 * Sin JSX ni efectos secundarios — solo funciones puras.
 */

// ─── Períodos por frecuencia ───────────────────────────────────────────────

/**
 * Retorna cuántos períodos totales tiene el plan de ahorro.
 * @param {Object} goal - objeto meta con duration_months y frequency
 * @returns {number}
 */
export function getPeriodsTotal(goal) {
    const months = Number(goal.duration_months) || 1;
    const freq = (goal.frequency || 'Mensual').toLowerCase();
    if (freq.includes('semanal')) return Math.round(months * 4.33);
    if (freq.includes('quincenal')) return months * 2;
    if (freq.includes('diario') || freq.includes('diaria')) return months * 30;
    return months; // Mensual por defecto
}

/**
 * Cuota sugerida por período.
 * @param {Object} goal
 * @returns {number}
 */
export function getSuggestedQuota(goal) {
    if (!goal.target_amount || goal.target_amount <= 0) return 0;
    const periods = getPeriodsTotal(goal);
    return Math.ceil(goal.target_amount / periods);
}

// ─── Períodos transcurridos ────────────────────────────────────────────────

/**
 * Cantidad de períodos completos que han transcurrido desde la creación.
 * @param {Object} goal
 * @returns {number}
 */
export function getPeriodsElapsed(goal) {
    if (!goal.created_at) return 0;
    const created = new Date(goal.created_at);
    const now = new Date();
    const diffMs = now - created;
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    const freq = (goal.frequency || 'Mensual').toLowerCase();

    if (freq.includes('semanal')) return Math.floor(diffDays / 7);
    if (freq.includes('quincenal')) return Math.floor(diffDays / 15);
    if (freq.includes('diario') || freq.includes('diaria')) return Math.floor(diffDays);
    return Math.floor(diffDays / 30); // Mensual
}

/**
 * Cantidad de períodos con al menos un aporte registrado (agrupado por mes).
 * @param {Array} transactions
 * @param {Object} goal
 * @returns {number}
 */
export function getPeriodsCompleted(transactions, goal) {
    if (!transactions || transactions.length === 0) return 0;
    const quota = getSuggestedQuota(goal);
    const freq = (goal.frequency || 'Mensual').toLowerCase();

    if (freq.includes('semanal')) {
        // Agrupar por semana del año
        const weeks = new Set();
        transactions.forEach(tx => {
            const d = new Date(tx.created_at);
            const startOfYear = new Date(d.getFullYear(), 0, 1);
            const week = Math.floor((d - startOfYear) / (7 * 24 * 60 * 60 * 1000));
            weeks.add(`${d.getFullYear()}-${week}`);
        });
        return weeks.size;
    }

    // Para Mensual y Quincenal: agrupar por mes-año
    const byMonth = {};
    transactions.forEach(tx => {
        const d = new Date(tx.created_at);
        const key = `${d.getFullYear()}-${d.getMonth()}`;
        byMonth[key] = (byMonth[key] || 0) + Number(tx.amount);
    });

    // Contar meses donde el total aportado >= cuota sugerida
    const completedMonths = Object.values(byMonth).filter(sum => sum >= quota * 0.8);
    return completedMonths.length;
}

// ─── Estado del Ritmo ──────────────────────────────────────────────────────

/**
 * Evalúa si el usuario está al día, adelantado o atrasado.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {{ status: 'on_track'|'ahead'|'behind', label: string, emoji: string, color: string, bg: string }}
 */
export function getRhythmStatus(goal, transactions) {
    if (!goal.target_amount || goal.target_amount <= 0) {
        return { status: 'no_target', label: 'Sin objetivo', emoji: '—', color: '#6B7280', bg: '#F3F4F6' };
    }
    const quota = getSuggestedQuota(goal);
    const elapsed = getPeriodsElapsed(goal);
    const totalSaved = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const expected = quota * elapsed;

    if (elapsed === 0 && totalSaved === 0) {
        return { status: 'not_started', label: 'Primer aporte pendiente', emoji: '🏁', color: '#6B7280', bg: '#F3F4F6' };
    }
    if (totalSaved >= expected * 1.1) {
        return { status: 'ahead', label: 'Adelantado', emoji: '🚀', color: '#059669', bg: '#ECFDF5' };
    }
    if (expected > 0 && totalSaved >= expected * 0.85) {
        return { status: 'on_track', label: 'Al día', emoji: '✅', color: '#2563EB', bg: '#EFF6FF' };
    }
    return { status: 'behind', label: 'Atrasado', emoji: '⚠️', color: '#D97706', bg: '#FFFBEB' };
}

// ─── Racha de Aportes ──────────────────────────────────────────────────────

/**
 * Cuenta cuántos meses consecutivos (hacia atrás desde hoy) tiene al menos un aporte.
 * @param {Array} transactions
 * @returns {number}
 */
export function getStreakMonths(transactions) {
    if (!transactions || transactions.length === 0) return 0;
    const now = new Date();
    let streak = 0;

    for (let i = 0; i < 12; i++) {
        const checkMonth = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${checkMonth.getFullYear()}-${checkMonth.getMonth()}`;
        const hasAporte = transactions.some(tx => {
            const d = new Date(tx.created_at);
            return `${d.getFullYear()}-${d.getMonth()}` === key;
        });
        if (!hasAporte && i > 0) break; // Corta la racha si falta un mes (excepto el actual)
        if (hasAporte) streak++;
    }
    return streak;
}

// ─── Logros ────────────────────────────────────────────────────────────────

/**
 * Retorna array de logros desbloqueados para esta meta.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {Array<{ id: string, label: string, emoji: string }>}
 */
export function getAchievements(goal, transactions) {
    const totalSaved = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const hasTarget = goal.target_amount > 0;
    const progress = hasTarget ? (totalSaved / goal.target_amount) * 100 : 0;
    const streak = getStreakMonths(transactions);
    const achieved = [];

    if (totalSaved > 0) {
        achieved.push({ id: 'first_aporte', label: 'Primer aporte', emoji: '🎯' });
    }
    if (hasTarget && progress >= 25) {
        achieved.push({ id: 'p25', label: '25% alcanzado', emoji: '📈' });
    }
    if (hasTarget && progress >= 50) {
        achieved.push({ id: 'p50', label: 'A la mitad', emoji: '🔥' });
    }
    if (hasTarget && progress >= 75) {
        achieved.push({ id: 'p75', label: '¡75%!', emoji: '🏁' });
    }
    if (hasTarget && progress >= 100) {
        achieved.push({ id: 'completed', label: 'Meta lograda', emoji: '🏆' });
    }
    if (streak >= 3) {
        achieved.push({ id: 'streak3', label: `Racha de ${streak} meses`, emoji: '⚡' });
    }
    return achieved;
}

// ─── Mensaje Motivacional Dinámico ─────────────────────────────────────────

/**
 * Retorna un mensaje corto de motivación basado en el estado actual.
 * @param {Object} rhythmStatus
 * @param {number} progressPercent
 * @param {number} streak
 * @returns {string}
 */
export function getMotivationalMessage(rhythmStatus, progressPercent, streak) {
    if (progressPercent >= 100) return '¡Felicidades! Meta cumplida. 🏆';
    if (rhythmStatus.status === 'ahead') return `Vas ${Math.round(progressPercent)}% avanzado. ¡Sigue así!`;
    if (rhythmStatus.status === 'behind') {
        return 'Un aporte extra esta semana te pone al día. ¡Tú puedes!';
    }
    if (streak >= 3) return `¡${streak} meses seguidos ahorrando! Eso es disciplina real.`;
    if (progressPercent >= 75) return '¡Ya casi! Estás en la recta final. 💪';
    if (progressPercent >= 50) return '¡Más de la mitad del camino recorrido!';
    if (progressPercent >= 25) return '¡Buen ritmo! Mantén la constancia.';
    if (progressPercent > 0) return 'El primer paso ya está dado. ¡Avanza!';
    return 'Tu plan te espera. ¡El primer aporte es el más importante!';
}

// ─── Helpers de formato ────────────────────────────────────────────────────

/**
 * Formatea un monto en RD$.
 */
export function fmtRD(amount) {
    return `RD$ ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

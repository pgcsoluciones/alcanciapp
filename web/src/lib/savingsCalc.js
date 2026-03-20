/**
 * Retorna el total de PigCoins acumulados.
 * 1 PigCoin = 1 Cuota sugerida completa.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {number}
 */
export function getPigCoins(goal, transactions) {
    const quota = getSuggestedQuota(goal);
    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
        : Number(goal.total_saved || 0);

    // Si no hay cuota (ahorro libre), usamos 250 como base simbólica (consistente con GoalCard)
    if (!quota || quota <= 0) {
        const result = totalSaved / 250;
        return isNaN(result) ? 0 : Number(result.toFixed(2));
    }

    const result = totalSaved / quota;
    return isNaN(result) ? 0 : Number(result.toFixed(2));
}

/**
 * Calcula cuánto PigCoin se ha acumulado en el "período actual" y cuánto falta.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {{ current: number, remainingRD: number, completePercent: number }}
 */
export function getPigCoinProgress(goal, transactions) {
    const quota = getSuggestedQuota(goal);
    if (!quota || quota <= 0) return { current: 0, remainingRD: 0, completePercent: 0 };

    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
        : Number(goal.total_saved || 0);

    const currentFraction = (totalSaved / quota) % 1;
    const currentInRD = totalSaved % quota;
    const remainingRD = quota - currentInRD;

    return {
        current: Number(currentFraction.toFixed(2)),
        remainingRD,
        completePercent: Math.round(currentFraction * 100)
    };
}

/**
 * Calcula el tiempo restante y devuelve un objeto de estado contextual.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {{ label: string, totalSeconds: number, status: string }}
 */
export function getCountdownStatus(goal, transactions) {
    if (!goal.created_at) return { label: 'Iniciando...', totalSeconds: 0, status: 'idle' };

    const rhythm = getRhythmStatus(goal, transactions);
    if (rhythm.status === 'completed') {
        return { label: 'Meta alcanzada con éxito 🏆', totalSeconds: 0, status: 'completed' };
    }

    if (rhythm.status === 'ahead') {
        return { label: 'Vas adelantado. Ya sumaste tu próximo PigCoin antes de tiempo.', totalSeconds: 0, status: 'ahead' };
    }

    // Base: Último aporte o fecha de creación
    let baseDate = new Date(goal.created_at);
    if (transactions && transactions.length > 0) {
        const sorted = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        baseDate = new Date(sorted[0].created_at);
    }

    const freq = (goal.frequency || 'Mensual').toLowerCase();
    let intervalDays = 30;
    if (freq.includes('semanal')) intervalDays = 7;
    if (freq.includes('quincenal')) intervalDays = 15;
    if (freq.includes('diario')) intervalDays = 1;

    const nextAporteDate = new Date(baseDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffMs = nextAporteDate - now;

    if (diffMs <= 0) {
        if (rhythm.status === 'behind') {
            return { label: '¡Oportunidad vencida! Haz un aporte para recuperarte.', totalSeconds: 0, status: 'behind' };
        }
        return { label: `Hoy toca sumar tu PigCoin de la ${getFreqLabel(goal.frequency)}.`, totalSeconds: 0, status: 'due' };
    }

    const totalSeconds = Math.floor(diffMs / 1000);
    const d = Math.floor(totalSeconds / (24 * 3600));
    const h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    const timeStr = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;
    return {
        label: `Tu próxima oportunidad de sumar 1 PigCoin vence en ${timeStr}`,
        totalSeconds,
        status: 'on_track'
    };
}

/**
 * Evalúa si el usuario está al día, adelantado o atrasado.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {{ status: 'not_started'|'on_track'|'ahead'|'behind'|'completed', label: string, emoji: string, color: string, bg: string }}
 */
export function getRhythmStatus(goal, transactions) {
    if (!goal.target_amount || goal.target_amount <= 0) {
        return { status: 'no_target', label: 'Sin objetivo', emoji: '—', color: '#6B7280', bg: '#F3F4F6' };
    }

    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
        : Number(goal.total_saved || 0);

    if (totalSaved >= goal.target_amount) {
        return { status: 'completed', label: 'Completada', emoji: '🏆', color: '#059669', bg: '#ECFDF5' };
    }

    const pigCoins = getPigCoins(goal, transactions);
    const elapsed = getPeriodsElapsed(goal);

    if (totalSaved === 0) {
        return { status: 'not_started', label: 'Sin iniciar', emoji: '🏁', color: '#6B7280', bg: '#F3F4F6' };
    }

    if (pigCoins >= elapsed + 1) {
        return { status: 'ahead', label: 'Adelantado', emoji: '🚀', color: '#059669', bg: '#ECFDF5' };
    }
    if (pigCoins >= elapsed) {
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
        if (!hasAporte && i > 0) break;
        if (hasAporte) streak++;
    }
    return streak;
}

// ─── Logros (Gestor de Insignias Reales) ───────────────────────────────────

/**
 * Retorna array de insignias desbloqueadas según reglas de AlcanciApp V1.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {Array<{ id: string, label: string, icon: string, description: string }>}
 */
export function getAchievements(goal, transactions) {
    if (!transactions || transactions.length === 0) return [];

    const totalSaved = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const progress = goal.target_amount > 0 ? (totalSaved / goal.target_amount) * 100 : 0;
    const quota = getSuggestedQuota(goal);
    const achieved = [];

    // 1. Bienvenida (Primer aporte)
    achieved.push({
        id: 'first_goal',
        label: 'Ahorrador Novato',
        icon: 'badge_first_goal.png',
        description: '¡Primer paso dado! Bienvenido a la disciplina.'
    });

    // 2. Sprint de Ahorro (2 aportes en un mismo día)
    const hasSprint = transactions.some((tx, idx) => {
        return transactions.some((tx2, idx2) => {
            if (idx === idx2) return false;
            const d1 = new Date(tx.created_at).toDateString();
            const d2 = new Date(tx2.created_at).toDateString();
            return d1 === d2;
        });
    });
    if (hasSprint) {
        achieved.push({
            id: 'saving_sprint',
            label: 'Sprint de Ahorro',
            icon: 'badge_saving_sprint.png',
            description: 'Dos aportes en un solo día. ¡Qué energía!'
        });
    }
    if (hasSprint) {
        achieved.push({
            id: 'saving_sprint',
            label: 'Sprint de Ahorro',
            icon: 'badge_saving_sprint.png',
            description: 'Dos aportes en un solo día. ¡Qué energía!'
        });
    }

    // 3. Ahorrador Extra (Aporte > 1.5x cuota)
    const hasExtra = transactions.some(tx => Number(tx.amount) >= quota * 1.5);
    if (hasExtra) {
        achieved.push({
            id: 'budget_captain',
            label: 'Capitán del Presupuesto',
            icon: 'badge_budget_captain.png',
            description: 'Diste más de lo esperado. ¡Mente de tiburón!'
        });
    }

    // 4. Disciplina de Hierro (Racha de 3 meses/períodos)
    const streak = getStreakMonths(transactions);
    if (streak >= 3) {
        achieved.push({
            id: 'iron_streak',
            label: 'Disciplina de Hierro',
            icon: 'badge_iron_streak.png',
            description: '3 meses consecutivos ahorrando sin falta.'
        });
    }

    // 5. Hitos de progreso (25, 50, 75, 100)
    if (progress >= 25) {
        achieved.push({
            id: 'savings_takeoff',
            label: 'Despegue',
            icon: 'badge_savings_takeoff.png',
            description: 'Ya tienes un cuarto de tu meta asegurado.'
        });
    }
    if (progress >= 50) {
        achieved.push({
            id: 'vault_premium',
            label: 'Bóveda Premium',
            icon: 'badge_vault_premium.png',
            description: '¡Mitad de camino! Tu alcancía pesa mucho.'
        });
    }
    if (progress >= 75) {
        achieved.push({
            id: 'steady_harvest',
            label: 'Cosecha Constante',
            icon: 'badge_steady_harvest.png',
            description: 'Casi lo logras, el 75% ya es tuyo.'
        });
    }
    if (progress >= 100) {
        achieved.push({
            id: 'grand_cup',
            label: 'Copa Gran Progreso',
            icon: 'badge_grand_progress_cup.png',
            description: '¡META LOGRADA! Eres un maestro del ahorro.'
        });
    }

    return achieved;
}

// ─── Mensaje Motivacional Dinámico ─────────────────────────────────────────

export function getMotivationalMessage(goal, transactions) {
    const totalSaved = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
    const progress = goal.target_amount > 0 ? (totalSaved / goal.target_amount) * 100 : 0;
    const status = getRhythmStatus(goal, transactions);
    const prog = getPigCoinProgress(goal, transactions);

    if (progress >= 100) return '¡Felicidades! Meta cumplida. 🏆';

    if (status.status === 'behind') {
        return `⚠️ Estás un poco atrás. ¡Haz un aporte para completar tu próximo PigCoin y ponerte al día!`;
    }

    if (status.status === 'ahead') {
        return '🚀 ¡Vas volando! Estás por delante de tu plan de ahorro.';
    }

    if (prog.current > 0) {
        return `Llevas ${fmtPigCoin(prog.current)} acumulados en este periodo. ¡Sigue así! 🐷`;
    }

    return 'Tu disciplina financiera rinde frutos. ¡Haz tu primer aporte!';
}

// ─── Helpers de formato ────────────────────────────────────────────────────

// ─── Helpers de cálculo y etiquetas ──────────────────────────────────────

/**
 * Calcula la cuota sugerida (monto total / meses en la frecuencia elegida).
 * Redondea siempre hacia arriba al entero siguiente.
 */
export function getSuggestedQuota(goal) {
    const target = Number(goal.target_amount || 0);
    if (target <= 0 || !goal.duration_months) return 0;

    const freq = (goal.frequency || 'Mensual').toLowerCase();
    let divisor = goal.duration_months;
    if (freq.includes('quincenal')) divisor *= 2;
    if (freq.includes('semanal')) divisor *= 4.34;
    if (freq.includes('diario')) divisor *= 30.42;

    const rawQuota = target / (divisor || 1);
    const result = Math.ceil(rawQuota);
    return isNaN(result) ? 0 : result;
}

/**
 * Retorna la etiqueta amigable de la frecuencia.
 */
export function getFreqLabel(freq) {
    const f = (freq || 'Mensual').toLowerCase();
    if (f === 'diario') return 'diario';
    if (f === 'semanal') return 'semanal';
    if (f === 'quincenal') return 'quincenal';
    return 'mensual';
}

/**
 * Calcula el total de períodos (cuotas) que tiene la meta.
 */
export function getPeriodsTotal(goal) {
    if (!goal.duration_months) return 0;
    const freq = (goal.frequency || 'Mensual').toLowerCase();
    if (freq.includes('quincenal')) return goal.duration_months * 2;
    if (freq.includes('semanal')) return Math.floor(goal.duration_months * 4.34);
    if (freq.includes('diario')) return goal.duration_months * 30;
    return goal.duration_months;
}

/**
 * Calcula cuántas cuotas completas se han ahorrado.
 */
export function getPeriodsCompleted(goal, transactions) {
    const quota = getSuggestedQuota(goal);
    if (!quota || quota <= 0) return 0;
    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
        : Number(goal.total_saved || 0);
    return Math.floor(totalSaved / quota);
}

/**
 * Calcula cuántos períodos han pasado desde la creación de la meta.
 */
export function getPeriodsElapsed(goal) {
    if (!goal.created_at) return 0;
    const now = new Date();
    const start = new Date(goal.created_at);
    const diffMs = now - start;
    const freq = (goal.frequency || 'Mensual').toLowerCase();

    let msInPeriod = 30.42 * 24 * 3600 * 1000;
    if (freq.includes('quincenal')) msInPeriod = 15.21 * 24 * 3600 * 1000;
    if (freq.includes('semanal')) msInPeriod = 7 * 24 * 3600 * 1000;
    if (freq.includes('diario')) msInPeriod = 1 * 24 * 3600 * 1000;

    return Math.floor(diffMs / msInPeriod);
}

export function fmtRD(amount, currency = 'DOP') {
    const num = Number(amount);
    if (isNaN(num)) return currency === 'USD' ? '$ 0' : 'RD$ 0';
    const prefix = currency === 'USD' ? '$' : 'RD$ ';
    return `${prefix}${num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

/**
 * Calcula el porcentaje de progreso de una meta de forma segura.
 * @param {Object} goal 
 * @param {Array} transactions 
 * @returns {number} 0 a 100
 */
export function getGoalProgress(goal, transactions) {
    const target = Number(goal.target_amount || 0);
    if (target <= 0) return 0;
    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
        : Number(goal.total_saved || 0);
    const progress = (totalSaved / target) * 100;
    return isNaN(progress) ? 0 : Math.min(Math.round(progress), 100);
}

export function fmtPigCoin(amount) {
    return `${Number(amount || 0).toFixed(2)} 🐷`;
}

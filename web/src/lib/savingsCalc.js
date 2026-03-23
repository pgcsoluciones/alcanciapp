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
    const quota = Number(getSuggestedQuota(goal) || 0);
    if (!Number.isFinite(quota) || quota <= 0) {
        return { current: 0, remainingRD: 0, completePercent: 0 };
    }

    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
        : Number(goal.total_saved || 0);

    if (!Number.isFinite(totalSaved) || totalSaved <= 0) {
        return { current: 0, remainingRD: quota, completePercent: 0 };
    }

    const remainder = totalSaved % quota;

    // Si cayó exacto en una cuota completa, mostramos 1.00 / 100% en vez de 0.00 / 0%
    if (remainder === 0) {
        return {
            current: 1,
            remainingRD: 0,
            completePercent: 100
        };
    }

    const currentFraction = remainder / quota;
    const remainingRD = quota - remainder;

    return {
        current: Number(currentFraction.toFixed(2)),
        remainingRD: Number(remainingRD.toFixed(2)),
        completePercent: Math.round(currentFraction * 100)
    };
}

/**
 * Calcula el tiempo restante y devuelve un objeto de estado contextual.
 * Basado en el calendario real de la meta, no en el último aporte.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {{ label: string, totalSeconds: number, status: string }}
 */
export function getCountdownStatus(goal, transactions) {
    if (!goal?.created_at) {
        return { label: 'Iniciando...', totalSeconds: 0, status: 'idle' };
    }

    const rhythm = getRhythmStatus(goal, transactions);

    if (rhythm.status === 'completed') {
        return { label: 'Meta alcanzada con éxito 🏆', totalSeconds: 0, status: 'completed' };
    }

    if (rhythm.status === 'no_target') {
        return { label: 'Ahorro libre — suma a tu propio ritmo 🐷', totalSeconds: 0, status: 'idle' };
    }

    const start = new Date(goal.created_at);
    if (Number.isNaN(start.getTime())) {
        return { label: 'Iniciando...', totalSeconds: 0, status: 'idle' };
    }

    const freq = (goal.frequency || 'Mensual').toLowerCase();

    let msInPeriod = 30.42 * 24 * 60 * 60 * 1000;
    if (freq.includes('quincenal')) msInPeriod = 15.21 * 24 * 60 * 60 * 1000;
    if (freq.includes('semanal')) msInPeriod = 7 * 24 * 60 * 60 * 1000;
    if (freq.includes('diario')) msInPeriod = 1 * 24 * 60 * 60 * 1000;

    const totalPeriods = getPeriodsTotal(goal);
    const periodsCompleted = getPeriodsCompleted(goal, transactions);
    const periodsElapsed = getPeriodsElapsed(goal);

    if (totalPeriods > 0 && periodsCompleted >= totalPeriods) {
        return { label: 'Meta alcanzada con éxito 🏆', totalSeconds: 0, status: 'completed' };
    }

    // La próxima cuota esperada es la siguiente que aún no se ha completado
    const nextDuePeriod = periodsCompleted + 1;

    if (totalPeriods > 0 && nextDuePeriod > totalPeriods) {
        return { label: 'Meta alcanzada con éxito 🏆', totalSeconds: 0, status: 'completed' };
    }

    const nextDueDate = new Date(start.getTime() + nextDuePeriod * msInPeriod);
    const now = new Date();
    const diffMs = nextDueDate.getTime() - now.getTime();

    const totalSeconds = Math.max(0, Math.floor(diffMs / 1000));
    const d = Math.floor(totalSeconds / (24 * 3600));
    const h = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);

    const futureTimeStr = d > 0 ? `${d}d ${h}h` : `${h}h ${m}m`;

    const overdueSeconds = Math.max(0, Math.floor(Math.abs(diffMs) / 1000));
    const od = Math.floor(overdueSeconds / (24 * 3600));
    const oh = Math.floor((overdueSeconds % (24 * 3600)) / 3600);
    const om = Math.floor((overdueSeconds % 3600) / 60);

    const overdueTimeStr = od > 0 ? `${od}d ${oh}h` : `${oh}h ${om}m`;

    const isSameDay =
        nextDueDate.getFullYear() === now.getFullYear() &&
        nextDueDate.getMonth() === now.getMonth() &&
        nextDueDate.getDate() === now.getDate();

    if (periodsCompleted < periodsElapsed) {
        return {
            label: `Atrasada: tu aporte ${getFreqLabel(goal.frequency)} va vencido por ${overdueTimeStr}`,
            totalSeconds: 0,
            status: 'behind'
        };
    }

    if (isSameDay || diffMs <= 0) {
        return {
            label: `Hoy toca tu próximo aporte ${getFreqLabel(goal.frequency)}`,
            totalSeconds: 0,
            status: 'due'
        };
    }

    if (rhythm.status === 'ahead') {
        return {
            label: `Vas adelantado. Tu próximo aporte vence en ${futureTimeStr}`,
            totalSeconds,
            status: 'on_track'
        };
    }

    return {
        label: `Tu próximo aporte vence en ${futureTimeStr}`,
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
    const targetAmountValue = Number(goal.target_amount || 0);
    if (!Number.isFinite(targetAmountValue) || targetAmountValue <= 0) {
        return { status: 'no_target', label: 'Sin objetivo', emoji: '—', color: '#6B7280', bg: '#F3F4F6' };
    }

    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0)
        : Number(goal.total_saved || 0);

    if (totalSaved >= targetAmountValue) {
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
 * Estas son por meta individual y se mantienen para pantallas que aún dependen de esa lógica.
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

    // 5. Hitos de progreso por meta individual (se mantienen)
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

/**
 * Retorna insignias globales del perfil, calculadas con el historial completo.
 * Conserva aparte la lógica de hitos por meta individual.
 * @param {Array} goals
 * @param {Array} transactions
 * @returns {Array<{ id: string, label: string, icon: string, description: string }>}
 */
export function getProfileAchievements(goals, transactions) {
    const safeGoals = Array.isArray(goals) ? goals : [];
    const safeTransactions = Array.isArray(transactions) ? transactions : [];

    if (safeTransactions.length === 0) return [];

    const achieved = [];

    // 1. Primer aporte global del perfil
    achieved.push({
        id: 'first_goal',
        label: 'Ahorrador Novato',
        icon: 'badge_first_goal.png',
        description: '¡Primer paso dado! Bienvenido a la disciplina.'
    });

    // 2. Sprint global: 2 o más aportes el mismo día, sin importar la meta
    const txCountByDay = safeTransactions.reduce((acc, tx) => {
        const dayKey = new Date(tx.created_at).toDateString();
        acc[dayKey] = (acc[dayKey] || 0) + 1;
        return acc;
    }, {});

    const hasSprint = Object.values(txCountByDay).some(count => count >= 2);
    if (hasSprint) {
        achieved.push({
            id: 'saving_sprint',
            label: 'Sprint de Ahorro',
            icon: 'badge_saving_sprint.png',
            description: 'Dos aportes en un solo día. ¡Qué energía!'
        });
    }

    // 3. Racha global del perfil
    const streak = getStreakMonths(safeTransactions);
    if (streak >= 3) {
        achieved.push({
            id: 'iron_streak',
            label: 'Disciplina de Hierro',
            icon: 'badge_iron_streak.png',
            description: '3 meses consecutivos ahorrando sin falta.'
        });
    }

    // 4. Capitán del presupuesto: si en alguna meta con objetivo dio un aporte >= 1.5x cuota
    const goalsById = safeGoals.reduce((acc, goal) => {
        acc[goal.id] = goal;
        return acc;
    }, {});

    const hasExtra = safeTransactions.some(tx => {
        const goal = goalsById[tx.goal_id];
        if (!goal) return false;

        const quota = getSuggestedQuota(goal);
        if (!quota || quota <= 0) return false;

        return Number(tx.amount) >= quota * 1.5;
    });

    if (hasExtra) {
        achieved.push({
            id: 'budget_captain',
            label: 'Capitán del Presupuesto',
            icon: 'badge_budget_captain.png',
            description: 'Diste más de lo esperado. ¡Mente de tiburón!'
        });
    }

    // 5. Progreso global del perfil basado en metas completadas
    // Se excluyen metas sin target_amount válido.
    const totalCompletableGoals = safeGoals.filter(goal => Number(goal.target_amount || 0) > 0);

    const completedGoals = totalCompletableGoals.filter(goal => {
        const goalTxs = safeTransactions.filter(tx => tx.goal_id === goal.id);
        const totalSaved = goalTxs.reduce((sum, tx) => sum + (Number(tx.amount) || 0), 0);
        return totalSaved >= Number(goal.target_amount || 0);
    });

    const completedCount = completedGoals.length;
    const totalCount = totalCompletableGoals.length;
    const globalProgress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

    if (globalProgress >= 25) {
        achieved.push({
            id: 'savings_takeoff',
            label: 'Despegue',
            icon: 'badge_savings_takeoff.png',
            description: 'Has completado al menos el 25% de tus metas con objetivo.'
        });
    }
    if (globalProgress >= 50) {
        achieved.push({
            id: 'vault_premium',
            label: 'Bóveda Premium',
            icon: 'badge_vault_premium.png',
            description: 'Has completado al menos la mitad de tus metas con objetivo.'
        });
    }
    if (globalProgress >= 75) {
        achieved.push({
            id: 'steady_harvest',
            label: 'Cosecha Constante',
            icon: 'badge_steady_harvest.png',
            description: 'Has completado al menos el 75% de tus metas con objetivo.'
        });
    }
    if (globalProgress >= 100 && totalCount > 0) {
        achieved.push({
            id: 'grand_cup',
            label: 'Copa Gran Progreso',
            icon: 'badge_grand_progress_cup.png',
            description: 'Has completado todas tus metas con objetivo. Eres un maestro del ahorro.'
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
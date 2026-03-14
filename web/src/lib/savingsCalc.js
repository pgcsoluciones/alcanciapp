/**
 * Retorna el total de PigCoins acumulados.
 * 1 PigCoin = 1 Cuota sugerida completa.
 * @param {Object} goal
 * @param {Array} transactions
 * @returns {number}
 */
export function getPigCoins(goal, transactions) {
    const quota = getSuggestedQuota(goal);
    if (!quota || quota <= 0) return 0;
    const totalSaved = (transactions && transactions.length > 0)
        ? transactions.reduce((sum, tx) => sum + Number(tx.amount), 0)
        : Number(goal.total_saved || 0);
    return Number((totalSaved / quota).toFixed(2));
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
 * Calcula el tiempo restante para el próximo aporte esperado.
 * @param {Object} goal
 * @param {Array} transactions
 * @param {Date} [currentNow] - Opcional, fecha actual
 * @returns {{ days: number, hours: number, minutes: number, totalSeconds: number }}
 */
export function getCountdown(goal, transactions, currentNow) {
    if (!goal.created_at) return { days: 0, hours: 0, minutes: 0, totalSeconds: 0 };

    // Base: Último aporte o fecha de creación
    let lastAporteDate = new Date(goal.created_at);
    if (transactions && Array.isArray(transactions) && transactions.length > 0) {
        const sorted = [...transactions].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        lastAporteDate = new Date(sorted[0].created_at);
    }

    const freq = (goal.frequency || 'Mensual').toLowerCase();
    let intervalDays = 30;
    if (freq.includes('semanal')) intervalDays = 7;
    if (freq.includes('quincenal')) intervalDays = 15;
    if (freq.includes('diario')) intervalDays = 1;

    const nextAporteDate = new Date(lastAporteDate.getTime() + intervalDays * 24 * 60 * 60 * 1000);
    const now = currentNow || new Date();
    const diffMs = nextAporteDate - now;

    if (diffMs <= 0) return { days: 0, hours: 0, minutes: 0, totalSeconds: 0 };

    const totalSeconds = Math.floor(diffMs / 1000);
    const days = Math.floor(totalSeconds / (24 * 3600));
    const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);

    return { days, hours, minutes, totalSeconds };
}

// ─── Estado del Ritmo ──────────────────────────────────────────────────────

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

    if (totalSaved === 0) {
        return { status: 'not_started', label: 'Sin iniciar', emoji: '🏁', color: '#6B7280', bg: '#F3F4F6' };
    }

    const pigCoins = getPigCoins(goal, transactions);
    const elapsed = getPeriodsElapsed(goal);

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
        const missing = fmtRD(prog.remainingRD);
        return `⚠️ Estás un poco atrás. Con ${missing} completas tu próximo PigCoin y te pones al día.`;
    }

    if (status.status === 'ahead') {
        return '🚀 ¡Vas volando! Estás por delante de tu plan de ahorro.';
    }

    if (prog.current > 0) {
        const missing = fmtRD(prog.remainingRD);
        return `Llevas ${fmtPigCoin(prog.current)} acumulados. ¡Solo faltan ${missing} para otro 🐷!`;
    }

    return 'Tu disciplina financiera rinde frutos. ¡Haz tu primer aporte!';
}

// ─── Helpers de formato ────────────────────────────────────────────────────

// ─── Helpers de cálculo y etiquetas ──────────────────────────────────────

/**
 * Calcula la cuota sugerida (monto total / meses en la frecuencia elegida).
 */
export function getSuggestedQuota(goal) {
    if (!goal.target_amount || !goal.duration_months) return 0;
    const freq = (goal.frequency || 'Mensual').toLowerCase();
    let divisor = goal.duration_months;
    if (freq.includes('quincenal')) divisor *= 2;
    if (freq.includes('semanal')) divisor *= 4.34;
    if (freq.includes('diario')) divisor *= 30.42;

    return Number((goal.target_amount / divisor).toFixed(2));
}

/**
 * Retorna la etiqueta amigable de la frecuencia.
 */
export function getFreqLabel(freq) {
    const f = (freq || 'Mensual').toLowerCase();
    if (f === 'diario') return 'día';
    if (f === 'semanal') return 'semana';
    if (f === 'quincenal') return 'quincena';
    return 'mes';
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

export function fmtRD(amount) {
    return `RD$ ${Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
}

export function fmtPigCoin(amount) {
    return `${Number(amount || 0).toFixed(2)} 🐷`;
}

function safeParseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function getFrequencyDays(frequency) {
  const raw = String(frequency || '').toLowerCase().trim();

  if (raw.includes('diar')) return 1;
  if (raw.includes('seman')) return 7;
  if (raw.includes('quinc')) return 15;
  if (raw.includes('mens')) return 30;

  return 30;
}

function diffDays(dateA, dateB) {
  const a = new Date(dateA).getTime();
  const b = new Date(dateB).getTime();
  const ms = Math.abs(b - a);
  return ms / (1000 * 60 * 60 * 24);
}

function analyzeCadence(transactions, frequency) {
  const sorted = [...(transactions || [])].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );

  const expectedDays = getFrequencyDays(frequency);
  const onTimeLimit = expectedDays * 1.35;

  let onTimeStreak = 0;
  let maxOnTimeStreak = 0;
  let hadLateGap = false;
  let recoveryStreakAfterLate = 0;
  let recovered = false;

  if (sorted.length <= 1) {
    return {
      totalCount: sorted.length,
      expectedDays,
      onTimeLimit,
      onTimeStreak: sorted.length > 0 ? 1 : 0,
      maxOnTimeStreak: sorted.length > 0 ? 1 : 0,
      hadLateGap,
      recovered
    };
  }

  onTimeStreak = 1;
  maxOnTimeStreak = 1;

  for (let i = 1; i < sorted.length; i++) {
    const previous = sorted[i - 1];
    const current = sorted[i];
    const gapDays = diffDays(previous.created_at, current.created_at);
    const isOnTime = gapDays <= onTimeLimit;

    if (isOnTime) {
      onTimeStreak += 1;
      maxOnTimeStreak = Math.max(maxOnTimeStreak, onTimeStreak);

      if (hadLateGap) {
        recoveryStreakAfterLate += 1;
        if (recoveryStreakAfterLate >= 2) {
          recovered = true;
        }
      }
    } else {
      hadLateGap = true;
      onTimeStreak = 1;
      recoveryStreakAfterLate = 0;
      maxOnTimeStreak = Math.max(maxOnTimeStreak, onTimeStreak);
    }
  }

  return {
    totalCount: sorted.length,
    expectedDays,
    onTimeLimit,
    onTimeStreak,
    maxOnTimeStreak,
    hadLateGap,
    recovered
  };
}

async function hasUserBadge(env, { userId, badgeCode, goalId = null }) {
  const row = await env.DB.prepare(`
    SELECT id
    FROM user_badges
    WHERE user_id = ?
      AND badge_code = ?
      AND (
        (? IS NULL AND goal_id IS NULL)
        OR goal_id = ?
      )
    LIMIT 1
  `).bind(userId, badgeCode, goalId, goalId).first();

  return !!row;
}

async function awardBadge(env, { userId, badgeCode, goalId = null, payload = {} }) {
  const alreadyAwarded = await hasUserBadge(env, { userId, badgeCode, goalId });
  if (alreadyAwarded) return null;

  const badgeId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO user_badges (id, user_id, badge_code, goal_id, meta_json)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    badgeId,
    userId,
    badgeCode,
    goalId,
    JSON.stringify(payload || {})
  ).run();

  const badge = await env.DB.prepare(`
    SELECT
      ub.id,
      ub.user_id,
      ub.badge_code,
      ub.goal_id,
      ub.unlocked_at,
      ub.meta_json,
      bc.code,
      bc.name,
      bc.description,
      bc.icon,
      bc.category,
      bc.is_repeatable
    FROM user_badges ub
    JOIN badges_catalog bc ON bc.code = ub.badge_code
    WHERE ub.id = ?
    LIMIT 1
  `).bind(badgeId).first();

  return {
    ...badge,
    payload: safeParseJson(badge?.meta_json, {})
  };
}

async function getGoalProgressData(env, { userId, goalId }) {
  const goal = await env.DB.prepare(`
    SELECT id, user_id, name, target_amount, duration_months, frequency, archived_at
    FROM goals
    WHERE id = ? AND user_id = ?
    LIMIT 1
  `).bind(goalId, userId).first();

  if (!goal) return null;

  const txAgg = await env.DB.prepare(`
    SELECT
      COUNT(*) AS tx_count,
      COALESCE(SUM(amount), 0) AS total_saved,
      MAX(created_at) AS last_tx_at
    FROM goal_transactions
    WHERE user_id = ? AND goal_id = ?
  `).bind(userId, goalId).first();

  const { results: txRows = [] } = await env.DB.prepare(`
    SELECT id, amount, created_at
    FROM goal_transactions
    WHERE user_id = ? AND goal_id = ?
    ORDER BY created_at ASC
  `).bind(userId, goalId).all();

  const totalSaved = Number(txAgg?.total_saved || 0);
  const txCount = Number(txAgg?.tx_count || 0);
  const targetAmount = Number(goal?.target_amount || 0);
  const progress = targetAmount > 0 ? (totalSaved / targetAmount) * 100 : 0;
  const cadence = analyzeCadence(txRows, goal?.frequency);

  return {
    goal,
    txRows,
    totalSaved,
    txCount,
    targetAmount,
    progress,
    cadence
  };
}

export async function evaluateBadgesForContribution(env, { userId, goalId, amount }) {
  const unlocked = [];

  const totalTxRow = await env.DB.prepare(`
    SELECT COUNT(*) AS total_count
    FROM goal_transactions
    WHERE user_id = ?
  `).bind(userId).first();

  const totalCount = Number(totalTxRow?.total_count || 0);

  if (totalCount === 1) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'first_contribution',
      payload: { amount, scope: 'global' }
    });
    if (badge) unlocked.push(badge);
  }

  const progressData = await getGoalProgressData(env, { userId, goalId });
  if (!progressData) return unlocked;

  const { progress, targetAmount, totalSaved, cadence, goal } = progressData;

  if (amount >= 0 && targetAmount > 0) {
    const estimatedQuota = targetAmount / Math.max(Number(goal?.duration_months || 1), 1);
    if (estimatedQuota > 0 && Number(amount) >= estimatedQuota * 2) {
      const badge = await awardBadge(env, {
        userId,
        badgeCode: 'double_quota',
        goalId,
        payload: { amount, estimatedQuota, totalSaved, targetAmount }
      });
      if (badge) unlocked.push(badge);
    }
  }

  if (targetAmount > 0 && progress >= 25) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'hitos_25',
      goalId,
      payload: { progress, totalSaved, targetAmount }
    });
    if (badge) unlocked.push(badge);
  }

  if (targetAmount > 0 && progress >= 50) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'hitos_50',
      goalId,
      payload: { progress, totalSaved, targetAmount }
    });
    if (badge) unlocked.push(badge);
  }

  if (targetAmount > 0 && progress >= 75) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'hitos_75',
      goalId,
      payload: { progress, totalSaved, targetAmount }
    });
    if (badge) unlocked.push(badge);
  }

  if (targetAmount > 0 && totalSaved >= targetAmount) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'goal_completed',
      goalId,
      payload: { progress, totalSaved, targetAmount }
    });
    if (badge) unlocked.push(badge);
  }

  if (cadence.totalCount >= 3) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'constancy_3',
      goalId,
      payload: { totalCount: cadence.totalCount, frequency: goal?.frequency }
    });
    if (badge) unlocked.push(badge);
  }

  if (cadence.totalCount >= 7) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'constancy_7',
      goalId,
      payload: { totalCount: cadence.totalCount, frequency: goal?.frequency }
    });
    if (badge) unlocked.push(badge);
  }

  if (cadence.maxOnTimeStreak >= 5) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'punctual_5',
      goalId,
      payload: {
        maxOnTimeStreak: cadence.maxOnTimeStreak,
        expectedDays: cadence.expectedDays,
        onTimeLimit: cadence.onTimeLimit
      }
    });
    if (badge) unlocked.push(badge);
  }

  if (cadence.maxOnTimeStreak >= 10) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'racha_10',
      goalId,
      payload: {
        maxOnTimeStreak: cadence.maxOnTimeStreak,
        expectedDays: cadence.expectedDays,
        onTimeLimit: cadence.onTimeLimit
      }
    });
    if (badge) unlocked.push(badge);
  }

  if (cadence.hadLateGap && cadence.recovered) {
    const badge = await awardBadge(env, {
      userId,
      badgeCode: 'recovery',
      goalId,
      payload: {
        recovered: true,
        expectedDays: cadence.expectedDays,
        onTimeLimit: cadence.onTimeLimit
      }
    });
    if (badge) unlocked.push(badge);
  }

  return unlocked;
}

export async function listUserBadges(env, { userId }) {
  const { results = [] } = await env.DB.prepare(`
    SELECT
      ub.id,
      ub.user_id,
      ub.badge_code,
      ub.goal_id,
      ub.unlocked_at,
      ub.meta_json,
      bc.code,
      bc.name,
      bc.description,
      bc.icon,
      bc.category,
      bc.is_repeatable
    FROM user_badges ub
    JOIN badges_catalog bc ON bc.code = ub.badge_code
    WHERE ub.user_id = ?
    ORDER BY ub.unlocked_at DESC, bc.name ASC
  `).bind(userId).all();

  return results.map(row => ({
    ...row,
    payload: safeParseJson(row.meta_json, {})
  }));
}

export async function listBadgesCatalog(env) {
  const { results = [] } = await env.DB.prepare(`
    SELECT code, name, description, icon, category, is_repeatable
    FROM badges_catalog
    ORDER BY name ASC
  `).all();

  return results;
}

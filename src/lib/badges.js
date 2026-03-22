function safeParseJson(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
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

  const totalSaved = Number(txAgg?.total_saved || 0);
  const txCount = Number(txAgg?.tx_count || 0);
  const targetAmount = Number(goal?.target_amount || 0);
  const progress = targetAmount > 0 ? (totalSaved / targetAmount) * 100 : 0;

  return {
    goal,
    totalSaved,
    txCount,
    targetAmount,
    progress
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

  const { progress, targetAmount, totalSaved } = progressData;

  if (amount >= 0 && targetAmount > 0) {
    const estimatedQuota = targetAmount / Math.max(Number(progressData.goal?.duration_months || 1), 1);
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

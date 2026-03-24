import { authenticateAdmin, adminJson, writeAdminAudit } from '../lib/admin.js';

function pickSettings(rows) {
  const out = {};
  for (const row of rows || []) {
    try {
      out[row.key] = JSON.parse(row.value_json);
    } catch {
      out[row.key] = row.value_json;
    }
  }
  return out;
}

async function handleHealth() {
  return adminJson({
    ok: true,
    scope: 'superadmin',
    version: 'v1-foundation',
  });
}

async function handleSettings(request, env) {
  const adminCheck = await authenticateAdmin(request, env);
  if (!adminCheck.ok) return adminCheck.response;

  const rows = await env.DB.prepare(`
    SELECT key, value_json
    FROM system_settings
    WHERE key IN (
      'registration_mode',
      'plans_page',
      'premium_cta',
      'ads_mode',
      'sponsored_mode',
      'payments_mode',
      'purchase_code_mode',
      'new_user_alerts'
    )
    ORDER BY key
  `).all();

  await writeAdminAudit(env, {
    adminUserId: adminCheck.admin.id,
    action: 'superadmin.settings.view',
    entityType: 'system_settings',
    details: { keysReturned: rows?.results?.map(r => r.key) || [] },
  });

  return adminJson({
    ok: true,
    admin: {
      id: adminCheck.admin.id,
      role: adminCheck.admin.role,
    },
    settings: pickSettings(rows?.results || []),
  });
}

async function handleMetricsOverview(request, env) {
  const adminCheck = await authenticateAdmin(request, env);
  if (!adminCheck.ok) return adminCheck.response;

  const [
    usersTotal,
    adminsTotal,
    activeGoals,
    archivedGoals,
    purchaseCodes,
    activeSubscriptions,
  ] = await Promise.all([
    env.DB.prepare(`SELECT COUNT(*) as total FROM users`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM admin_users WHERE status = 'active'`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM goals WHERE archived_at IS NULL`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM goals WHERE archived_at IS NOT NULL`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM purchase_codes`).first(),
    env.DB.prepare(`SELECT COUNT(*) as total FROM subscriptions WHERE status = 'active'`).first(),
  ]);

  const latestUsers = await env.DB.prepare(`
    SELECT
      id,
      name,
      email,
      created_at,
      current_plan_code,
      registration_country_code,
      registration_device_type
    FROM users
    ORDER BY created_at DESC
    LIMIT 5
  `).all();

  await writeAdminAudit(env, {
    adminUserId: adminCheck.admin.id,
    action: 'superadmin.metrics.overview.view',
    entityType: 'dashboard',
    details: { section: 'overview' },
  });

  return adminJson({
    ok: true,
    admin: {
      id: adminCheck.admin.id,
      role: adminCheck.admin.role,
    },
    metrics: {
      users_total: Number(usersTotal?.total || 0),
      admins_total: Number(adminsTotal?.total || 0),
      goals_active_total: Number(activeGoals?.total || 0),
      goals_archived_total: Number(archivedGoals?.total || 0),
      purchase_codes_total: Number(purchaseCodes?.total || 0),
      subscriptions_active_total: Number(activeSubscriptions?.total || 0),
    },
    latest_users: (latestUsers?.results || []).map((u) => ({
      ...u,
      email_masked: u.email
        ? u.email.replace(/^(.{2}).*(@.*)$/, '$1***$2')
        : null,
    })),
  });
}

export async function handleSuperAdmin(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method;

  if (path === '/api/v1/superadmin/health' && method === 'GET') {
    return handleHealth();
  }

  if (path === '/api/v1/superadmin/settings' && method === 'GET') {
    return handleSettings(request, env);
  }

  if (path === '/api/v1/superadmin/metrics/overview' && method === 'GET') {
    return handleMetricsOverview(request, env);
  }

  return adminJson({ error: 'SuperAdmin route not found' }, 404);
}

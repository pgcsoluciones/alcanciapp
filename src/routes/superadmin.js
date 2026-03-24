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

async function readJsonBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

async function handleHealth(request, env) {
  return adminJson(request, env, {
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

  return adminJson(request, env, {
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

  return adminJson(request, env, {
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

async function handleAdminUsersList(request, env) {
  const adminCheck = await authenticateAdmin(request, env, ['super_admin', 'admin_support', 'admin_analyst', 'admin_viewer']);
  if (!adminCheck.ok) return adminCheck.response;

  const rows = await env.DB.prepare(`
    SELECT
      au.id,
      au.user_id,
      au.role,
      au.status,
      au.created_at,
      au.updated_at,
      u.name,
      u.email,
      u.current_plan_code
    FROM admin_users au
    LEFT JOIN users u ON u.id = au.user_id
    ORDER BY
      CASE au.role
        WHEN 'super_admin' THEN 1
        WHEN 'admin_support' THEN 2
        WHEN 'admin_analyst' THEN 3
        WHEN 'admin_viewer' THEN 4
        ELSE 9
      END,
      au.created_at DESC
  `).all();

  await writeAdminAudit(env, {
    adminUserId: adminCheck.admin.id,
    action: 'superadmin.admin_users.list',
    entityType: 'admin_users',
    details: { count: rows?.results?.length || 0 },
  });

  return adminJson(request, env, {
    ok: true,
    items: (rows?.results || []).map((row) => ({
      ...row,
      email_masked: row.email
        ? row.email.replace(/^(.{2}).*(@.*)$/, '$1***$2')
        : null,
    })),
  });
}

async function handleAdminUsersCreate(request, env) {
  const adminCheck = await authenticateAdmin(request, env, ['super_admin']);
  if (!adminCheck.ok) return adminCheck.response;

  const body = await readJsonBody(request);
  const userId = body?.user_id?.trim?.();
  const role = body?.role?.trim?.();
  const status = body?.status?.trim?.() || 'active';

  const allowedRoles = ['super_admin', 'admin_support', 'admin_analyst', 'admin_viewer'];
  const allowedStatuses = ['active', 'inactive'];

  if (!userId) {
    return adminJson(request, env, { error: 'user_id is required' }, 400);
  }

  if (!allowedRoles.includes(role)) {
    return adminJson(request, env, { error: 'Invalid role' }, 400);
  }

  if (!allowedStatuses.includes(status)) {
    return adminJson(request, env, { error: 'Invalid status' }, 400);
  }

  const user = await env.DB.prepare(`
    SELECT id, name, email
    FROM users
    WHERE id = ?
    LIMIT 1
  `).bind(userId).first();

  if (!user) {
    return adminJson(request, env, { error: 'User not found' }, 404);
  }

  const existing = await env.DB.prepare(`
    SELECT id, user_id, role, status
    FROM admin_users
    WHERE user_id = ?
    LIMIT 1
  `).bind(userId).first();

  if (existing) {
    return adminJson(request, env, { error: 'This user is already an admin' }, 409);
  }

  const adminUserId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO admin_users (
      id, user_id, role, status
    ) VALUES (?, ?, ?, ?)
  `).bind(
    adminUserId,
    userId,
    role,
    status
  ).run();

  await writeAdminAudit(env, {
    adminUserId: adminCheck.admin.id,
    action: 'superadmin.admin_users.create',
    entityType: 'admin_users',
    entityId: adminUserId,
    details: {
      created_admin_user_id: adminUserId,
      target_user_id: userId,
      role,
      status,
    },
  });

  return adminJson(request, env, {
    ok: true,
    message: 'Admin created successfully',
    item: {
      id: adminUserId,
      user_id: userId,
      role,
      status,
      name: user.name || null,
      email_masked: user.email
        ? user.email.replace(/^(.{2}).*(@.*)$/, '$1***$2')
        : null,
    },
  }, 201);
}

export async function handleSuperAdmin(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method;

  if (path === '/api/v1/superadmin/health' && method === 'GET') {
    return handleHealth(request, env);
  }

  if (path === '/api/v1/superadmin/settings' && method === 'GET') {
    return handleSettings(request, env);
  }

  if (path === '/api/v1/superadmin/metrics/overview' && method === 'GET') {
    return handleMetricsOverview(request, env);
  }

  if (path === '/api/v1/superadmin/admin-users' && method === 'GET') {
    return handleAdminUsersList(request, env);
  }

  if (path === '/api/v1/superadmin/admin-users' && method === 'POST') {
    return handleAdminUsersCreate(request, env);
  }

  return adminJson(request, env, { error: 'SuperAdmin route not found' }, 404);
}
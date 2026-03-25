import { authenticateAdmin, adminJson, writeAdminAudit } from '../lib/admin.js';
import { getCorsHeaders } from '../lib/cors.js';

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

function randomCodeSegment(length = 8) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[bytes[i] % alphabet.length];
  }
  return out;
}

function escapeCsv(value) {
  const str = String(value ?? '');
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function sanitizeFilename(value) {
  return String(value || 'lote')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

async function generateUniquePurchaseCode(env, codePrefix) {
  for (let attempt = 0; attempt < 15; attempt += 1) {
    const candidate = `${codePrefix}-${randomCodeSegment(8)}`;
    const existing = await env.DB
      .prepare(`SELECT id FROM purchase_codes WHERE code = ? LIMIT 1`)
      .bind(candidate)
      .first();

    if (!existing) {
      return candidate;
    }
  }

  throw new Error('Unable to generate a unique purchase code');
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

async function getPurchaseCodeMode(env) {
  const row = await env.DB
    .prepare(`SELECT value_json, updated_at FROM system_settings WHERE key = ? LIMIT 1`)
    .bind('purchase_code_mode')
    .first();

  let parsed = {
    enabled: false,
    required_for_registration: false,
    mode: 'disabled',
  };

  if (row?.value_json) {
    try {
      parsed = JSON.parse(row.value_json);
    } catch (_) {}
  }

  const allowedModes = new Set(['disabled', 'optional', 'required']);
  const mode = allowedModes.has(parsed?.mode) ? parsed.mode : 'disabled';

  return {
    key: 'purchase_code_mode',
    value: {
      enabled: mode !== 'disabled',
      required_for_registration: mode === 'required',
      mode,
    },
    updated_at: row?.updated_at || null,
  };
}

async function handlePurchaseCodeModeGet(request, env) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  const setting = await getPurchaseCodeMode(env);

  return adminJson(request, env, {
    ok: true,
    item: setting,
  });
}

async function handlePurchaseCodeModePut(request, env) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);
  const inputMode = String(body?.mode || '').trim().toLowerCase();
  const reason = body?.reason ? String(body.reason).trim().slice(0, 300) : null;

  if (!['disabled', 'optional', 'required'].includes(inputMode)) {
    return adminJson(request, env, {
      error: 'Invalid mode. Allowed values: disabled, optional, required',
    }, 400);
  }

  const previous = await getPurchaseCodeMode(env);

  const nextValue = {
    enabled: inputMode !== 'disabled',
    required_for_registration: inputMode === 'required',
    mode: inputMode,
  };

  await env.DB
    .prepare(`
      INSERT INTO system_settings (key, value_json, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(key) DO UPDATE SET
        value_json = excluded.value_json,
        updated_at = CURRENT_TIMESTAMP
    `)
    .bind('purchase_code_mode', JSON.stringify(nextValue))
    .run();

  await writeAdminAudit(env, {
    adminUserId: auth.admin.id,
    action: 'purchase_code_mode_updated',
    entityType: 'system_setting',
    entityId: 'purchase_code_mode',
    reason,
    details: {
      previous: previous?.value || null,
      next: nextValue,
    },
  });

  return adminJson(request, env, {
    ok: true,
    message: 'Purchase code mode updated successfully',
    item: {
      key: 'purchase_code_mode',
      value: nextValue,
    },
  });
}

async function handlePurchaseCodeBatchesList(request, env) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || '').trim().toLowerCase();
  const limitRaw = Number(url.searchParams.get('limit') || 20);
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  let sql = `
    SELECT
      b.id,
      b.batch_name,
      b.code_prefix,
      b.quantity,
      b.status,
      b.export_enabled,
      b.last_exported_at,
      b.notes,
      b.created_by_admin_id,
      b.created_at,
      COUNT(c.id) AS codes_total,
      SUM(CASE WHEN c.status = 'available' THEN 1 ELSE 0 END) AS available_total,
      SUM(CASE WHEN c.status = 'assigned' THEN 1 ELSE 0 END) AS assigned_total,
      SUM(CASE WHEN c.status = 'used' THEN 1 ELSE 0 END) AS used_total,
      SUM(CASE WHEN c.status = 'disabled' THEN 1 ELSE 0 END) AS disabled_total,
      SUM(CASE WHEN c.status = 'expired' THEN 1 ELSE 0 END) AS expired_total
    FROM purchase_code_batches b
    LEFT JOIN purchase_codes c ON c.batch_id = b.id
  `;

  const binds = [];

  if (status && ['draft', 'active', 'inactive', 'closed'].includes(status)) {
    sql += ` WHERE b.status = ? `;
    binds.push(status);
  }

  sql += `
    GROUP BY
      b.id, b.batch_name, b.code_prefix, b.quantity, b.status,
      b.export_enabled, b.last_exported_at, b.notes, b.created_by_admin_id, b.created_at
    ORDER BY b.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);

  const result = await env.DB.prepare(sql).bind(...binds).all();
  const items = Array.isArray(result?.results) ? result.results : [];

  return adminJson(request, env, {
    ok: true,
    items,
    meta: {
      limit,
      count: items.length,
      status: status || null,
    },
  });
}

async function handlePurchaseCodeBatchCreate(request, env) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  const body = await readJsonBody(request);

  const batchName = String(body?.batch_name || '').trim();
  const codePrefix = String(body?.code_prefix || '').trim().toUpperCase();
  const quantity = Number(body?.quantity || 0);
  const exportEnabled = Boolean(body?.export_enabled);
  const notes = body?.notes ? String(body.notes).trim().slice(0, 1000) : null;

  if (!batchName) {
    return adminJson(request, env, { error: 'batch_name is required' }, 400);
  }

  if (!codePrefix || !/^[A-Z0-9]{2,12}$/.test(codePrefix)) {
    return adminJson(request, env, {
      error: 'code_prefix must be 2-12 characters using only A-Z and 0-9',
    }, 400);
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 500) {
    return adminJson(request, env, {
      error: 'quantity must be an integer between 1 and 500',
    }, 400);
  }

  const batchId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO purchase_code_batches (
      id,
      batch_name,
      code_prefix,
      quantity,
      status,
      export_enabled,
      notes,
      created_by_admin_id,
      created_at
    ) VALUES (?, ?, ?, ?, 'active', ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(
    batchId,
    batchName,
    codePrefix,
    quantity,
    exportEnabled ? 1 : 0,
    notes,
    auth.admin.id
  ).run();

  await writeAdminAudit(env, {
    adminUserId: auth.admin.id,
    action: 'purchase_code_batch_created',
    entityType: 'purchase_code_batch',
    entityId: batchId,
    reason: 'Initial batch creation from Super Admin',
    details: {
      batch_name: batchName,
      code_prefix: codePrefix,
      quantity,
      export_enabled: exportEnabled,
    },
  });

  return adminJson(request, env, {
    ok: true,
    message: 'Purchase code batch created successfully',
    item: {
      id: batchId,
      batch_name: batchName,
      code_prefix: codePrefix,
      quantity,
      status: 'active',
      export_enabled: exportEnabled,
      notes,
      created_by_admin_id: auth.admin.id,
    },
  }, 201);
}

async function handlePurchaseCodeBatchGenerate(request, env, batchId) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  if (!batchId) {
    return adminJson(request, env, { error: 'batch_id is required' }, 400);
  }

  const batch = await env.DB.prepare(`
    SELECT
      id,
      batch_name,
      code_prefix,
      quantity,
      status,
      created_by_admin_id,
      created_at
    FROM purchase_code_batches
    WHERE id = ?
    LIMIT 1
  `).bind(batchId).first();

  if (!batch) {
    return adminJson(request, env, { error: 'Batch not found' }, 404);
  }

  const existingCodes = await env.DB.prepare(`
    SELECT COUNT(*) as total
    FROM purchase_codes
    WHERE batch_id = ?
  `).bind(batchId).first();

  const existingTotal = Number(existingCodes?.total || 0);

  if (existingTotal > 0) {
    return adminJson(request, env, {
      error: 'Codes have already been generated for this batch',
      meta: {
        batch_id: batchId,
        existing_codes_total: existingTotal,
      },
    }, 409);
  }

  const createdCodes = [];

  for (let i = 0; i < Number(batch.quantity || 0); i += 1) {
    const codeId = crypto.randomUUID();
    const codeValue = await generateUniquePurchaseCode(env, batch.code_prefix);

    await env.DB.prepare(`
      INSERT INTO purchase_codes (
        id,
        batch_id,
        code,
        status,
        metadata_json,
        created_at
      ) VALUES (?, ?, ?, 'available', ?, CURRENT_TIMESTAMP)
    `).bind(
      codeId,
      batchId,
      codeValue,
      JSON.stringify({
        batch_name: batch.batch_name,
        code_prefix: batch.code_prefix,
        generated_by_admin_id: auth.admin.id,
        generated_at: new Date().toISOString(),
      })
    ).run();

    createdCodes.push(codeValue);
  }

  await writeAdminAudit(env, {
    adminUserId: auth.admin.id,
    action: 'purchase_code_batch_generated',
    entityType: 'purchase_code_batch',
    entityId: batchId,
    details: {
      batch_name: batch.batch_name,
      code_prefix: batch.code_prefix,
      requested_quantity: Number(batch.quantity || 0),
      generated_total: createdCodes.length,
    },
  });

  return adminJson(request, env, {
    ok: true,
    message: 'Purchase codes generated successfully',
    item: {
      batch_id: batchId,
      batch_name: batch.batch_name,
      code_prefix: batch.code_prefix,
      generated_total: createdCodes.length,
      sample_codes: createdCodes.slice(0, 5),
    },
  }, 201);
}

async function handlePurchaseCodeBatchExport(request, env, batchId) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  if (!batchId) {
    return adminJson(request, env, { error: 'batch_id is required' }, 400);
  }

  const batch = await env.DB.prepare(`
    SELECT
      id,
      batch_name,
      code_prefix,
      export_enabled,
      created_at
    FROM purchase_code_batches
    WHERE id = ?
    LIMIT 1
  `).bind(batchId).first();

  if (!batch) {
    return adminJson(request, env, { error: 'Batch not found' }, 404);
  }

  if (Number(batch.export_enabled || 0) !== 1) {
    return adminJson(request, env, { error: 'Export is disabled for this batch' }, 403);
  }

  const result = await env.DB.prepare(`
    SELECT
      c.code,
      c.status,
      au.email AS assigned_user_email,
      uu.email AS used_by_user_email,
      c.used_at,
      c.created_at
    FROM purchase_codes c
    LEFT JOIN users au ON au.id = c.assigned_user_id
    LEFT JOIN users uu ON uu.id = c.used_by_user_id
    WHERE c.batch_id = ?
    ORDER BY c.created_at DESC, c.code ASC
  `).bind(batchId).all();

  const items = Array.isArray(result?.results) ? result.results : [];

  const lines = [
    [
      'codigo',
      'estado',
      'correo_asignado',
      'correo_vinculado',
      'usado_el',
      'creado_el',
    ].join(','),
    ...items.map((item) =>
      [
        escapeCsv(item.code),
        escapeCsv(item.status),
        escapeCsv(item.assigned_user_email || ''),
        escapeCsv(item.used_by_user_email || ''),
        escapeCsv(item.used_at || ''),
        escapeCsv(item.created_at || ''),
      ].join(',')
    ),
  ];

  await env.DB.prepare(`
    UPDATE purchase_code_batches
    SET last_exported_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(batchId).run();

  await writeAdminAudit(env, {
    adminUserId: auth.admin.id,
    action: 'purchase_code_batch_exported',
    entityType: 'purchase_code_batch',
    entityId: batchId,
    details: {
      batch_name: batch.batch_name,
      exported_total: items.length,
    },
  });

  const corsHeaders = getCorsHeaders(request, env);
  const filename = `${sanitizeFilename(batch.batch_name || batch.code_prefix || 'codigos')}-codigos.csv`;

  return new Response(lines.join('\n'), {
    status: 200,
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}

async function handlePurchaseCodesList(request, env) {
  const auth = await authenticateAdmin(request, env);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const status = (url.searchParams.get('status') || '').trim().toLowerCase();
  const batchId = (url.searchParams.get('batch_id') || '').trim();
  const q = (url.searchParams.get('q') || '').trim().toUpperCase();
  const limitRaw = Number(url.searchParams.get('limit') || 50);
  const limit = Math.min(Math.max(limitRaw, 1), 100);

  let sql = `
    SELECT
      c.id,
      c.batch_id,
      b.batch_name,
      b.code_prefix,
      c.code,
      c.status,
      c.assigned_user_id,
      au.email AS assigned_user_email,
      c.used_by_user_id,
      uu.email AS used_by_user_email,
      c.used_at,
      c.expires_at,
      c.metadata_json,
      c.created_at
    FROM purchase_codes c
    LEFT JOIN purchase_code_batches b ON b.id = c.batch_id
    LEFT JOIN users au ON au.id = c.assigned_user_id
    LEFT JOIN users uu ON uu.id = c.used_by_user_id
    WHERE 1 = 1
  `;

  const binds = [];

  if (status && ['available', 'assigned', 'used', 'disabled', 'expired'].includes(status)) {
    sql += ` AND c.status = ? `;
    binds.push(status);
  }

  if (batchId) {
    sql += ` AND c.batch_id = ? `;
    binds.push(batchId);
  }

  if (q) {
    sql += ` AND c.code LIKE ? `;
    binds.push(`%${q}%`);
  }

  sql += `
    ORDER BY c.created_at DESC
    LIMIT ?
  `;
  binds.push(limit);

  const result = await env.DB.prepare(sql).bind(...binds).all();
  const items = Array.isArray(result?.results) ? result.results : [];

  return adminJson(request, env, {
    ok: true,
    items,
    meta: {
      limit,
      count: items.length,
      status: status || null,
      batch_id: batchId || null,
      q: q || null,
    },
  });
}

async function handlePlansList(request, env) {
  await authenticateAdmin(request, env);

  const result = await env.DB.prepare(`
    SELECT
      code,
      name,
      billing_type,
      is_active,
      sort_order,
      metadata_json,
      created_at
    FROM plan_catalog
    ORDER BY sort_order ASC, name ASC
  `).all();

  const items = Array.isArray(result?.results) ? result.results : [];

  return adminJson(request, env, {
    ok: true,
    items,
    meta: {
      count: items.length,
    },
  });
}

async function handleFeaturesList(request, env) {
  await authenticateAdmin(request, env);

  const featuresResult = await env.DB.prepare(`
    SELECT
      code,
      name,
      description,
      category,
      is_active,
      sort_order,
      created_at
    FROM feature_catalog
    ORDER BY sort_order ASC, name ASC
  `).all();

  const flagsResult = await env.DB.prepare(`
    SELECT
      pf.id,
      pf.feature_code,
      pf.plan_code,
      pf.access_state,
      pf.cta_label,
      pf.badge_label,
      pf.created_at,
      p.name AS plan_name
    FROM plan_feature_flags pf
    INNER JOIN plan_catalog p ON p.code = pf.plan_code
    ORDER BY p.sort_order ASC, p.name ASC
  `).all();

  const features = Array.isArray(featuresResult?.results) ? featuresResult.results : [];
  const flags = Array.isArray(flagsResult?.results) ? flagsResult.results : [];

  const items = features.map((feature) => ({
    ...feature,
    plan_flags: flags.filter((flag) => flag.feature_code === feature.code),
  }));

  return adminJson(request, env, {
    ok: true,
    items,
    meta: {
      count: items.length,
    },
  });
}

async function handleFeatureFlagUpsert(request, env) {
  const adminCheck = await authenticateAdmin(request, env);
  if (!adminCheck.ok) return adminCheck.response;

  const body = await readJsonBody(request);

  const featureCode = String(body?.feature_code || '').trim();
  const planCode = String(body?.plan_code || '').trim();
  const accessState = String(body?.access_state || '').trim().toLowerCase();
  const ctaLabelRaw = body?.cta_label;
  const badgeLabelRaw = body?.badge_label;

  const allowedStates = ['enabled', 'locked', 'sponsored'];

  if (!featureCode || !planCode) {
    return adminJson(request, env, {
      ok: false,
      error: 'feature_code y plan_code son obligatorios',
    }, 400);
  }

  if (!allowedStates.includes(accessState)) {
    return adminJson(request, env, {
      ok: false,
      error: 'access_state inválido. Valores permitidos: enabled, locked, sponsored',
    }, 400);
  }

  const ctaLabel = ctaLabelRaw == null ? null : String(ctaLabelRaw).trim() || null;
  const badgeLabel = badgeLabelRaw == null ? null : String(badgeLabelRaw).trim() || null;

  const featureExists = await env.DB.prepare(`
    SELECT code, name
    FROM feature_catalog
    WHERE code = ?
    LIMIT 1
  `).bind(featureCode).first();

  if (!featureExists) {
    return adminJson(request, env, {
      ok: false,
      error: 'La función indicada no existe',
    }, 404);
  }

  const planExists = await env.DB.prepare(`
    SELECT code, name
    FROM plan_catalog
    WHERE code = ?
    LIMIT 1
  `).bind(planCode).first();

  if (!planExists) {
    return adminJson(request, env, {
      ok: false,
      error: 'El plan indicado no existe',
    }, 404);
  }

  const flagId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO plan_feature_flags (
      id,
      feature_code,
      plan_code,
      access_state,
      cta_label,
      badge_label
    )
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(feature_code, plan_code)
    DO UPDATE SET
      access_state = excluded.access_state,
      cta_label = excluded.cta_label,
      badge_label = excluded.badge_label
  `).bind(
    flagId,
    featureCode,
    planCode,
    accessState,
    ctaLabel,
    badgeLabel
  ).run();

  const updated = await env.DB.prepare(`
    SELECT
      pf.id,
      pf.feature_code,
      pf.plan_code,
      pf.access_state,
      pf.cta_label,
      pf.badge_label,
      pf.created_at,
      p.name AS plan_name,
      f.name AS feature_name
    FROM plan_feature_flags pf
    INNER JOIN plan_catalog p ON p.code = pf.plan_code
    INNER JOIN feature_catalog f ON f.code = pf.feature_code
    WHERE pf.feature_code = ? AND pf.plan_code = ?
    LIMIT 1
  `).bind(featureCode, planCode).first();

  await writeAdminAudit(env, {
    adminUserId: adminCheck.admin.id,
    action: 'superadmin.feature-flag.upsert',
    entityType: 'plan_feature_flags',
    entityId: updated?.id || `${featureCode}:${planCode}`,
    details: {
      feature_code: featureCode,
      feature_name: featureExists.name || null,
      plan_code: planCode,
      plan_name: planExists.name || null,
      access_state: accessState,
      cta_label: ctaLabel,
      badge_label: badgeLabel,
    },
  });

  return adminJson(request, env, {
    ok: true,
    item: updated,
  });
}

export async function handleSuperAdmin(request, env) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const method = request.method;

  const batchGenerateMatch = path.match(/^\/api\/v1\/superadmin\/purchase-code-batches\/([^/]+)\/generate$/);
  const batchExportMatch = path.match(/^\/api\/v1\/superadmin\/purchase-code-batches\/([^/]+)\/export$/);

  if (path === '/api/v1/superadmin/health' && method === 'GET') {
    return handleHealth(request, env);
  }

  if (path === '/api/v1/superadmin/settings' && method === 'GET') {
    return handleSettings(request, env);
  }

  if (path === '/api/v1/superadmin/plans' && method === 'GET') {
    return handlePlansList(request, env);
  }

  if (path === '/api/v1/superadmin/features' && method === 'GET') {
    return handleFeaturesList(request, env);
  }

  if (path === '/api/v1/superadmin/features/flag' && method === 'PUT') {
    return handleFeatureFlagUpsert(request, env);
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

  if (path === '/api/v1/superadmin/purchase-codes/mode' && method === 'GET') {
    return handlePurchaseCodeModeGet(request, env);
  }

  if (path === '/api/v1/superadmin/purchase-codes/mode' && method === 'PUT') {
    return handlePurchaseCodeModePut(request, env);
  }

  if (path === '/api/v1/superadmin/purchase-code-batches' && method === 'GET') {
    return handlePurchaseCodeBatchesList(request, env);
  }

  if (path === '/api/v1/superadmin/purchase-code-batches' && method === 'POST') {
    return handlePurchaseCodeBatchCreate(request, env);
  }

  if (batchGenerateMatch && method === 'POST') {
    return handlePurchaseCodeBatchGenerate(request, env, batchGenerateMatch[1]);
  }

  if (batchExportMatch && method === 'GET') {
    return handlePurchaseCodeBatchExport(request, env, batchExportMatch[1]);
  }

  if (path === '/api/v1/superadmin/purchase-codes' && method === 'GET') {
    return handlePurchaseCodesList(request, env);
  }

  return adminJson(request, env, { error: 'SuperAdmin route not found' }, 404);
}
import { authenticateUser } from './auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function authenticateAdmin(request, env, allowedRoles = []) {
  const auth = await authenticateUser(request, env);

  if (!auth || auth.error || !auth.userId) {
    return {
      ok: false,
      response: json({ error: auth?.error || 'Unauthorized' }, auth?.status || 401),
    };
  }

  const admin = await env.DB.prepare(`
    SELECT id, user_id, role, status, created_at, updated_at
    FROM admin_users
    WHERE user_id = ?
    LIMIT 1
  `).bind(auth.userId).first();

  if (!admin) {
    return { ok: false, response: json({ error: 'Admin access required' }, 403) };
  }

  if (admin.status !== 'active') {
    return { ok: false, response: json({ error: 'Admin inactive' }, 403) };
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(admin.role)) {
    return { ok: false, response: json({ error: 'Insufficient role' }, 403) };
  }

  return {
    ok: true,
    auth,
    admin,
  };
}

export async function writeAdminAudit(env, {
  adminUserId,
  action,
  entityType,
  entityId = null,
  reason = null,
  details = null,
}) {
  const auditId = crypto.randomUUID();

  await env.DB.prepare(`
    INSERT INTO admin_audit_log (
      id, admin_user_id, action, entity_type, entity_id, reason, details_json
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    auditId,
    adminUserId,
    action,
    entityType,
    entityId,
    reason,
    details ? JSON.stringify(details) : null
  ).run();

  return auditId;
}

export function adminJson(data, status = 200) {
  return json(data, status);
}

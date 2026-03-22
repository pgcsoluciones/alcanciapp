import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';
import { listBadgesCatalog, listUserBadges } from '../lib/badges.js';

export async function handleBadges(request, env) {
  const corsHeaders = getCorsHeaders(request, env);
  const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  const authResult = await authenticateUser(request, env);
  if (authResult.error) {
    return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
      status: authResult.status,
      headers: baseHeaders
    });
  }

  const { userId } = authResult;
  const method = request.method;
  const url = new URL(request.url);
  const normalizedPath = url.pathname.replace(/\/+/g, '/').replace(/\/+$/, '') || '/';

  try {
    if (method === 'GET' && normalizedPath === '/api/v1/badges') {
      const [catalog, unlocked] = await Promise.all([
        listBadgesCatalog(env),
        listUserBadges(env, { userId })
      ]);

      return new Response(JSON.stringify({
        ok: true,
        badges_catalog: catalog,
        user_badges: unlocked
      }), {
        status: 200,
        headers: baseHeaders
      });
    }

    return new Response(JSON.stringify({ ok: false, error: 'Invalid badges route' }), {
      status: 404,
      headers: baseHeaders
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: e.message }), {
      status: 500,
      headers: baseHeaders
    });
  }
}

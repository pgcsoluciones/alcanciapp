import { handleOptions, getCorsHeaders } from './lib/cors.js';
import { handleAnonymousAuth, handleRequestToken, handleVerifyToken } from './routes/auth.js';
import { handleGoals } from './routes/goals.js';
import { handleTransactions } from './routes/transactions.js';
import { handleProfile } from './routes/profile.js';
import { handleBadges } from './routes/badges.js';

function normalizePathname(pathname) {
    const collapsed = pathname.replace(/\/+/g, '/');
    return collapsed.length > 1 ? collapsed.replace(/\/+$/, '') : collapsed;
}

export default {
    async fetch(request, env, ctx) {
        // Manejar CORS Preflight Global
        const corsResponse = handleOptions(request, env);
        if (corsResponse) return corsResponse;

        const url = new URL(request.url);
        const path = url.pathname;
        const normalizedPath = normalizePathname(path);
        const method = request.method;

        const baseHeaders = { ...getCorsHeaders(request, env), "Content-Type": "application/json" };

        try {
            // ==========================================
            // BACKWARD COMPATIBILITY
            // ==========================================
            if (normalizedPath === "/" && method === "GET") {
                return new Response("AlcanciApp API is running", {
                    headers: { ...getCorsHeaders(request, env), "Content-Type": "text/plain" }
                });
            }

            if (normalizedPath === "/health" && method === "GET") {
                return new Response(JSON.stringify({ ok: true, name: "alcanciapp-api" }), {
                    headers: baseHeaders
                });
            }

            // ==========================================
            // MODULE ROUTES
            // ==========================================

            // AUTHENTICATION
            if (normalizedPath === "/api/v1/auth/anonymous") {
                return handleAnonymousAuth(request, env);
            }

            if (normalizedPath === "/api/v1/auth/request-token") {
                return handleRequestToken(request, env);
            }

            if (normalizedPath === "/api/v1/auth/verify-token") {
                return handleVerifyToken(request, env);
            }

            // GOALS
            if (normalizedPath.startsWith("/api/v1/goals")) {
                // Delegamos /api/v1/goals... a su handler
                // Transacciones atadas a goals: POST /api/v1/goals/:id/transactions
                if (normalizedPath.includes("/transactions")) {
                    return handleTransactions(request, env);
                }
                return handleGoals(request, env);
            }

            // PROFILE
            if (normalizedPath === "/api/v1/profile" || normalizedPath === "/api/v1/profile/verify-password") {
                return handleProfile(request, env);
            }

            // BADGES
            if (normalizedPath === "/api/v1/badges") {
                return handleBadges(request, env);
            }

            // TRANSACTIONS DIRETS
            if (normalizedPath === "/api/v1/transactions" || normalizedPath.startsWith("/api/v1/transactions/")) {
                return handleTransactions(request, env);
            }

            // Fallback not found
            return new Response(JSON.stringify({ error: "Not Found" }), { status: 404, headers: baseHeaders });

        } catch (e) {
            console.error("Global catch:", e);
            return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500, headers: baseHeaders });
        }
    }
}

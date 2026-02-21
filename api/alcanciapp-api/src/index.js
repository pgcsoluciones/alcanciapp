import { handleOptions, getCorsHeaders } from './lib/cors.js';
import { handleAnonymousAuth } from './routes/auth.js';
import { handleGoals } from './routes/goals.js';
import { handleTransactions } from './routes/transactions.js';

export default {
    async fetch(request, env, ctx) {
        // Manejar CORS Preflight Global
        const corsResponse = handleOptions(request, env);
        if (corsResponse) return corsResponse;

        const url = new URL(request.url);
        const path = url.pathname;
        const method = request.method;

        const baseHeaders = { ...getCorsHeaders(env), "Content-Type": "application/json" };

        try {
            // ==========================================
            // BACKWARD COMPATIBILITY
            // ==========================================
            if (path === "/" && method === "GET") {
                return new Response("AlcanciApp API is running", {
                    headers: { ...getCorsHeaders(env), "Content-Type": "text/plain" }
                });
            }

            if (path === "/health" && method === "GET") {
                return new Response(JSON.stringify({ ok: true, name: "alcanciapp-api" }), {
                    headers: baseHeaders
                });
            }

            // ==========================================
            // MODULE ROUTES
            // ==========================================

            // AUTHENTICATION
            if (path === "/api/v1/auth/anonymous") {
                return handleAnonymousAuth(request, env);
            }

            // GOALS
            if (path.startsWith("/api/v1/goals")) {
                // Delegamos /api/v1/goals... a su handler
                // Transacciones atadas a goals: POST /api/v1/goals/:id/transactions
                if (path.includes("/transactions")) {
                    return handleTransactions(request, env);
                }
                return handleGoals(request, env);
            }

            // TRANSACTIONS DIRETS
            if (path.startsWith("/api/v1/transactions")) {
                // Sólo soportamos DELETE /api/v1/transactions/:id
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

// src/routes/auth.js
import { sha256 } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleAnonymousAuth(request, env) {
    const corsHeaders = getCorsHeaders(env);

    // Solo POST
    if (request.method !== 'POST') {
        return new Response("Method not allowed", { status: 405, headers: corsHeaders });
    }

    try {
        // 1. Generar User ID (UUIDv4 nativo)
        const userId = crypto.randomUUID();

        // 2. Generar Session ID (UUIDv4 nativo)
        const sessionId = crypto.randomUUID();

        // 3. Generar token random (32 bytes -> convertido a base64url aproximado)
        const rawToken = crypto.getRandomValues(new Uint8Array(32));
        // base64url encode custom simple (reemplazo de caracteres de base64)
        const token = btoa(String.fromCharCode(...rawToken))
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 4. Calcular el Hash del token usando el pepper
        const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
        const tokenHash = await sha256(token + pepper);

        // Calcular expiración a 30 días (+30 días desde ahora)
        const date = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        const expiresAt = date.toISOString();

        // 5. Insertar Transaccionalmente en D1 (User y Session)
        const batch = await env.DB.batch([
            env.DB.prepare("INSERT INTO users (id) VALUES (?)").bind(userId),
            env.DB.prepare("INSERT INTO sessions (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)")
                .bind(sessionId, userId, tokenHash, expiresAt)
        ]);

        if (batch[0].error || batch[1].error) {
            throw new Error("D1 Error saving user or session");
        }

        // 6. Retornar JSON
        const responseJson = {
            ok: true,
            token: token,
            user: {
                id: userId
            }
        };

        return new Response(JSON.stringify(responseJson), {
            status: 200,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (e) {
        console.error("Auth Error:", e);
        return new Response(JSON.stringify({ ok: false, error: e.message }), {
            status: 500,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });
    }
}

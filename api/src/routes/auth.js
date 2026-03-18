// src/routes/auth.js
import { sha256, generateOtpCode, hashOtpCode, authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';
import { getEmailProvider } from '../lib/email.js';

export async function handleAuth(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const baseHeaders = { ...corsHeaders, "Content-Type": "application/json" };

    try {
        // ── [POST] /api/v1/auth/request-code ─────────────────────────────
        if (path === '/api/v1/auth/request-code' && method === 'POST') {
            const { email, purpose = 'auth_login' } = await request.json();

            if (!email || !email.includes('@')) {
                return new Response(JSON.stringify({ ok: false, error: "Email inválido" }), { status: 400, headers: baseHeaders });
            }

            const emailNormalized = email.toLowerCase().trim();
            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";

            // 1. Asegurar o crear identidad
            const identityId = crypto.randomUUID();
            await env.DB.prepare(
                "INSERT INTO auth_identities (id, email, email_normalized) VALUES (?, ?, ?) " +
                "ON CONFLICT(email_normalized) DO NOTHING"
            ).bind(identityId, email.trim(), emailNormalized).run();

            // 2. Generar OTP
            const rawCode = generateOtpCode(parseInt(env.OTP_LENGTH || "6"));
            const codeHash = await hashOtpCode(rawCode, pepper);
            const ttlMinutes = parseInt(env.OTP_TTL_MINUTES || "10");
            const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000).toISOString();

            // 3. Invalidar previos del mismo purpose/email
            await env.DB.prepare(
                "UPDATE auth_otps SET consumed_at = CURRENT_TIMESTAMP WHERE email = ? AND purpose = ? AND consumed_at IS NULL"
            ).bind(emailNormalized, purpose).run();

            // 4. Guardar nuevo OTP
            const otpId = crypto.randomUUID();
            const ip = request.headers.get("CF-Connecting-IP") || "local";
            const ipHash = await sha256(ip + pepper);

            await env.DB.prepare(
                "INSERT INTO auth_otps (id, email, purpose, code_hash, expires_at, ip_hash) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(otpId, emailNormalized, purpose, codeHash, expiresAt, ipHash).run();

            // 5. Enviar Email
            const emailProvider = getEmailProvider(env);
            const emailRes = await emailProvider.sendOtpEmail(emailNormalized, rawCode, { purpose });

            return new Response(JSON.stringify({
                ok: true,
                message: "Código enviado",
                // Solo exponer en desarrollo para facilidad de QA
                debug: env.ENVIRONMENT === 'development' ? { code: rawCode } : undefined
            }), { status: 200, headers: baseHeaders });
        }

        // ── [POST] /api/v1/auth/verify-code ──────────────────────────────
        if (path === '/api/v1/auth/verify-code' && method === 'POST') {
            const { email, code, purpose = 'auth_login' } = await request.json();
            if (!email || !code) {
                return new Response(JSON.stringify({ ok: false, error: "Email y código requeridos" }), { status: 400, headers: baseHeaders });
            }

            const emailNormalized = email.toLowerCase().trim();
            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const codeHash = await hashOtpCode(code, pepper);

            // 1. Buscar OTP válido
            const otp = await env.DB.prepare(
                "SELECT * FROM auth_otps WHERE email = ? AND purpose = ? AND consumed_at IS NULL AND expires_at > datetime('now') ORDER BY created_at DESC LIMIT 1"
            ).bind(emailNormalized, purpose).first();

            if (!otp) {
                return new Response(JSON.stringify({ ok: false, error: "Código inválido o expirado" }), { status: 401, headers: baseHeaders });
            }

            // 2. Validar intentos
            if (otp.attempt_count >= 5) {
                return new Response(JSON.stringify({ ok: false, error: "Máximo de intentos alcanzado" }), { status: 403, headers: baseHeaders });
            }

            // 3. Comparar Hash
            if (otp.code_hash !== codeHash) {
                await env.DB.prepare("UPDATE auth_otps SET attempt_count = attempt_count + 1 WHERE id = ?").bind(otp.id).run();
                return new Response(JSON.stringify({ ok: false, error: "Código incorrecto" }), { status: 401, headers: baseHeaders });
            }

            // 4. Consumir OTP
            await env.DB.prepare("UPDATE auth_otps SET consumed_at = CURRENT_TIMESTAMP WHERE id = ?").bind(otp.id).run();

            // 5. LOGIN: Buscar o crear usuario
            let user = await env.DB.prepare("SELECT * FROM users WHERE email = ?").bind(emailNormalized).first();
            let userId = user?.id;

            if (!user) {
                userId = crypto.randomUUID();
                await env.DB.prepare("INSERT INTO users (id, email) VALUES (?, ?)")
                    .bind(userId, emailNormalized).run();
                user = { id: userId, email: emailNormalized };
            }

            // Marcar identidad como verificada si es login
            if (purpose === 'auth_login') {
                await env.DB.prepare("UPDATE auth_identities SET is_verified = 1 WHERE email_normalized = ?")
                    .bind(emailNormalized).run();
            }

            // 6. Crear sesión
            const sessionId = crypto.randomUUID();
            const rawSessionToken = crypto.randomUUID();
            const sessionHash = await sha256(rawSessionToken + pepper);
            const sessionExpires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

            const ip = request.headers.get("CF-Connecting-IP") || "local";
            const ipHash = await sha256(ip + pepper);

            await env.DB.prepare(
                "INSERT INTO sessions (id, user_id, token_hash, expires_at, ip_hash, user_agent) VALUES (?, ?, ?, ?, ?, ?)"
            ).bind(
                sessionId,
                userId,
                sessionHash,
                sessionExpires,
                ipHash,
                request.headers.get("User-Agent") || "unknown"
            ).run();

            return new Response(JSON.stringify({
                ok: true,
                token: rawSessionToken,
                user: {
                    id: userId,
                    email: emailNormalized,
                    name: user.name || emailNormalized.split('@')[0],
                    avatar: user.avatar
                }
            }), { status: 200, headers: baseHeaders });
        }

        // ── [POST] /api/v1/auth/logout ───────────────────────────────────
        if (path === '/api/v1/auth/logout' && method === 'POST') {
            const authHeader = request.headers.get("Authorization");
            if (!authHeader) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });

            // Strict parsing: "Bearer <token>"
            const parts = authHeader.split(" ");
            if (parts.length !== 2 || parts[0] !== "Bearer") {
                return new Response(JSON.stringify({ ok: false, error: "Invalid Authorization format" }), { status: 401, headers: baseHeaders });
            }

            const token = parts[1];
            if (!token) return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });

            const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
            const tokenHash = await sha256(token + pepper);

            await env.DB.prepare(
                "UPDATE sessions SET revoked_at = CURRENT_TIMESTAMP WHERE token_hash = ?"
            ).bind(tokenHash).run();

            return new Response(JSON.stringify({ ok: true }), { status: 200, headers: baseHeaders });
        }

        // ── [GET] /api/v1/auth/me ────────────────────────────────────────
        if (path === '/api/v1/auth/me' && method === 'GET') {
            const auth = await authenticateUser(request, env);
            if (auth.error) {
                return new Response(JSON.stringify({ ok: false, error: auth.error }), { status: auth.status, headers: baseHeaders });
            }

            const user = await env.DB.prepare(
                "SELECT id, email, name, avatar, user_type FROM users WHERE id = ?"
            ).bind(auth.userId).first();

            if (!user) {
                return new Response(JSON.stringify({ ok: false, error: "Usuario no encontrado" }), { status: 404, headers: baseHeaders });
            }

            return new Response(JSON.stringify({
                ok: true,
                user: {
                    ...user,
                    name: user.name || user.email.split('@')[0]
                }
            }), { status: 200, headers: baseHeaders });
        }

        // Aliases para compatibilidad temporal (opcional, pero ayuda a no romper el front actual de golpe)
        if (path === '/api/v1/auth/request-token') return handleAuth(new Request(url.origin + '/api/v1/auth/request-code', request), env);
        if (path === '/api/v1/auth/verify-token') return handleAuth(new Request(url.origin + '/api/v1/auth/verify-code', request), env);

        return new Response(JSON.stringify({ error: "Route not found" }), { status: 404, headers: baseHeaders });

    } catch (e) {
        console.error("Auth Error:", e);
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

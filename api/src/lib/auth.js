// src/lib/auth.js

/**
 * Retorna el Hex String del SHA-256 de un texto dado.
 */
export async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un código OTP de N dígitos criptográficamente seguro.
 */
export function generateOtpCode(length = 6) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    // Garantizamos el número de dígitos exacto usando el módulo del rango
    const code = (array[0] % Math.pow(10, length)).toString().padStart(length, '0');
    return code;
}

/**
 * Genera un hash para el código OTP usando un pepper.
 */
export async function hashOtpCode(code, pepper) {
    return await sha256(code + (pepper || ""));
}

/**
 * Lee el header Authorization: Bearer <token>.
 * Extrae el token, lee de la base de datos comparando con el hash, y si es válido adjunta user_id
 */
export async function authenticateUser(request, env) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
        return { error: "Missing Authorization header", status: 401 };
    }

    // Strict parsing: "Bearer <token>"
    const parts = authHeader.split(" ");
    if (parts.length !== 2 || parts[0] !== "Bearer") {
        return { error: "Invalid Authorization format. Expected 'Bearer <token>'", status: 401 };
    }

    const token = parts[1];
    if (!token) {
        return { error: "Empty token", status: 401 };
    }

    // Hash el token que recibimos anexando el PEPPER de las variables de entorno
    const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
    const tokenHash = await sha256(token + pepper);

    // Buscar sesión válida (no expirada y no revocada)
    const stmt = env.DB.prepare(
        "SELECT user_id, unlock_until FROM sessions WHERE token_hash = ? AND expires_at > datetime('now') AND revoked_at IS NULL"
    ).bind(tokenHash);

    const session = await stmt.first();

    if (!session) {
        return { error: "Invalid or expired session", status: 401 };
    }

    // Devuelve el userId y el estado de desbloqueo
    return {
        userId: session.user_id,
        unlockUntil: session.unlock_until
    };
}

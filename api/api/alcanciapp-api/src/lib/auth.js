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
 * Lee el header Authorization: Bearer <token>.
 * Extrae el token, lee de la base de datos comparando con el hash, y si es válido adjunta user_id
 */
export async function authenticateUser(request, env) {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { error: "Missing or invalid Authorization header", status: 401 };
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        return { error: "Empty token", status: 401 };
    }

    // Hash el token que recibimos anexando el PEPPER de las variables de entorno
    const pepper = env.AUTH_PEPPER || "local_pepper_placeholder";
    const tokenHash = await sha256(token + pepper);

    // Buscar sesión válida
    const stmt = env.DB.prepare(
        "SELECT user_id FROM sessions WHERE token_hash = ? AND expires_at > datetime('now')"
    ).bind(tokenHash);

    const session = await stmt.first();

    if (!session) {
        return { error: "Invalid or expired session", status: 401 };
    }

    // Devuelve el userId extraído
    return { userId: session.user_id };
}

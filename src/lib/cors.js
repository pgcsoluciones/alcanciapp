// src/lib/cors.js
export function getCorsHeaders(request, env) {
    const origin = request.headers.get('Origin') || '';
    let allowedOrigin = env.CORS_ORIGIN || "*";

    // Si la petición viene de nuestro dominio de pages (producción o preview) o localhost
    if (origin === 'https://alcanciapp.pages.dev' || origin.endsWith('.alcanciapp.pages.dev') || origin.startsWith('http://localhost:')) {
        allowedOrigin = origin;
    }

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin"
    };
}

export function handleOptions(request, env) {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: getCorsHeaders(request, env) });
    }
    return null;
}

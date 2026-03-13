// src/lib/cors.js
export function getCorsHeaders(env) {
    return {
        "Access-Control-Allow-Origin": env.CORS_ORIGIN || "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS,DELETE,PATCH,PUT",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
    };
}

export function handleOptions(request, env) {
    if (request.method === "OPTIONS") {
        return new Response(null, { headers: getCorsHeaders(env) });
    }
    return null;
}

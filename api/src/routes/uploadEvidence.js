// src/routes/uploadEvidence.js
// Endpoint para subir fotos de evidencia de aportes a Cloudflare R2.
// En V1: foto es opcional. En Retos/Círculos: será requerida.
import { authenticateUser } from '../lib/auth.js';
import { getCorsHeaders } from '../lib/cors.js';

export async function handleUploadEvidence(request, env) {
    const corsHeaders = getCorsHeaders(request, env);
    const authResult = await authenticateUser(request, env);
    if (authResult.error) {
        return new Response(JSON.stringify({ ok: false, error: authResult.error }), {
            status: authResult.status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    const { userId } = authResult;
    const baseHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

    if (request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: baseHeaders });
    }

    try {
        // Si R2 no está configurado, devolvemos ok con url null (V1 graceful)
        if (!env.EVIDENCE_BUCKET) {
            return new Response(JSON.stringify({
                ok: true,
                url: null,
                message: 'R2 no configurado. La evidencia visual estará disponible en una próxima versión.'
            }), { status: 200, headers: baseHeaders });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file) {
            return new Response(JSON.stringify({ ok: false, error: 'Archivo requerido' }), { status: 400, headers: baseHeaders });
        }

        // Validar tipo e tamaño (máx 5MB)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return new Response(JSON.stringify({ ok: false, error: 'Solo se permiten imágenes JPG, PNG o WEBP' }), { status: 400, headers: baseHeaders });
        }

        const bytes = await file.arrayBuffer();
        if (bytes.byteLength > 5 * 1024 * 1024) {
            return new Response(JSON.stringify({ ok: false, error: 'La imagen no puede superar 5MB' }), { status: 400, headers: baseHeaders });
        }

        const goalId = formData.get('goal_id') || 'general';
        const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
        const key = `evidence/${userId}/${goalId}/${crypto.randomUUID()}.${ext}`;

        await env.EVIDENCE_BUCKET.put(key, bytes, {
            httpMetadata: { contentType: file.type }
        });

        return new Response(JSON.stringify({ ok: true, url: key }), { status: 200, headers: baseHeaders });

    } catch (e) {
        return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500, headers: baseHeaders });
    }
}

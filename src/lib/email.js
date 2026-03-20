// src/lib/email.js

/**
 * Interface/Base para proveedores de email.
 */
export class EmailProvider {
    async sendOtpEmail(email, code, context) {
        throw new Error("sendOtpEmail not implemented");
    }
}

/**
 * Proveedor que imprime el código en la consola (Logs de Cloudflare).
 * Útil para desarrollo y QA.
 */
export class ConsoleEmailProvider extends EmailProvider {
    async sendOtpEmail(email, code, context) {
        const purpose = context?.purpose || 'auth_login';
        console.log(`[EMAIL_CONSOLE] Para: ${email} | Propósito: ${purpose} | CÓDIGO: ${code}`);
        return { ok: true, provider: 'console' };
    }
}

/**
 * Proveedor real usando la API de Resend.
 */
export class ResendEmailProvider extends EmailProvider {
    constructor(apiKey, fromEmail) {
        super();
        this.apiKey = apiKey;
        this.fromEmail = fromEmail || 'AlcanciApp <noreply@alcanciapp.com>';
    }

    async sendOtpEmail(email, code, context) {
        if (!this.apiKey) {
            console.error("[RESEND] API Key no configurada");
            return { ok: false, error: "API Key missing" };
        }

        const purposeLabel = context?.purpose === 'auth_login' ? 'iniciar sesión' : 'verificar tu cuenta';
        const url = 'https://api.resend.com/emails';

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    from: this.fromEmail,
                    to: [email],
                    subject: `${code} es tu código de AlcanciApp`,
                    html: `
                        <div style="font-family: sans-serif; max-width: 400px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                            <h2 style="color: #333;">AlcanciApp</h2>
                            <p>Usa el siguiente código para ${purposeLabel}:</p>
                            <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 5px; color: #000;">
                                ${code}
                            </div>
                            <p style="color: #666; font-size: 12px; margin-top: 20px;">
                                Este código expirará en 10 minutos. Si no solicitaste esto, puedes ignorar el correo.
                            </p>
                        </div>
                    `
                })
            });

            const data = await response.json();
            if (response.ok) {
                return { ok: true, id: data.id, provider: 'resend' };
            } else {
                console.error("[RESEND_ERROR]", data);
                return { ok: false, error: data.message };
            }
        } catch (error) {
            console.error("[RESEND_FETCH_ERROR]", error);
            return { ok: false, error: error.message };
        }
    }
}

/**
 * Factory para obtener el proveedor configurado.
 */
export function getEmailProvider(env) {
    const providerType = env.EMAIL_PROVIDER || 'console';

    if (providerType === 'resend') {
        return new ResendEmailProvider(env.RESEND_API_KEY, env.EMAIL_FROM);
    }

    return new ConsoleEmailProvider();
}

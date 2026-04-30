import { NextRequest, NextResponse } from "next/server";

const RESEND_API_KEY = process.env.RESEND_API_KEY!;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com";

function confirmationHtml(confirmUrl: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6FB;">
<tr><td align="center" style="padding:40px 16px;">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <tr><td style="background:linear-gradient(135deg,#1C3557,#1a4a6b);border-radius:20px 20px 0 0;padding:28px 40px;text-align:center;">
    <div style="font-size:26px;font-weight:900;color:#fff;">Pet<span style="color:#2CB8AD;">Pass</span></div>
  </td></tr>

  <tr><td style="background:#fff;padding:40px 40px 36px;text-align:center;border-radius:0 0 20px 20px;">
    <div style="font-size:48px;margin-bottom:16px;">🐾</div>
    <h1 style="font-size:22px;font-weight:900;color:#1C3557;margin-bottom:10px;letter-spacing:-0.5px;">
      Confirmá tu cuenta
    </h1>
    <p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:32px;">
      Ya casi estás. Hacé click en el botón para confirmar tu dirección de email y empezar a usar PetPass.
    </p>
    <a href="${confirmUrl}" style="display:inline-block;background:linear-gradient(135deg,#2CB8AD,#229E94);color:#fff;text-decoration:none;border-radius:14px;padding:16px 40px;font-size:16px;font-weight:900;box-shadow:0 4px 20px rgba(44,184,173,0.35);">
      Confirmar mi cuenta →
    </a>
    <p style="font-size:12px;color:#94A3B8;margin-top:28px;line-height:1.6;">
      Si no creaste una cuenta en PetPass, ignorá este mail.<br/>
      El link expira en 24 horas.
    </p>
  </td></tr>

  <tr><td style="padding:20px;text-align:center;">
    <div style="font-size:11px;color:#94A3B8;">
      <a href="${SITE_URL}" style="color:#94A3B8;text-decoration:none;">mipetpass.com</a>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

function recoveryHtml(recoveryUrl: string) {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#F4F6FB;">
<tr><td align="center" style="padding:40px 16px;">
<table width="520" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;width:100%;">

  <tr><td style="background:linear-gradient(135deg,#1C3557,#1a4a6b);border-radius:20px 20px 0 0;padding:28px 40px;text-align:center;">
    <div style="font-size:26px;font-weight:900;color:#fff;">Pet<span style="color:#2CB8AD;">Pass</span></div>
  </td></tr>

  <tr><td style="background:#fff;padding:40px 40px 36px;text-align:center;border-radius:0 0 20px 20px;">
    <div style="font-size:48px;margin-bottom:16px;">🔐</div>
    <h1 style="font-size:22px;font-weight:900;color:#1C3557;margin-bottom:10px;letter-spacing:-0.5px;">
      Recuperar contraseña
    </h1>
    <p style="font-size:14px;color:#64748B;line-height:1.7;margin-bottom:32px;">
      Recibimos una solicitud para restablecer tu contraseña. Hacé click en el botón para crear una nueva.
    </p>
    <a href="${recoveryUrl}" style="display:inline-block;background:linear-gradient(135deg,#2CB8AD,#229E94);color:#fff;text-decoration:none;border-radius:14px;padding:16px 40px;font-size:16px;font-weight:900;box-shadow:0 4px 20px rgba(44,184,173,0.35);">
      Restablecer contraseña →
    </a>
    <p style="font-size:12px;color:#94A3B8;margin-top:28px;line-height:1.6;">
      Si no solicitaste restablecer tu contraseña, ignorá este mail.<br/>
      El link expira en 1 hora.
    </p>
  </td></tr>

  <tr><td style="padding:20px;text-align:center;">
    <div style="font-size:11px;color:#94A3B8;">
      <a href="${SITE_URL}" style="color:#94A3B8;text-decoration:none;">mipetpass.com</a>
    </div>
  </td></tr>

</table>
</td></tr></table>
</body></html>`;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { user, email_data } = body;

  const email = user?.email;
  const actionType = email_data?.email_action_type;
  const tokenHash = email_data?.token_hash;
  const redirectTo = email_data?.redirect_to || `${SITE_URL}/onboarding`;

  if (!email || !actionType || !tokenHash) {
    return NextResponse.json({ error: "datos incompletos" }, { status: 400 });
  }

  const confirmUrl = `https://amyosmkbldgdxuqepxqu.supabase.co/auth/v1/verify?token=${tokenHash}&type=${actionType}&redirect_to=${encodeURIComponent(redirectTo)}`;

  let subject = "";
  let html = "";

  if (actionType === "signup" || actionType === "email_change") {
    subject = "Confirmá tu cuenta en PetPass 🐾";
    html = confirmationHtml(confirmUrl);
  } else if (actionType === "recovery" || actionType === "magiclink") {
    subject = "Recuperar contraseña — PetPass";
    html = recoveryHtml(confirmUrl);
  } else {
    subject = "Acción requerida en PetPass";
    html = confirmationHtml(confirmUrl);
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "PetPass <noreply@mipetpass.com>",
      to: [email],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("Email hook Resend error:", err);
    return NextResponse.json({ error: "fallo envío" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

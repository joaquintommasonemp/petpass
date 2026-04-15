import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToUsers } from "@/lib/push";

export const runtime = "nodejs";

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
function addDays(d: Date, days: number): string {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result.toISOString().split("T")[0];
}

function buildEmail(items: { mascotaName: string; vacunaName: string; daysLeft: number }[]): string {
  const urgentes = items.filter(i => i.daysLeft <= 7);
  const proximas = items.filter(i => i.daysLeft > 7);

  const itemHtml = (i: { mascotaName: string; vacunaName: string; daysLeft: number }) => {
    const color = i.daysLeft === 0 ? "#EF4444" : i.daysLeft <= 7 ? "#F97316" : "#2CB8AD";
    const badge = i.daysLeft === 0 ? "Vence HOY" : i.daysLeft === 1 ? "Vence mañana" : `En ${i.daysLeft} días`;
    return `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;border-bottom:1px solid #E2E8F0;">
        <div style="font-size:28px;flex-shrink:0;">💉</div>
        <div style="flex:1;">
          <div style="font-weight:800;font-size:14px;color:#1C3557;">${i.vacunaName}</div>
          <div style="color:#64748B;font-size:12px;margin-top:2px;">para <strong>${i.mascotaName}</strong></div>
        </div>
        <div style="background:${color}22;color:${color};border-radius:20px;padding:4px 12px;font-size:11px;font-weight:800;white-space:nowrap;">${badge}</div>
      </div>`;
  };

  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#F4F6FB;font-family:Arial,sans-serif;">
  <div style="max-width:520px;margin:32px auto;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(28,53,87,0.10);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1C3557 0%,#2CB8AD 100%);padding:28px 32px;text-align:center;">
      <img src="${process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com"}/logo-brand-official.png" alt="PetPass" style="height:48px;width:auto;filter:brightness(0) invert(1);margin-bottom:12px;" />
      <h1 style="color:#fff;font-size:20px;font-weight:900;margin:0;letter-spacing:-0.3px;">Recordatorio de vacunas 💉</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <p style="color:#64748B;font-size:14px;line-height:1.7;margin-bottom:20px;">
        Hola 👋 Te avisamos que ${items.length === 1 ? "una vacuna de tu mascota está próxima a vencer" : `${items.length} vacunas de tus mascotas están próximas a vencer"}`}.
        Coordiná con tu veterinario para mantener a tu peludito al día.
      </p>

      ${urgentes.length > 0 ? `
      <div style="background:#FFF0F0;border:1px solid #FECACA;border-radius:12px;padding:4px 16px 4px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:800;color:#EF4444;letter-spacing:1.5px;text-transform:uppercase;padding:10px 0 2px;">⚠️ Urgentes</div>
        ${urgentes.map(itemHtml).join("")}
      </div>` : ""}

      ${proximas.length > 0 ? `
      <div style="background:#F4F6FB;border:1px solid #E2E8F0;border-radius:12px;padding:4px 16px 4px;margin-bottom:16px;">
        <div style="font-size:11px;font-weight:800;color:#64748B;letter-spacing:1.5px;text-transform:uppercase;padding:10px 0 2px;">📅 Próximas (30 días)</div>
        ${proximas.map(itemHtml).join("")}
      </div>` : ""}

      <!-- CTA -->
      <div style="text-align:center;margin-top:24px;">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com"}/dashboard/historial" style="display:inline-block;background:linear-gradient(135deg,#2CB8AD,#229E94);color:#fff;text-decoration:none;padding:14px 32px;border-radius:12px;font-weight:900;font-size:14px;">
          Ver historial completo →
        </a>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin-top:24px;line-height:1.6;">
        Recibís este recordatorio porque tenés una cuenta en PetPass.<br/>
        <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com"}/dashboard" style="color:#2CB8AD;">Ir al dashboard</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background:#F4F6FB;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F0;">
      <p style="color:#94a3b8;font-size:11px;margin:0;">PetPass · El pasaporte digital de tu mascota 🐾</p>
    </div>
  </div>
</body>
</html>`;
}

// ─── Handler ──────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // Validar cron secret — rechazar si no está configurado
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    console.error("CRON_SECRET no configurado — rechazando solicitud");
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const today = new Date();
  const targetDates = [
    { date: addDays(today, 0),  daysLeft: 0 },
    { date: addDays(today, 7),  daysLeft: 7 },
    { date: addDays(today, 30), daysLeft: 30 },
  ];
  const dateStrings = targetDates.map(t => t.date);

  // Traer vacunas que vencen hoy, en 7 o en 30 días
  const { data: vacunas, error } = await admin
    .from("vacunas")
    .select("id, name, next_date, mascota_id, mascotas!inner(name, user_id, active)")
    .in("next_date", dateStrings);

  if (error) {
    console.error("Error consultando vacunas:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Filtrar solo mascotas activas
  const activas = (vacunas || []).filter((v: any) => v.mascotas?.active !== false);
  if (activas.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay vacunas próximas a vencer hoy." });
  }

  // Obtener emails de los usuarios
  const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap: Record<string, string> = Object.fromEntries(
    users.map(u => [u.id, u.email ?? ""])
  );

  // Agrupar por user_id
  const byUser: Record<string, {
    email: string;
    items: { mascotaName: string; vacunaName: string; daysLeft: number }[];
  }> = {};

  for (const v of activas as any[]) {
    const userId = v.mascotas.user_id;
    const email = emailMap[userId];
    if (!email) continue;

    const daysLeft = targetDates.find(t => t.date === v.next_date)?.daysLeft ?? 30;

    if (!byUser[userId]) byUser[userId] = { email, items: [] };
    byUser[userId].items.push({
      mascotaName: v.mascotas.name,
      vacunaName: v.name,
      daysLeft,
    });
  }

  const userList = Object.values(byUser);
  if (userList.length === 0) {
    return NextResponse.json({ sent: 0, message: "No hay destinatarios con email." });
  }

  // Enviar emails via Resend
  let sent = 0;
  const errors: string[] = [];

  for (const { email, items } of userList) {
    const urgentCount = items.filter(i => i.daysLeft <= 7).length;
    const subject = urgentCount > 0
      ? `⚠️ Vacuna${urgentCount > 1 ? "s" : ""} próxima${urgentCount > 1 ? "s" : ""} a vencer — PetPass`
      : `📅 Recordatorio de vacunas — PetPass`;

    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "PetPass <noreply@mipetpass.com>",
          to: [email],
          subject,
          html: buildEmail(items),
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const body = await res.json();
        errors.push(`${email}: ${body.message ?? res.statusText}`);
      }
    } catch (e: any) {
      errors.push(`${email}: ${e.message}`);
    }
  }

  // Enviar push notifications en paralelo con los emails ya enviados
  const userIdsWithVacunas = Object.keys(byUser);
  const pushResults = await sendPushToUsers(userIdsWithVacunas, {
    title: "💉 Recordatorio de vacunas — PetPass",
    body: userIdsWithVacunas.length === 1
      ? "Tenés vacunas próximas a vencer. Coordiná con tu veterinario."
      : "Tus mascotas tienen vacunas próximas a vencer.",
    url: "/dashboard/historial",
    tag: "vacuna-reminder",
  });

  console.log(`[cron/vacunas] Emails: ${sent}/${userList.length}. Push: ${pushResults.sent}. Errores: ${errors.length}`);
  return NextResponse.json({ sent, total: userList.length, pushSent: pushResults.sent, errors });
}

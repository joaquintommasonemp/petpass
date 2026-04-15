import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

function verifySignature(req: NextRequest, dataId: string): boolean {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // Si no hay secret configurado, rechazar todo — no operar sin validación
  if (!secret) {
    console.error("MP_WEBHOOK_SECRET no configurado — rechazando webhook");
    return false;
  }

  const xSignature = req.headers.get("x-signature");
  const xRequestId = req.headers.get("x-request-id");

  // Si el secret está configurado pero MP no manda firma, rechazar
  if (!xSignature || !xRequestId) {
    console.error("MP webhook: secret configurado pero falta x-signature o x-request-id");
    return false;
  }

  // Parsear ts y v1 del header x-signature
  const parts = Object.fromEntries(
    xSignature.split(",").map(p => p.split("=") as [string, string])
  );
  const ts = parts["ts"];
  const v1 = parts["v1"];
  if (!ts || !v1) return false;

  // Template firmado por MP: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`;
  const expected = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  // Comparación segura para evitar timing attacks
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(v1));
  } catch {
    return false;
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();

  const topic = body.type || body.topic;
  const resourceId = body.data?.id || body.id;

  if (!topic || !resourceId) {
    return NextResponse.json({ ok: true }); // ping de validación
  }

  // Solo procesamos eventos de suscripciones
  if (topic !== "subscription_preapproval" && topic !== "preapproval") {
    return NextResponse.json({ ok: true });
  }

  // Validar firma
  if (!verifySignature(req, String(resourceId))) {
    console.error("MP webhook: firma inválida o ausente", { topic, resourceId });
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const isTest = process.env.MP_TEST_MODE === "true";
  const accessToken = isTest ? process.env.MP_ACCESS_TOKEN_TEST! : process.env.MP_ACCESS_TOKEN!;

  // Consultar estado real en MP
  const res = await fetch(`https://api.mercadopago.com/preapproval/${resourceId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });

  if (!res.ok) return NextResponse.json({ ok: true });

  const suscripcion = await res.json();
  const estado = suscripcion.status; // authorized, cancelled, paused, pending
  const payerEmail = suscripcion.payer_email;
  const userId = suscripcion.external_reference;

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const isPremium = estado === "authorized";

  if (userId) {
    await admin.from("profiles").update({
      is_premium: isPremium,
      mp_subscription_id: resourceId,
      mp_subscription_status: estado,
    }).eq("id", userId);
  } else if (payerEmail) {
    const { data: users } = await admin.auth.admin.listUsers();
    const user = users?.users?.find((u: any) => u.email === payerEmail);
    if (user) {
      await admin.from("profiles").update({
        is_premium: isPremium,
        mp_subscription_id: resourceId,
        mp_subscription_status: estado,
      }).eq("id", user.id);
    }
  }

  console.log(`MP webhook: user ${userId || "[por email]"} → ${estado} (premium: ${isPremium})`);
  return NextResponse.json({ ok: true });
}

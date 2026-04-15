import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data: profile } = await admin
    .from("profiles")
    .select("mp_subscription_id")
    .eq("id", user.id)
    .single();

  if (!profile?.mp_subscription_id) {
    return NextResponse.json({ error: "No tenés una suscripción activa" }, { status: 400 });
  }

  const isTest = process.env.MP_TEST_MODE === "true";
  const accessToken = isTest ? process.env.MP_ACCESS_TOKEN_TEST! : process.env.MP_ACCESS_TOKEN!;

  const res = await fetch(`https://api.mercadopago.com/preapproval/${profile.mp_subscription_id}`, {
    method: "PATCH",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: "cancelled" }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return NextResponse.json({ error: "No se pudo cancelar en MercadoPago", detail: err }, { status: 500 });
  }

  await admin.from("profiles").update({
    is_premium: false,
    mp_subscription_status: "cancelled",
  }).eq("id", user.id);

  return NextResponse.json({ ok: true });
}

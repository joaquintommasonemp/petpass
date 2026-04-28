import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const TRIAL_UNTIL = "2026-05-31T23:59:59.000Z";

export async function POST(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ ok: false });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ ok: false });

  // Solo activar si no tiene trial ni suscripción real
  const { data: profile } = await admin
    .from("profiles")
    .select("trial_until, is_premium, mp_subscription_status")
    .eq("id", user.id)
    .single();

  if (profile?.trial_until || profile?.mp_subscription_status === "authorized") {
    return NextResponse.json({ ok: true, skipped: true });
  }

  // Solo durante el período de lanzamiento
  if (new Date() > new Date(TRIAL_UNTIL)) {
    return NextResponse.json({ ok: false, expired: true });
  }

  await admin.from("profiles").update({
    is_premium: true,
    trial_until: TRIAL_UNTIL,
  }).eq("id", user.id);

  return NextResponse.json({ ok: true, activated: true });
}

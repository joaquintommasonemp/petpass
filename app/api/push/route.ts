import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

async function getUserFromToken(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const admin = adminClient();
  const { data: { user } } = await admin.auth.getUser(token);
  return user;
}

// POST — guardar suscripción push
export async function POST(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json();
  const { subscription } = body;
  if (!subscription?.endpoint) return NextResponse.json({ error: "Suscripción inválida" }, { status: 400 });

  const admin = adminClient();

  // Eliminar la misma suscripción si ya existe, luego insertar
  await admin.from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", subscription.endpoint);

  await admin.from("push_subscriptions").insert({
    user_id: user.id,
    subscription,
    endpoint: subscription.endpoint,
  });

  return NextResponse.json({ ok: true });
}

// DELETE — eliminar suscripción push
export async function DELETE(req: NextRequest) {
  const user = await getUserFromToken(req);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const endpoint = body.endpoint;

  const admin = adminClient();

  if (endpoint) {
    await admin
      .from("push_subscriptions")
      .delete()
      .eq("user_id", user.id)
      .eq("endpoint", endpoint);
  } else {
    await admin.from("push_subscriptions").delete().eq("user_id", user.id);
  }

  return NextResponse.json({ ok: true });
}

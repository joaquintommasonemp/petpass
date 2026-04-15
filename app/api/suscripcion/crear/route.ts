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

  const isTest = process.env.MP_TEST_MODE === "true";
  const planId = isTest ? process.env.MP_PLAN_ID_TEST! : process.env.MP_PLAN_ID!;

  // Guardar pending en profiles para relacionar el pago con el usuario cuando llegue el webhook
  await admin.from("profiles").update({ mp_subscription_status: "pending" }).eq("id", user.id);

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com";
  const backUrl = encodeURIComponent(`${appUrl}/premium/exito`);
  const url = `https://www.mercadopago.com.ar/subscriptions/checkout?preapproval_plan_id=${planId}&back_url=${backUrl}`;

  return NextResponse.json({ url });
}

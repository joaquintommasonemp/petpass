import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

let vapidConfigured = false;

function ensureVapid() {
  if (vapidConfigured) return;
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:petpass.app@gmail.com";

  if (!publicKey || !privateKey) {
    console.warn("[push] VAPID keys no configuradas — push notifications desactivadas");
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  vapidConfigured = true;
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  requireInteraction?: boolean;
}

/**
 * Envía una push notification a todos los dispositivos suscritos de un usuario.
 * Retorna la cantidad de notificaciones enviadas con éxito.
 */
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
  ensureVapid();
  if (!vapidConfigured) return 0;

  const admin = adminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, subscription, endpoint")
    .eq("user_id", userId);

  if (!subs || subs.length === 0) return 0;

  let sent = 0;
  const staleIds: string[] = [];

  for (const row of subs) {
    try {
      await webpush.sendNotification(row.subscription, JSON.stringify(payload));
      sent++;
    } catch (err: any) {
      // 404/410 = suscripción expirada o inválida → limpiar
      if (err.statusCode === 404 || err.statusCode === 410) {
        staleIds.push(row.id);
      }
    }
  }

  // Limpiar suscripciones inválidas
  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  return sent;
}

/**
 * Envía una push notification a múltiples usuarios.
 * Más eficiente que llamar sendPushToUser individualmente.
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; errors: number }> {
  ensureVapid();
  if (!vapidConfigured || userIds.length === 0) return { sent: 0, errors: 0 };

  const admin = adminClient();
  const { data: subs } = await admin
    .from("push_subscriptions")
    .select("id, user_id, subscription")
    .in("user_id", userIds);

  if (!subs || subs.length === 0) return { sent: 0, errors: 0 };

  let sent = 0;
  let errors = 0;
  const staleIds: string[] = [];

  await Promise.allSettled(
    subs.map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, JSON.stringify(payload));
        sent++;
      } catch (err: any) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          staleIds.push(row.id);
        } else {
          errors++;
        }
      }
    })
  );

  if (staleIds.length > 0) {
    await admin.from("push_subscriptions").delete().in("id", staleIds);
  }

  return { sent, errors };
}

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function DELETE(req: NextRequest) {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const admin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verificar identidad
  const { data: { user } } = await admin.auth.getUser(token);
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  // No permitir eliminar cuentas admin por esta vía
  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (profile?.is_admin) {
    return NextResponse.json({ error: "Las cuentas administradoras no pueden eliminarse desde aquí" }, { status: 403 });
  }

  const uid = user.id;

  try {
    // 1. Obtener IDs de mascotas del usuario para borrar datos dependientes
    const { data: mascotas } = await admin
      .from("mascotas")
      .select("id")
      .eq("user_id", uid);

    const mascotaIds = (mascotas || []).map((m: any) => m.id);

    // 2. Borrar datos dependientes de mascotas (en orden, de más específico a más general)
    if (mascotaIds.length > 0) {
      await Promise.all([
        admin.from("paseo_updates").delete().in("session_id",
          // Obtener IDs de sesiones para luego borrar updates
          (await admin.from("paseo_sessions").select("id").in("mascota_id", mascotaIds)).data?.map((s: any) => s.id) || []
        ),
        admin.from("estudio_links").delete().in("mascota_id", mascotaIds),
        admin.from("historial").delete().in("mascota_id", mascotaIds),
        admin.from("vacunas").delete().in("mascota_id", mascotaIds),
        admin.from("mascota_familia").delete().in("mascota_id", mascotaIds),
      ]);

      await admin.from("paseo_sessions").delete().in("mascota_id", mascotaIds);
      await admin.from("mascotas").delete().eq("user_id", uid);
    }

    // 3. Borrar datos directamente del usuario
    await Promise.all([
      admin.from("urgencias_contactos").delete().eq("user_id", uid),
      admin.from("perdidas").delete().eq("user_id", uid),
      admin.from("comunidad_mensajes").delete().eq("user_id", uid),
      admin.from("mascota_familia").delete().eq("user_id", uid), // accesos recibidos como familia
    ]);

    // 4. Borrar archivos de storage (best effort — no falla si no existen)
    if (mascotaIds.length > 0) {
      for (const mid of mascotaIds) {
        const { data: files } = await admin.storage.from("mascotas").list(mid);
        if (files && files.length > 0) {
          await admin.storage.from("mascotas").remove(files.map((f: any) => `${mid}/${f.name}`));
        }
        const { data: docs } = await admin.storage.from("documentos").list(mid);
        if (docs && docs.length > 0) {
          await admin.storage.from("documentos").remove(docs.map((f: any) => `${mid}/${f.name}`));
        }
      }
    }

    // 5. Borrar perfil
    await admin.from("profiles").delete().eq("id", uid);

    // 6. Eliminar usuario de Auth (debe ser lo último)
    const { error: deleteError } = await admin.auth.admin.deleteUser(uid);
    if (deleteError) {
      console.error("[eliminar-cuenta] Error deleting auth user:", deleteError.message);
      return NextResponse.json({ error: "Error al eliminar la cuenta de autenticación" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });

  } catch (e: any) {
    console.error("[eliminar-cuenta] Unexpected error:", e?.message);
    return NextResponse.json({ error: "Error interno al eliminar la cuenta" }, { status: 500 });
  }
}

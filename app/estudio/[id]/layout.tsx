import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const db = adminClient();

  const { data: link } = await db
    .from("estudio_links")
    .select("mascota_id, active")
    .eq("id", params.id)
    .single();

  if (!link?.active) {
    return { title: "Portal de estudios" };
  }

  const { data: mascota } = await db
    .from("mascotas")
    .select("name, breed, photo_url")
    .eq("id", link.mascota_id)
    .single();

  if (!mascota) {
    return { title: "Portal de estudios" };
  }

  const title = `🔬 Subir estudio de ${mascota.name}`;
  const description = `Portal seguro para enviar estudios, análisis y radiografías de ${mascota.name}${mascota.breed ? ` (${mascota.breed})` : ""} directamente al historial clínico digital.`;
  const images = mascota.photo_url
    ? [{ url: mascota.photo_url, width: 400, height: 400, alt: mascota.name }]
    : [];

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
    twitter: {
      card: mascota.photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: mascota.photo_url ? [mascota.photo_url] : [],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

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
  const { data } = await db
    .from("mascotas")
    .select("name, breed, age, sex, photo_url")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  if (!data) {
    return { title: "Perfil de mascota" };
  }

  const parts = [data.breed, data.age, data.sex].filter(Boolean).join(" · ");
  const title = `🐾 ${data.name} — Perfil PetPass`;
  const description = parts
    ? `${parts} — Conocé el historial clínico digital de ${data.name} en PetPass.`
    : `Conocé el historial clínico digital de ${data.name} en PetPass.`;
  const images = data.photo_url
    ? [{ url: data.photo_url, width: 400, height: 400, alt: data.name }]
    : [];

  return {
    title,
    description,
    openGraph: { title, description, images, type: "profile" },
    twitter: {
      card: data.photo_url ? "summary_large_image" : "summary",
      title,
      description,
      images: data.photo_url ? [data.photo_url] : [],
    },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || "").replace(/\s+/g, ""),
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function generateMetadata(
  { params }: { params: { id: string } }
): Promise<Metadata> {
  const db = adminClient();
  const { data } = await db
    .from("mascotas")
    .select("name, breed, age, photo_url")
    .eq("id", params.id)
    .single();

  if (!data) {
    return { title: "Carnet digital" };
  }

  const title = `🪪 Carnet de ${data.name}`;
  const description = `${data.breed || "Mascota"}${data.age ? ` · ${data.age}` : ""} — Carnet digital verificado por PetPass. Vacunas, chip y QR de identificación.`;
  const images = data.photo_url
    ? [{ url: data.photo_url, width: 400, height: 400, alt: data.name }]
    : [];

  return {
    title,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title,
      description,
      images,
      type: "website",
    },
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

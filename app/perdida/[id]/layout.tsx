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
    .from("perdidas")
    .select("pet_name, breed, zone, photo_url")
    .eq("id", params.id)
    .eq("active", true)
    .single();

  if (!data) {
    return { title: "Mascota perdida" };
  }

  const title = `🚨 Se perdió ${data.pet_name}${data.zone ? ` en ${data.zone}` : ""}`;
  const description = `${data.breed || "Mascota"} extraviada. Si la viste, avisá. Tu avistamiento puede ayudar a encontrarla.`;
  const images = data.photo_url
    ? [{ url: data.photo_url, width: 400, height: 400, alt: data.pet_name }]
    : [];

  return {
    title,
    description,
    robots: { index: true, follow: true },
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

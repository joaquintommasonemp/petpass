import type { Metadata, Viewport } from "next";
import "./globals.css";
import SWRegister from "@/components/SWRegister";
import { Analytics } from "@vercel/analytics/next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://mipetpass.com";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: "PetPass — La app para el día a día de tu mascota",
    template: "%s | PetPass",
  },
  description:
    "Gratis hasta el 31/05 · La app para el día a día de tu mascota. Historial clínico, vacunas, Vet IA 24/7, carnet QR y mucho más.",
  keywords: [
    "mascota",
    "veterinaria",
    "historial clínico",
    "vacunas",
    "perro",
    "gato",
    "carnet digital",
    "mascota perdida",
    "pasaporte mascota",
    "vet ia",
    "cuidado mascotas",
    "paseadores",
    "guardería mascotas",
    "adopción mascotas",
    "Argentina",
  ],
  authors: [{ name: "PetPass" }],
  creator: "PetPass",
  publisher: "PetPass",
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: "website",
    siteName: "PetPass",
    title: "PetPass 🐾 — Gratis hasta el 31/05 · Sin tarjeta",
    description:
      "La app para el día a día de tu mascota. Historial clínico, Vet IA 24/7, carnet QR y más. Gratis hasta el 31/05, sin tarjeta.",
    images: [{ url: "/og-image.png", width: 1024, height: 1024, alt: "PetPass — El pasaporte digital de tu mascota" }],
    locale: "es_AR",
    url: BASE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "PetPass 🐾 — Gratis hasta el 31/05 · Sin tarjeta",
    description: "La app para el día a día de tu mascota. Historial, Vet IA 24/7, carnet QR y más. Gratis hasta el 31/05.",
    images: ["/og-image.png"],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "PetPass",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  alternates: {
    canonical: BASE_URL,
  },
};

export const viewport: Viewport = {
  themeColor: "#2CB8AD",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
        <SWRegister />
        <Analytics />
      </body>
    </html>
  );
}

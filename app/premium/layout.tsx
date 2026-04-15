import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Premium",
  description: "Activá PetPass Premium y accedé a consultas IA ilimitadas, análisis de estudios y soporte prioritario para el cuidado de tu mascota.",
  openGraph: {
    title: "PetPass Premium 🐾",
    description: "Consultas IA ilimitadas, análisis de estudios y más por $3.000/mes.",
  },
  robots: { index: false, follow: false },
};

export default function PremiumLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

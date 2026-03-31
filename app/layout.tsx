import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PetPass 🐾",
  description: "El documento de identidad digital de tu mascota",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

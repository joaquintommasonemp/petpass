import Link from "next/link";

export const metadata = { title: "Política de Privacidad — PetPass" };

export default function Privacidad() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px", background: "#F4F6FB", minHeight: "100vh" }}>

      <Link href="/" style={{ display: "inline-block", marginBottom: 32 }}>
        <img src="/logo-brand-official.png" alt="PetPass" style={{ height: 48, objectFit: "contain" }} />
      </Link>

      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "36px 32px", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(28,53,87,0.06)" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C3557", marginBottom: 6 }}>Política de Privacidad</h1>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 4 }}>Última actualización: abril 2025</p>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 32 }}>
          Conforme a la <strong>Ley 25.326 de Protección de Datos Personales</strong> de la República Argentina.
        </p>

        {[
          {
            titulo: "1. Responsable del tratamiento",
            texto: `PetPass es responsable del tratamiento de tus datos personales. Podés contactarnos en petpass.app@gmail.com para cualquier consulta relacionada con tus datos.`,
          },
          {
            titulo: "2. Datos que recopilamos",
            items: [
              "Datos de registro: nombre, apellido, email, teléfono (opcional).",
              "Datos de mascotas: nombre, raza, edad, peso, sexo, chip, fotos, ubicación, historial médico, vacunas, diagnósticos.",
              "Datos de uso: consultas a la IA veterinaria, mensajes en la comunidad, alertas de mascotas perdidas.",
              "Datos técnicos: dirección IP, tipo de dispositivo, navegador (a través de Supabase y Vercel).",
            ],
          },
          {
            titulo: "3. Finalidad del tratamiento",
            items: [
              "Proveer y mejorar los servicios de PetPass.",
              "Gestionar tu cuenta y tus mascotas.",
              "Procesar consultas de IA veterinaria (los datos se envían a Anthropic Claude API).",
              "Mostrar alertas de mascotas perdidas a otros usuarios de la plataforma.",
              "Enviarte comunicaciones relevantes sobre tu cuenta.",
            ],
          },
          {
            titulo: "4. Terceros que procesan tus datos",
            texto: `Para operar PetPass, tus datos son procesados por los siguientes proveedores con medidas de seguridad adecuadas:`,
            items: [
              "Supabase Inc. (base de datos y almacenamiento) — Política: supabase.com/privacy",
              "Anthropic PBC (IA veterinaria) — solo recibe historial de la mascota, no datos personales del dueño — Política: anthropic.com/privacy",
              "Vercel Inc. (infraestructura) — Política: vercel.com/legal/privacy-policy",
            ],
          },
          {
            titulo: "5. Datos públicos y privados",
            texto: `Algunos datos son visibles públicamente si vos lo elegís: el perfil público de tu mascota (cuando activás el QR) incluye nombre, raza, foto y teléfono de contacto. Las alertas de mascotas perdidas son visibles para todos los usuarios. Los mensajes de la comunidad son visibles para usuarios registrados. El historial médico y documentos clínicos son privados y solo accesibles por vos y quienes vos autoricés.`,
          },
          {
            titulo: "6. Conservación de datos",
            texto: `Conservamos tus datos mientras tu cuenta esté activa. Al eliminar tu cuenta, tus datos personales se borran en un plazo de 30 días, excepto los que debamos conservar por obligaciones legales.`,
          },
          {
            titulo: "7. Tus derechos (Ley 25.326)",
            items: [
              "Acceso: podés solicitar una copia de tus datos en cualquier momento.",
              "Rectificación: podés corregir datos inexactos.",
              "Supresión: podés solicitar la eliminación de tus datos.",
              "Oposición: podés oponerte a ciertos usos de tus datos.",
            ],
            cierre: "Para ejercer estos derechos, escribinos a petpass.app@gmail.com. Respondemos en un plazo máximo de 5 días hábiles.",
          },
          {
            titulo: "8. Seguridad",
            texto: `Implementamos medidas técnicas y organizativas para proteger tus datos: conexiones cifradas (HTTPS/TLS), almacenamiento seguro en Supabase con Row Level Security, claves de API almacenadas en variables de entorno seguras, y acceso administrativo protegido por autenticación.`,
          },
          {
            titulo: "9. Menores de edad",
            texto: `PetPass no está dirigido a menores de 18 años. Si tenés menos de 18 años, necesitás el consentimiento de un adulto responsable para usar el servicio. Si detectamos cuentas de menores sin autorización, las eliminaremos.`,
          },
          {
            titulo: "10. Cookies",
            texto: `PetPass utiliza cookies de sesión estrictamente necesarias para el funcionamiento del servicio (autenticación de Supabase). No usamos cookies de publicidad ni rastreo de terceros con fines comerciales.`,
          },
          {
            titulo: "11. Cambios en esta política",
            texto: `Podemos actualizar esta Política. Te avisaremos por email ante cambios importantes. La versión vigente siempre estará disponible en petpass.app/privacidad.`,
          },
          {
            titulo: "12. Contacto y reclamos",
            texto: `Para consultas sobre privacidad: petpass.app@gmail.com. Si considerás que tus derechos fueron vulnerados, podés presentar un reclamo ante la Agencia de Acceso a la Información Pública (AAIP) de Argentina: www.argentina.gob.ar/aaip.`,
          },
        ].map(s => (
          <div key={s.titulo} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1C3557", marginBottom: 8 }}>{s.titulo}</h2>
            {s.texto && <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginBottom: s.items ? 8 : 0 }}>{s.texto}</p>}
            {s.items && (
              <ul style={{ paddingLeft: 20, margin: 0 }}>
                {s.items.map(item => (
                  <li key={item} style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginBottom: 4 }}>{item}</li>
                ))}
              </ul>
            )}
            {(s as any).cierre && <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8, marginTop: 8 }}>{(s as any).cierre}</p>}
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/terminos" style={{ color: "#2CB8AD", fontSize: 13, fontWeight: 700, textDecoration: "none", marginRight: 20 }}>Términos y Condiciones</Link>
        <Link href="/" style={{ color: "#64748B", fontSize: 13, textDecoration: "none" }}>Volver al inicio</Link>
      </div>
    </main>
  );
}

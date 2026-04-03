import Link from "next/link";

export const metadata = { title: "Términos y Condiciones — PetPass" };

export default function Terminos() {
  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: "40px 24px 80px", background: "#F4F6FB", minHeight: "100vh" }}>

      <Link href="/" style={{ display: "inline-block", marginBottom: 32 }}>
        <img src="/logo.png" alt="PetPass" style={{ height: 40, objectFit: "contain" }} />
      </Link>

      <div style={{ background: "#FFFFFF", borderRadius: 20, padding: "36px 32px", border: "1px solid #E2E8F0", boxShadow: "0 2px 12px rgba(28,53,87,0.06)" }}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: "#1C3557", marginBottom: 6 }}>Términos y Condiciones</h1>
        <p style={{ color: "#64748B", fontSize: 13, marginBottom: 32 }}>Última actualización: abril 2025</p>

        {[
          {
            titulo: "1. Aceptación",
            texto: `Al crear una cuenta en PetPass, aceptás estos Términos y Condiciones en su totalidad. Si no estás de acuerdo con alguna parte, no debés usar el servicio. El uso de PetPass está permitido únicamente para mayores de 18 años o menores con supervisión de un adulto responsable.`,
          },
          {
            titulo: "2. Descripción del servicio",
            texto: `PetPass es una plataforma digital de gestión de salud animal que permite a los usuarios registrar mascotas, llevar un historial médico digital, acceder a una herramienta de orientación veterinaria basada en inteligencia artificial, publicar alertas de mascotas perdidas, compartir actualizaciones con cuidadores y conectarse con una comunidad de dueños de mascotas.`,
          },
          {
            titulo: "3. Aviso médico importante",
            texto: `La herramienta "Vet IA" de PetPass es un servicio de orientación informativa y NO constituye consulta veterinaria profesional. Las respuestas generadas por inteligencia artificial son de carácter orientativo y NO reemplazan el diagnóstico, tratamiento ni prescripción de un médico veterinario matriculado. Ante cualquier urgencia o duda sobre la salud de tu mascota, debés consultar inmediatamente con un veterinario profesional. PetPass no asume responsabilidad por decisiones tomadas en base exclusivamente a las sugerencias de la IA.`,
          },
          {
            titulo: "4. Datos del usuario",
            texto: `Los datos que ingresás en PetPass (nombre, email, teléfono, información de tus mascotas) son tratados conforme a nuestra Política de Privacidad y la Ley 25.326 de Protección de Datos Personales de Argentina. No vendemos ni compartimos tus datos con terceros con fines comerciales. Tenés derecho a acceder, rectificar y eliminar tus datos en cualquier momento escribiendo a petpass.app@gmail.com.`,
          },
          {
            titulo: "5. Uso aceptable",
            texto: `Te comprometés a usar PetPass de manera lícita y a no publicar contenido falso, ofensivo, fraudulento o que viole derechos de terceros. Queda prohibido usar la plataforma para acoso, spam, phishing o cualquier actividad ilegal. PetPass se reserva el derecho de suspender cuentas que violen estas condiciones.`,
          },
          {
            titulo: "6. Contenido publicado",
            texto: `Sos responsable del contenido que publicás (fotos, mensajes, alertas de mascotas perdidas). Al publicar contenido en PetPass, nos otorgás una licencia no exclusiva para mostrarlo en la plataforma con el único propósito de operar el servicio. No reclamamos propiedad sobre tu contenido.`,
          },
          {
            titulo: "7. Disponibilidad del servicio",
            texto: `PetPass se brinda "tal cual está" sin garantías de disponibilidad continua. Podemos realizar mantenimientos, actualizaciones o interrupciones del servicio con o sin previo aviso. No somos responsables por pérdidas derivadas de interrupciones del servicio.`,
          },
          {
            titulo: "8. Plan gratuito y Premium",
            texto: `PetPass ofrece funcionalidades gratuitas con límites de uso (por ejemplo, 5 consultas de IA por mes). Las funcionalidades Premium se ofrecen mediante pago. Los precios y condiciones del plan Premium se informan en la plataforma y pueden cambiar con aviso previo.`,
          },
          {
            titulo: "9. Modificaciones",
            texto: `Podemos actualizar estos Términos en cualquier momento. Te notificaremos por email o mediante aviso en la plataforma ante cambios materiales. El uso continuado del servicio después de los cambios implica aceptación de los nuevos términos.`,
          },
          {
            titulo: "10. Ley aplicable",
            texto: `Estos Términos se rigen por las leyes de la República Argentina. Cualquier disputa será resuelta ante los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.`,
          },
          {
            titulo: "11. Contacto",
            texto: `Para consultas sobre estos Términos o tu cuenta, escribinos a petpass.app@gmail.com.`,
          },
        ].map(s => (
          <div key={s.titulo} style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: "#1C3557", marginBottom: 8 }}>{s.titulo}</h2>
            <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.8 }}>{s.texto}</p>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link href="/privacidad" style={{ color: "#2CB8AD", fontSize: 13, fontWeight: 700, textDecoration: "none", marginRight: 20 }}>Política de Privacidad</Link>
        <Link href="/" style={{ color: "#64748B", fontSize: 13, textDecoration: "none" }}>Volver al inicio</Link>
      </div>
    </main>
  );
}

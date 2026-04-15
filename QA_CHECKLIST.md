# PetPass — Checklist de QA

Corré esta lista antes de cada deploy importante o cuando modifiques una sección.
Marcá ✅ cuando pasa, ❌ si falla (anotá qué pasó), ⏭️ si no aplica en ese deploy.

---

## 🔐 Auth

### Registro
- [ ] Email nuevo → redirige a pantalla de "revisá tu email"
- [ ] Email ya registrado → muestra error claro
- [ ] Intentar login antes de confirmar email → muestra "cuenta no verificada" con botón de reenvío
- [ ] Botón "Reenviar confirmación" → llega el email

### Login
- [ ] Credenciales correctas → va al dashboard (o al onboarding si es primera vez)
- [ ] Contraseña incorrecta → muestra error, no queda en loop de carga
- [ ] Email que no existe → muestra error genérico (no revela si el email existe)

### Recuperar contraseña
- [ ] "¿Olvidaste tu contraseña?" → modal aparece
- [ ] Ingresar email y enviar → llega email con link de reset
- [ ] Abrir link del email → va a `/reset-password`
- [ ] Ingresar nueva contraseña → redirige al dashboard
- [ ] Intentar usar el mismo link de reset una segunda vez → no funciona (token expirado/usado)

### Onboarding
- [ ] Primer login → muestra wizard de bienvenida (3 pasos)
- [ ] "Saltar" → va al dashboard y no vuelve a aparecer el onboarding
- [ ] "Agregar mi primera mascota" → va a `/mascota/nueva`
- [ ] Recarga del dashboard → onboarding no reaparece

---

## 🐾 Mascotas

### Crear
- [ ] Formulario completo → mascota aparece en el dashboard
- [ ] Subir foto → se muestra en la card de la mascota
- [ ] Sin foto → se muestra placeholder/emoji, no da error

### Editar
- [ ] Cambiar nombre/datos → se guarda y refleja al volver al dashboard
- [ ] Cambiar foto → nueva foto aparece inmediatamente

### Estado
- [ ] Toggle "pública" → el carnet `/carnet/[id]` es accesible sin login
- [ ] Toggle "privada" → el carnet dice que la mascota es privada
- [ ] Dar de baja mascota → desaparece del dashboard, no aparece en comunidad

### Familia
- [ ] Generar link de acceso familiar → link es único y funciona
- [ ] Abrir link en otra cuenta → agrega la mascota como "compartida"
- [ ] Miembro de familia puede ver historial pero no editar datos principales

---

## 📋 Historial Clínico

### Consultas / Entradas
- [ ] Crear entrada (título + fecha + resumen) → aparece en el listado
- [ ] Buscar por texto → filtra correctamente
- [ ] Editar entrada → cambios se guardan
- [ ] Eliminar entrada → desaparece del listado

### Vacunas
- [ ] Agregar vacuna (nombre + fecha) → aparece en la lista
- [ ] Vacuna con próxima dosis → aparece en el dashboard como recordatorio
- [ ] Vacuna vencida → se muestra badge de vencida

### Alimentación
- [ ] Agregar alimento (marca + frecuencia) → aparece en el listado
- [ ] La IA del chat puede mencionar el alimento registrado en sus respuestas

### Documentos / Estudios
- [ ] Subir PDF → se guarda y aparece en la lista
- [ ] Subir imagen (JPG/PNG) → se guarda y muestra miniatura
- [ ] IA genera resumen del documento al subirlo
- [ ] Botón "Analizar estudios" en el chat → envía los docs a la IA

### Link de estudio para veterinario
- [ ] Generar link de estudio → URL es única
- [ ] Abrir URL sin login → muestra formulario para que el vet suba archivo
- [ ] Vet sube archivo → IA lo analiza y el resumen aparece en el historial de la mascota

### Compartir historial (con vencimiento)
- [ ] Generar link (1 día / 7 días / 30 días) → URL es única
- [ ] Abrir URL sin login antes de vencer → muestra historial completo
- [ ] Abrir URL vencida → muestra mensaje de "link expirado"
- [ ] Revocar link → URL deja de funcionar inmediatamente
- [ ] El historial muestra: mascota, consultas, vacunas, alimentación

---

## 🤖 Vet IA (Chat)

### Funcionalidad básica
- [ ] Enviar mensaje → responde con contexto de la mascota (menciona el nombre)
- [ ] La respuesta usa datos del historial (vacunas, peso, etc.)
- [ ] Chat persiste al recargar la página (localStorage)
- [ ] "Nueva conversación" → limpia el chat y vuelve al saludo

### Análisis de imagen
- [ ] Subir foto desde el botón 📷 → preview aparece antes de enviar
- [ ] Enviar con foto → IA describe lo que ve en la imagen
- [ ] Cancelar imagen → preview desaparece, no se envía

### Análisis de documentos
- [ ] Botón "Estudios" con documentos cargados → IA analiza y responde
- [ ] Sin documentos → mensaje explicativo, no rompe

### Límite freemium
- [ ] Usuario free: mensajes 1-5 funcionan normalmente
- [ ] Mensaje 5 muestra contador "1 consulta gratis restante"
- [ ] Mensaje 6 → aparece modal de upgrade, NO se hace la llamada a la API
- [ ] Después del límite: input deshabilitado, placeholder cambia
- [ ] Usuario premium: sin límite, banner muestra "Consultas ilimitadas"

### Solicitud premium
- [ ] Botón "Solicitar Premium" → muestra confirmación de envío
- [ ] La solicitud aparece en el panel admin como "pendiente"

---

## 📍 Mascotas Perdidas

- [ ] "Reportar perdida" → formulario con campos básicos + geolocalización
- [ ] Subir fotos → aparecen en el reporte publicado
- [ ] Reporte aparece en el listado de pérdidas activas
- [ ] Abrir URL `/perdida/[id]` sin login → muestra la alerta pública
- [ ] Desde `/perdida/[id]`: reportar avistamiento → guarda el mensaje
- [ ] Tab "Encontradas": reportar mascota encontrada funciona igual
- [ ] Admin puede ver pérdidas activas en el panel

---

## ❤️ Adopciones

- [ ] Crear publicación de adopción (nombre, zona, foto, descripción) → aparece en el listado
- [ ] Otro usuario puede postularse → recibe confirmación
- [ ] El dueño ve las postulaciones recibidas
- [ ] Marcar como adoptada → desaparece del listado activo

---

## 👥 Comunidad

### Mural
- [ ] Publicar mensaje de texto → aparece en el mural
- [ ] Publicar con foto → imagen se muestra en el mensaje
- [ ] Los mensajes con `SOLICITUD:` no aparecen en el mural público

### Profesionales
- [ ] Registrar perfil (nombre, especialidad, zona) → aparece en el directorio
- [ ] Solo el propio usuario ve los botones "Editar" y "Dar de baja"
- [ ] Editar perfil → cambios se reflejan inmediatamente
- [ ] "Dar de baja" → perfil desaparece del directorio
- [ ] Profesional verificado muestra badge ✅

### Descuentos / Solicitudes de negocio
- [ ] Formulario "Quiero aparecer" → se guarda en `solicitudes_descuento`
- [ ] Aparece en el panel admin como solicitud pendiente

---

## 🏃 Paseos

- [ ] Iniciar sesión de paseo → genera link único
- [ ] Abrir link sin login → muestra la sesión activa
- [ ] Cuidador envía mensaje/foto → aparece en tiempo real
- [ ] Historial del paseo persiste al recargar

---

## 🪪 Carnet Digital

- [ ] `/carnet/[id]` muestra datos correctos de la mascota
- [ ] QR en el carnet apunta a la URL correcta
- [ ] Botón imprimir funciona
- [ ] Mascota privada → carnet no muestra datos sensibles

---

## 🗑️ Eliminar cuenta

- [ ] Confirmar eliminación → borra mascotas, historial, vacunas, documentos
- [ ] Archivos en Storage también se eliminan
- [ ] Sesión termina y redirige a login
- [ ] Intentar login con la cuenta eliminada → no funciona

---

## 🛡️ Panel Admin

### Acceso
- [ ] Usuario sin `is_admin = true` → ve "Acceso denegado"
- [ ] Sin sesión → redirige a login
- [ ] Admin legítimo → carga el panel con datos

### Funcionalidades
- [ ] Tab Mascotas: buscar por nombre/usuario funciona
- [ ] Filtros activo/inactivo funcionan
- [ ] Tab Solicitudes: muestra solicitudes de premium y descuento
- [ ] Aprobar solicitud premium → ese usuario queda con `is_premium = true` en la DB
- [ ] Rechazar solicitud → estado cambia a "rechazado" en la lista
- [ ] Tab Sugerencias: muestra los mensajes con `author_name = 'SUGERENCIA'`
- [ ] Tab Stats: muestra conteos correctos
- [ ] Tab Vet IA: muestra gráfico de uso y ranking de usuarios

---

## 📧 Emails (Cron)

- [ ] Cron `/api/cron/vacunas` se ejecuta (verificar en logs de Vercel)
- [ ] Usuario con vacuna vencida recibe email de recordatorio
- [ ] El email tiene el nombre de la mascota y la vacuna

---

## 📱 Responsive / UX

- [ ] Login/registro se ven bien en mobile (< 400px)
- [ ] Dashboard es usable en mobile
- [ ] Chat: el input no queda tapado por el teclado en iOS/Android
- [ ] Modales se pueden cerrar en mobile (tap fuera o botón X)
- [ ] Las fotos se comprimen antes de subir (no tarda demasiado)

---

## ⚡ Casos borde importantes

- [ ] Abrir el chat sin tener mascotas registradas → mensaje de "no tenés mascotas"
- [ ] Intentar ver `/historial/token-inventado` → error claro, no datos vacíos
- [ ] Intentar acceder a `/admin` con token vencido → redirige a login
- [ ] Subir archivo que no es PDF ni imagen como estudio → maneja el error
- [ ] Link de historial compartido de otra persona → no muestra los datos

---

## 🔁 Cómo usar este checklist

1. Antes de un deploy que toque **Auth** → corré solo la sección Auth
2. Antes de un deploy que toque el **Chat** → corré Auth + Vet IA + Freemium
3. Antes de un **deploy general** → corré todo (tarda ~30 min)
4. Si algo falla: anotá en qué paso, qué viste vs qué esperabas

---

*Última actualización: 2026-04-09*

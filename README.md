# PetPass 🐾
El documento de identidad digital de tu mascota.

## Stack
- **Frontend:** Next.js 14 + TypeScript
- **Base de datos:** Supabase (auth + DB)
- **IA veterinaria:** Claude (Anthropic)
- **Mapa:** Leaflet + OpenStreetMap
- **Hosting:** Vercel (gratis)

## Deploy en Vercel

### 1. Subir a GitHub
```bash
git init
git add .
git commit -m "PetPass v1"
git remote add origin https://github.com/TU_USUARIO/petpass.git
git push -u origin main
```

### 2. Deploy en Vercel
1. Entrá a vercel.com
2. "Add New Project" → importá el repo petpass
3. En "Environment Variables" agregá:
   - `NEXT_PUBLIC_SUPABASE_URL` = https://amyosmkbldgdxuqepxqu.supabase.co
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = tu anon key de Supabase
   - `ANTHROPIC_API_KEY` = tu API key de Anthropic
4. Click "Deploy"

### 3. Obtener API Key de Anthropic
1. Entrá a console.anthropic.com
2. Settings → API Keys → Create Key
3. Copiá la clave y pegala en Vercel

## Funcionalidades v1
- ✅ Registro e inicio de sesión
- ✅ Perfil completo de mascota con QR
- ✅ Historia clínica con carga de documentos
- ✅ Chat IA veterinaria personalizada
- ✅ Mascotas perdidas con mapa
- ✅ Adopciones

## Estructura del proyecto
```
petpass/
├── app/
│   ├── page.tsx              # Landing
│   ├── login/page.tsx        # Login
│   ├── registro/page.tsx     # Registro
│   ├── mascota/nueva/        # Nueva mascota
│   ├── dashboard/
│   │   ├── page.tsx          # Perfil
│   │   ├── historial/        # Historia clínica
│   │   ├── chat/             # IA veterinaria
│   │   ├── perdidas/         # Mascotas perdidas
│   │   └── adopciones/       # Adopciones
│   └── api/chat/route.ts     # API Claude
├── components/
│   └── MapComponent.tsx      # Mapa Leaflet
└── lib/
    └── supabase.ts           # Cliente Supabase
```

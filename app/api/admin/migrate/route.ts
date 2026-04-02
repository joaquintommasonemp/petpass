import { NextRequest, NextResponse } from "next/server";
import { Pool } from "pg";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-migrate-secret");
  if (secret !== "petpass-migrate-2025") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    return NextResponse.json({
      error: "DATABASE_URL no configurada. Agregala en Vercel con el valor de Supabase > Settings > Database > URI",
    }, { status: 500 });
  }

  const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
  const results: Record<string, string> = {};

  try {
    const client = await pool.connect();

    // Crear tabla citas
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.citas (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        mascota_id uuid REFERENCES public.mascotas(id) ON DELETE CASCADE,
        date text NOT NULL,
        summary text NOT NULL,
        vet text,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`ALTER TABLE public.citas ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='citas' AND policyname='citas_owner') THEN
          CREATE POLICY citas_owner ON public.citas
            USING (mascota_id IN (SELECT id FROM mascotas WHERE user_id = auth.uid()));
        END IF;
      END $$;
    `);
    results.citas = "creada OK";

    // Crear tabla profesionales
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.profesionales (
        id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
        nombre text NOT NULL,
        especialidad text NOT NULL DEFAULT 'Veterinario',
        descripcion text,
        zona text,
        telefono text,
        instagram text,
        email text,
        foto_url text,
        active boolean DEFAULT true,
        created_at timestamptz DEFAULT now()
      );
    `);
    await client.query(`ALTER TABLE public.profesionales ENABLE ROW LEVEL SECURITY;`);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profesionales' AND policyname='pro_public_read') THEN
          CREATE POLICY pro_public_read ON public.profesionales FOR SELECT USING (true);
          CREATE POLICY pro_service_write ON public.profesionales USING (auth.role() = 'service_role');
        END IF;
      END $$;
    `);
    results.profesionales = "creada OK";

    client.release();
    await pool.end();

    return NextResponse.json({ ok: true, results });
  } catch (e: any) {
    await pool.end().catch(() => {});
    return NextResponse.json({ error: e.message, results }, { status: 500 });
  }
}

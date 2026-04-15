-- Migración: sacar solicitudes de comunidad_mensajes a tablas propias
-- Ejecutar en Supabase Dashboard > SQL Editor

-- 1. Tabla para solicitudes de descuento de negocios
CREATE TABLE IF NOT EXISTS solicitudes_descuento (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        REFERENCES profiles(id) ON DELETE SET NULL,
  nombre      text        NOT NULL,
  rubro       text,
  email       text        NOT NULL,
  descuento   text,
  estado      text        NOT NULL DEFAULT 'pendiente',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE solicitudes_descuento ENABLE ROW LEVEL SECURITY;

CREATE POLICY sd_insert ON solicitudes_descuento
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 2. Tabla para solicitudes de upgrade a premium
CREATE TABLE IF NOT EXISTS solicitudes_premium (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  email       text,
  estado      text        NOT NULL DEFAULT 'pendiente',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

ALTER TABLE solicitudes_premium ENABLE ROW LEVEL SECURITY;

CREATE POLICY sp_insert ON solicitudes_premium
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 3. (Opcional) Índices para queries del panel admin
CREATE INDEX IF NOT EXISTS idx_sol_descuento_estado ON solicitudes_descuento(estado);
CREATE INDEX IF NOT EXISTS idx_sol_premium_estado   ON solicitudes_premium(estado);

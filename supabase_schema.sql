-- =====================================================================
-- CORRAL ABIERTO - MIGRACIÓN MULTI-RODEOS
-- Ejecuta este script en el SQL Editor de tu panel de Supabase
-- =====================================================================

-- 1. Crear tabla de rodeos
CREATE TABLE IF NOT EXISTS rodeos (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL,
    activo BOOLEAN DEFAULT true,
    logo_url TEXT DEFAULT '',
    toro1 BOOLEAN DEFAULT true,
    toro2 BOOLEAN DEFAULT true,
    toro3 BOOLEAN DEFAULT true,
    toro4 BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Si la tabla 'rodeos' ya existía de antes, agregamos las columnas nuevas
ALTER TABLE rodeos ADD COLUMN IF NOT EXISTS toro1 BOOLEAN DEFAULT true;
ALTER TABLE rodeos ADD COLUMN IF NOT EXISTS toro2 BOOLEAN DEFAULT true;
ALTER TABLE rodeos ADD COLUMN IF NOT EXISTS toro3 BOOLEAN DEFAULT true;
ALTER TABLE rodeos ADD COLUMN IF NOT EXISTS toro4 BOOLEAN DEFAULT true;

-- Habilitar RLS en rodeos y permitir lectura pública / escritura admin
ALTER TABLE rodeos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura pública de rodeos" ON rodeos;
CREATE POLICY "Permitir lectura pública de rodeos" ON rodeos 
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir todo a administradores de rodeos" ON rodeos;
CREATE POLICY "Permitir todo a administradores de rodeos" ON rodeos 
    FOR ALL USING (true);

-- 2. Modificar tabla de colleras para vincularlas a un rodeo
ALTER TABLE colleras ADD COLUMN IF NOT EXISTS rodeo_id TEXT DEFAULT 'champion-chile-2026';

-- Sembrar rodeos iniciales por defecto si no existen
INSERT INTO rodeos (id, nombre, activo, logo_url, toro1, toro2, toro3, toro4) 
VALUES 
('champion-chile-2026', 'Champion de Chile 2026', true, 'https://www.caballoyrodeo.cl/portal_rodeo/imag/logo-rodeo.png', true, true, true, true),
('clasificatorio-sur-2026', 'Clasificatorio Sur 2026', false, '', true, true, true, true),
('clasificatorio-centro-2026', 'Clasificatorio Centro 2026', false, '', true, true, true, true),
('clasificatorio-norte-2026', 'Clasificatorio Norte 2026', false, '', true, true, true, true)
ON CONFLICT (id) DO NOTHING;

-- 3. Crear tabla de suscriptores para recibir alertas SMS
CREATE TABLE IF NOT EXISTS sms_subscribers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    telefono TEXT NOT NULL UNIQUE,
    nombre TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en sms_subscribers
ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir inserción pública" ON sms_subscribers;
CREATE POLICY "Permitir inserción pública" ON sms_subscribers 
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir lectura a administradores" ON sms_subscribers;
CREATE POLICY "Permitir lectura a administradores" ON sms_subscribers 
    FOR SELECT USING (true);


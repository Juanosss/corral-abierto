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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
INSERT INTO rodeos (id, nombre, activo, logo_url) 
VALUES 
('champion-chile-2026', 'Champion de Chile 2026', true, 'https://www.caballoyrodeo.cl/portal_rodeo/imag/logo-rodeo.png'),
('clasificatorio-sur-2026', 'Clasificatorio Sur 2026', false, ''),
('clasificatorio-centro-2026', 'Clasificatorio Centro 2026', false, ''),
('clasificatorio-norte-2026', 'Clasificatorio Norte 2026', false, '')
ON CONFLICT (id) DO NOTHING;

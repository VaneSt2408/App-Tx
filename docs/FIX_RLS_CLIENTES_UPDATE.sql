-- Script SQL para arreglar políticas RLS de la tabla clientes
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar políticas existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'clientes';

-- 2. Habilitar RLS si no está habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 3. Crear política para UPDATE (la que falta)
CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 4. Verificar que la política se creó
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clientes' 
AND policyname = 'Clientes pueden actualizar su perfil';

-- 5. Probar que funciona
-- (Opcional) Probar actualización manual
-- UPDATE clientes SET nombre_completo = 'Test' WHERE id = auth.uid();

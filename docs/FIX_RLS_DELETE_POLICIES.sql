-- Script simplificado para agregar políticas RLS de eliminación
-- Ejecutar en el SQL Editor de Supabase

-- 1. Política para eliminar registros de 'clientes'
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
FOR DELETE 
USING (auth.uid() = id);

-- 2. Política para eliminar productos de 'productos'
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
FOR DELETE 
USING (auth.uid() = artesano_id);

-- 3. Política para eliminar archivos del storage 'avatars'
CREATE POLICY "Usuarios pueden eliminar sus avatares" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar políticas creadas
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE policyname LIKE '%eliminar%' OR policyname LIKE '%delete%'
ORDER BY tablename;

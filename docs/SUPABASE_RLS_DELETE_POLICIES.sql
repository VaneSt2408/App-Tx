-- Script para agregar políticas RLS de eliminación (DELETE) para las tablas
-- Este script permite que los usuarios eliminen sus propios datos

-- 1. Política para eliminar registros de la tabla 'clientes'
-- Permite que los usuarios eliminen su propio perfil
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
FOR DELETE 
USING (auth.uid() = id);

-- 2. Política para eliminar registros de la tabla 'perfiles' (si existe)
-- Permite que los usuarios eliminen su propio perfil
CREATE POLICY "Perfiles pueden ser eliminados por su propietario" ON perfiles
FOR DELETE 
USING (auth.uid() = id);

-- 3. Política para eliminar productos de la tabla 'productos'
-- Permite que los artesanos eliminen sus propios productos
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
FOR DELETE 
USING (auth.uid() = artesano_id);

-- 4. Política para eliminar archivos del storage 'avatars'
-- Permite que los usuarios eliminen sus propios avatares
CREATE POLICY "Usuarios pueden eliminar sus avatares" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 5. Política adicional para eliminar archivos del storage 'productos' (si existe)
-- Permite que los artesanos eliminen las imágenes de sus productos
CREATE POLICY "Artesanos pueden eliminar imágenes de sus productos" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'productos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename IN ('clientes', 'perfiles', 'productos', 'objects')
ORDER BY tablename, policyname;

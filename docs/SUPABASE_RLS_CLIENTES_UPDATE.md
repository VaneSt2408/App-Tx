# Políticas RLS para tabla clientes - UPDATE

## Problema identificado
La tabla `clientes` no tiene políticas RLS para UPDATE, por lo que los usuarios no pueden actualizar sus perfiles.

## Script SQL para agregar políticas RLS

```sql
-- Verificar políticas RLS existentes
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'clientes';

-- Agregar política RLS para UPDATE
CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Verificar que la política se creó correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'clientes' AND policyname = 'Clientes pueden actualizar su perfil';
```

## Políticas RLS completas para la tabla clientes

```sql
-- Política para SELECT (ver perfil)
CREATE POLICY "Clientes pueden ver su perfil" ON clientes
    FOR SELECT USING (auth.uid() = id);

-- Política para INSERT (crear perfil)
CREATE POLICY "Clientes pueden crear su perfil" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Política para UPDATE (actualizar perfil)
CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Política para DELETE (eliminar perfil)
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
    FOR DELETE USING (auth.uid() = id);
```

## Verificación de RLS habilitado

```sql
-- Verificar que RLS está habilitado en la tabla
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'clientes';

-- Si rowsecurity es false, habilitarlo:
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
```

## Script completo de configuración

```sql
-- 1. Habilitar RLS si no está habilitado
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

-- 2. Crear todas las políticas RLS
CREATE POLICY "Clientes pueden ver su perfil" ON clientes
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clientes pueden crear su perfil" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
    FOR DELETE USING (auth.uid() = id);

-- 3. Verificar que todas las políticas se crearon
SELECT policyname, cmd, qual 
FROM pg_policies 
WHERE tablename = 'clientes';
```

## Notas importantes

1. **USING clause**: Define quién puede ejecutar la operación
2. **WITH CHECK clause**: Define qué datos se pueden insertar/actualizar
3. **auth.uid()**: Función de Supabase que devuelve el ID del usuario autenticado
4. **id**: Campo que referencia al usuario en la tabla clientes

## Solución de problemas

Si sigues teniendo problemas después de crear las políticas:

```sql
-- Verificar que el usuario está autenticado
SELECT auth.uid();

-- Verificar que el usuario existe en la tabla
SELECT * FROM clientes WHERE id = auth.uid();

-- Probar actualización manual
UPDATE clientes 
SET nombre_completo = 'Test Update' 
WHERE id = auth.uid();
```

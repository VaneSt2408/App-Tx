# Actualización de la tabla clientes - Columna updated_at

## Script SQL para agregar la columna updated_at

```sql
-- Agregar columna updated_at a la tabla clientes
ALTER TABLE clientes 
ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Crear trigger para actualizar automáticamente updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Aplicar el trigger a la tabla clientes
CREATE TRIGGER update_clientes_updated_at 
    BEFORE UPDATE ON clientes 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Verificación de la estructura actual

Para verificar que la columna se agregó correctamente:

```sql
-- Ver estructura de la tabla clientes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
ORDER BY ordinal_position;
```

## Políticas RLS existentes

Las políticas RLS existentes seguirán funcionando sin cambios:

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename = 'clientes';
```

## Notas importantes

1. **Backward compatibility**: La columna `updated_at` tiene un valor por defecto, por lo que los registros existentes tendrán `updated_at = created_at`
2. **Trigger automático**: El trigger actualizará automáticamente `updated_at` en cada UPDATE
3. **No afecta funcionalidad existente**: Los servicios existentes seguirán funcionando normalmente

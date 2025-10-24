# Alternativa para actualizar perfil sin columna updated_at

## Problema
Si la columna `updated_at` no existe en la tabla `clientes`, la función puede fallar.

## Solución alternativa
Usar la función `updateClientProfile` que maneja la actualización sin depender de `updated_at`:

```javascript
// En clientProfile.js, cambiar la llamada de editClientProfile a updateClientProfile
const { data, error } = await updateClientProfile(user.id, {
  nombre_completo: editData.nombre_completo,
  telefono: editData.telefono,
  avatar_url: avatarUrl
});
```

## Verificación de la tabla
Para verificar si la columna `updated_at` existe:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'clientes' 
AND column_name = 'updated_at';
```

## Script de migración seguro
Si quieres agregar la columna de forma segura:

```sql
-- Verificar si la columna ya existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clientes' 
        AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE clientes 
        ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
        
        -- Crear trigger
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';

        CREATE TRIGGER update_clientes_updated_at 
            BEFORE UPDATE ON clientes 
            FOR EACH ROW 
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
```

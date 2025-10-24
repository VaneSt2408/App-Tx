# Database Documentation - App-Tx

## 📋 Tabla de Contenidos

- [Esquema de Base de Datos](#esquema-de-base-de-datos)
- [Tablas Principales](#tablas-principales)
- [Políticas RLS](#políticas-rls)
- [Índices y Optimización](#índices-y-optimización)
- [Scripts de Configuración](#scripts-de-configuración)
- [Migraciones](#migraciones)

## 🗄️ Esquema de Base de Datos

### Diagrama de Relaciones

```
auth.users (Supabase Auth)
    │
    ├── clientes (1:1)
    │   └── id → auth.users(id)
    │
    └── productos (1:N)
        └── artesano_id → auth.users(id)
```

## 📊 Tablas Principales

### `auth.users` (Tabla de Usuarios - Supabase Auth)

**Descripción**: Tabla gestionada automáticamente por Supabase Auth.

**Campos**:
- `id` (UUID, PK): Identificador único del usuario
- `email` (TEXT): Email del usuario
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización
- `email_confirmed_at` (TIMESTAMP): Fecha de confirmación de email
- `last_sign_in_at` (TIMESTAMP): Último inicio de sesión

### `clientes`

**Descripción**: Perfil de información personal de los clientes.

```sql
CREATE TABLE clientes (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (UUID, PK, FK): Referencia a `auth.users(id)`
- `nombre_completo` (TEXT, NOT NULL): Nombre completo del cliente
- `telefono` (TEXT, NULL): Número de teléfono (opcional)
- `avatar_url` (TEXT, NULL): URL del avatar en Supabase Storage
- `created_at` (TIMESTAMP): Fecha de creación del perfil
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Restricciones**:
- Un cliente por usuario (relación 1:1)
- `nombre_completo` es obligatorio
- `telefono` y `avatar_url` son opcionales

### `productos`

**Descripción**: Catálogo de productos artesanales.

```sql
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artesano_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  imagen_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'eliminado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**Campos**:
- `id` (UUID, PK): Identificador único del producto
- `artesano_id` (UUID, FK): Referencia al artesano propietario
- `nombre` (TEXT, NOT NULL): Nombre del producto
- `descripcion` (TEXT, NOT NULL): Descripción detallada
- `precio` (TEXT, NOT NULL): Precio como string para flexibilidad
- `categoria` (TEXT): Categoría del producto (default: 'general')
- `imagen_url` (TEXT, NULL): URL de la imagen en Supabase Storage
- `estado` (TEXT): Estado del producto (activo/inactivo/eliminado)
- `created_at` (TIMESTAMP): Fecha de creación
- `updated_at` (TIMESTAMP): Fecha de última actualización

**Restricciones**:
- Un artesano puede tener múltiples productos (relación 1:N)
- `nombre`, `descripcion` y `precio` son obligatorios
- `estado` debe ser uno de: 'activo', 'inactivo', 'eliminado'
- Eliminación en cascada cuando se elimina el artesano

## 🔒 Políticas RLS (Row Level Security)

### Habilitar RLS

```sql
-- Habilitar RLS en todas las tablas
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
```

### Políticas para `clientes`

#### Política: Clientes pueden ver su propio perfil
```sql
CREATE POLICY "Clientes pueden ver su perfil" ON clientes
  FOR SELECT USING (auth.uid() = id);
```

#### Política: Clientes pueden insertar su perfil
```sql
CREATE POLICY "Clientes pueden insertar su perfil" ON clientes
  FOR INSERT WITH CHECK (auth.uid() = id);
```

#### Política: Clientes pueden actualizar su perfil
```sql
CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
  FOR UPDATE USING (auth.uid() = id);
```

#### Política: Clientes pueden eliminar su perfil
```sql
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
  FOR DELETE USING (auth.uid() = id);
```

### Políticas para `productos`

#### Política: Artesanos pueden ver sus productos
```sql
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);
```

#### Política: Artesanos pueden insertar sus productos
```sql
CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
  FOR INSERT WITH CHECK (auth.uid() = artesano_id);
```

#### Política: Artesanos pueden actualizar sus productos
```sql
CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
  FOR UPDATE USING (auth.uid() = artesano_id);
```

#### Política: Artesanos pueden eliminar sus productos
```sql
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
  FOR DELETE USING (auth.uid() = artesano_id);
```

#### Política: Clientes pueden ver productos activos
```sql
CREATE POLICY "Clientes pueden ver productos activos" ON productos
  FOR SELECT USING (estado = 'activo');
```

## 📈 Índices y Optimización

### Índices Recomendados

```sql
-- Índice para búsqueda por artesano
CREATE INDEX idx_productos_artesano_id ON productos(artesano_id);

-- Índice para filtrado por estado
CREATE INDEX idx_productos_estado ON productos(estado);

-- Índice para filtrado por categoría
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- Índice para ordenamiento por fecha
CREATE INDEX idx_productos_created_at ON productos(created_at DESC);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_productos_artesano_estado ON productos(artesano_id, estado);

-- Índice para búsqueda de texto
CREATE INDEX idx_productos_nombre_text ON productos USING gin(to_tsvector('spanish', nombre));
```

### Optimizaciones de Consultas

#### Consulta Optimizada: Productos de un Artesano
```sql
SELECT * FROM productos 
WHERE artesano_id = $1 
  AND estado = 'activo' 
ORDER BY created_at DESC;
```

#### Consulta Optimizada: Productos por Categoría
```sql
SELECT * FROM productos 
WHERE categoria = $1 
  AND estado = 'activo' 
ORDER BY created_at DESC 
LIMIT 20;
```

#### Consulta Optimizada: Búsqueda de Texto
```sql
SELECT * FROM productos 
WHERE to_tsvector('spanish', nombre || ' ' || descripcion) @@ plainto_tsquery('spanish', $1)
  AND estado = 'activo'
ORDER BY created_at DESC;
```

## 🛠️ Scripts de Configuración

### Script Completo de Configuración

```sql
-- 1. Crear tabla clientes
CREATE TABLE clientes (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Crear tabla productos
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artesano_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  imagen_url TEXT,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'inactivo', 'eliminado')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Crear índices
CREATE INDEX idx_productos_artesano_id ON productos(artesano_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_created_at ON productos(created_at DESC);

-- 4. Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 5. Crear políticas para clientes
CREATE POLICY "Clientes pueden ver su perfil" ON clientes
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Clientes pueden insertar su perfil" ON clientes
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
  FOR DELETE USING (auth.uid() = id);

-- 6. Crear políticas para productos
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
  FOR INSERT WITH CHECK (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
  FOR UPDATE USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
  FOR DELETE USING (auth.uid() = artesano_id);

CREATE POLICY "Clientes pueden ver productos activos" ON productos
  FOR SELECT USING (estado = 'activo');
```

### Configuración de Storage

```sql
-- Crear buckets de Storage
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('productos', 'productos', true);

-- Políticas para bucket avatars
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Políticas para bucket productos
CREATE POLICY "Artisans can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Everyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
```

## 🔄 Migraciones

### Migración 1: Agregar Campo de Categoría
```sql
-- Agregar columna categoria si no existe
ALTER TABLE productos 
ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'general';
```

### Migración 2: Agregar Índices de Rendimiento
```sql
-- Agregar índices adicionales
CREATE INDEX IF NOT EXISTS idx_productos_artesano_estado ON productos(artesano_id, estado);
CREATE INDEX IF NOT EXISTS idx_productos_nombre_text ON productos USING gin(to_tsvector('spanish', nombre));
```

### Migración 3: Actualizar Políticas RLS
```sql
-- Eliminar políticas antiguas si existen
DROP POLICY IF EXISTS "old_policy_name" ON productos;

-- Crear nuevas políticas
CREATE POLICY "new_policy_name" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);
```

## 📊 Monitoreo y Métricas

### Consultas de Monitoreo

#### Productos por Artesano
```sql
SELECT 
  artesano_id,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN estado = 'activo' THEN 1 END) as productos_activos
FROM productos 
GROUP BY artesano_id;
```

#### Productos por Categoría
```sql
SELECT 
  categoria,
  COUNT(*) as total,
  AVG(CAST(precio AS DECIMAL)) as precio_promedio
FROM productos 
WHERE estado = 'activo'
GROUP BY categoria
ORDER BY total DESC;
```

#### Actividad Reciente
```sql
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as productos_creados
FROM productos 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

## 🔧 Mantenimiento

### Limpieza de Datos
```sql
-- Eliminar productos eliminados hace más de 30 días
DELETE FROM productos 
WHERE estado = 'eliminado' 
  AND updated_at < NOW() - INTERVAL '30 days';
```

### Optimización de Base de Datos
```sql
-- Analizar tablas para optimización
ANALYZE clientes;
ANALYZE productos;

-- Reindexar si es necesario
REINDEX TABLE productos;
```

---

**Última actualización**: Diciembre 2024
**Versión de Base de Datos**: 1.0.0

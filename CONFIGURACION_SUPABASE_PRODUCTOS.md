# Configuración de Supabase para Productos - App-Tx

## 📋 Tabla de Contenidos

- [Configuración de Base de Datos](#configuración-de-base-de-datos)
- [Configuración de Storage](#configuración-de-storage)
- [Políticas RLS](#políticas-rls)
- [Scripts de Configuración](#scripts-de-configuración)
- [Verificación](#verificación)

## 🗄️ Configuración de Base de Datos

### 1. Crear Tabla de Productos

```sql
-- Crear tabla productos
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

### 2. Crear Índices para Mejor Rendimiento

```sql
-- Crear índices para mejor rendimiento
CREATE INDEX idx_productos_artesano_id ON productos(artesano_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_productos_created_at ON productos(created_at DESC);

-- Índice compuesto para consultas frecuentes
CREATE INDEX idx_productos_artesano_estado ON productos(artesano_id, estado);
```

### 3. Habilitar RLS (Row Level Security)

```sql
-- Habilitar RLS (Row Level Security)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
```

## 🔒 Políticas RLS

### Políticas para Artesanos

```sql
-- Política para que los artesanos solo puedan ver sus propios productos
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);

-- Política para que los artesanos puedan insertar sus productos
CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
  FOR INSERT WITH CHECK (auth.uid() = artesano_id);

-- Política para que los artesanos puedan actualizar sus productos
CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
  FOR UPDATE USING (auth.uid() = artesano_id);

-- Política para que los artesanos puedan eliminar sus productos
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
  FOR DELETE USING (auth.uid() = artesano_id);
```

### Políticas para Clientes

```sql
-- Política para que los clientes puedan ver productos activos
CREATE POLICY "Clientes pueden ver productos activos" ON productos
  FOR SELECT USING (estado = 'activo');
```

## 📁 Configuración de Storage

### 1. Crear Bucket de Productos

```sql
-- Crear bucket para imágenes de productos
INSERT INTO storage.buckets (id, name, public) VALUES 
('productos', 'productos', true);
```

### 2. Políticas de Storage para Productos

```sql
-- Política para que los artesanos puedan subir a su propia carpeta
CREATE POLICY "Artesanos pueden subir a su carpeta" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que los artesanos puedan ver sus propias imágenes
CREATE POLICY "Artesanos pueden ver sus imágenes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para que todos puedan ver imágenes de productos (públicas)
CREATE POLICY "Todos pueden ver imágenes de productos" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
```

## 🛠️ Scripts de Configuración

### Script Completo de Configuración

```sql
-- ============================================
-- CONFIGURACIÓN COMPLETA DE PRODUCTOS
-- ============================================

-- 1. Crear tabla productos
CREATE TABLE IF NOT EXISTS productos (
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

-- 2. Crear índices
CREATE INDEX IF NOT EXISTS idx_productos_artesano_id ON productos(artesano_id);
CREATE INDEX IF NOT EXISTS idx_productos_estado ON productos(estado);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria);
CREATE INDEX IF NOT EXISTS idx_productos_created_at ON productos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_productos_artesano_estado ON productos(artesano_id, estado);

-- 3. Habilitar RLS
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
-- Políticas para artesanos
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
  FOR INSERT WITH CHECK (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
  FOR UPDATE USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
  FOR DELETE USING (auth.uid() = artesano_id);

-- Política para clientes
CREATE POLICY "Clientes pueden ver productos activos" ON productos
  FOR SELECT USING (estado = 'activo');

-- 5. Crear bucket de storage
INSERT INTO storage.buckets (id, name, public) VALUES 
('productos', 'productos', true)
ON CONFLICT (id) DO NOTHING;

-- 6. Políticas de storage
CREATE POLICY "Artesanos pueden subir a su carpeta" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Artesanos pueden ver sus imágenes" ON storage.objects
FOR SELECT USING (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Todos pueden ver imágenes de productos" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
```

## ✅ Verificación

### 1. Verificar Tabla Creada

```sql
-- Verificar que la tabla existe
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'productos';
```

### 2. Verificar Índices

```sql
-- Verificar índices creados
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'productos';
```

### 3. Verificar Políticas RLS

```sql
-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'productos';
```

### 4. Verificar Bucket de Storage

```sql
-- Verificar bucket creado
SELECT * FROM storage.buckets WHERE id = 'productos';
```

### 5. Verificar Políticas de Storage

```sql
-- Verificar políticas de storage
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND policyname LIKE '%productos%';
```

## 🧪 Pruebas de Funcionalidad

### 1. Prueba de Inserción

```sql
-- Insertar producto de prueba (reemplazar con ID real de usuario)
INSERT INTO productos (artesano_id, nombre, descripcion, precio, categoria)
VALUES (
  'user-id-here',
  'Jarro de barro tradicional',
  'Jarro artesanal hecho a mano con técnicas ancestrales',
  '150.00',
  'cerámica'
);
```

### 2. Prueba de Consulta

```sql
-- Consultar productos de un artesano
SELECT * FROM productos WHERE artesano_id = 'user-id-here';

-- Consultar productos activos
SELECT * FROM productos WHERE estado = 'activo';
```

### 3. Prueba de Storage

```sql
-- Verificar estructura de storage
SELECT * FROM storage.objects WHERE bucket_id = 'productos' LIMIT 5;
```

## 🔧 Configuración Adicional

### 1. Configurar Webhooks (Opcional)

```sql
-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para productos
CREATE TRIGGER update_productos_updated_at 
  BEFORE UPDATE ON productos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
```

### 2. Configurar Full-Text Search (Opcional)

```sql
-- Crear índice para búsqueda de texto
CREATE INDEX idx_productos_search ON productos 
USING gin(to_tsvector('spanish', nombre || ' ' || descripcion));

-- Función de búsqueda
CREATE OR REPLACE FUNCTION search_productos(search_term TEXT)
RETURNS TABLE (
  id UUID,
  nombre TEXT,
  descripcion TEXT,
  precio TEXT,
  categoria TEXT,
  imagen_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.nombre, p.descripcion, p.precio, p.categoria, p.imagen_url
  FROM productos p
  WHERE p.estado = 'activo'
    AND to_tsvector('spanish', p.nombre || ' ' || p.descripcion) @@ plainto_tsquery('spanish', search_term)
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql;
```

## 📊 Monitoreo y Métricas

### Consultas de Monitoreo

```sql
-- Productos por artesano
SELECT 
  artesano_id,
  COUNT(*) as total_productos,
  COUNT(CASE WHEN estado = 'activo' THEN 1 END) as productos_activos
FROM productos 
GROUP BY artesano_id;

-- Productos por categoría
SELECT 
  categoria,
  COUNT(*) as total,
  AVG(CAST(precio AS DECIMAL)) as precio_promedio
FROM productos 
WHERE estado = 'activo'
GROUP BY categoria
ORDER BY total DESC;

-- Actividad reciente
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as productos_creados
FROM productos 
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

## 🚨 Troubleshooting

### Problemas Comunes

#### Error: "relation 'productos' does not exist"
```sql
-- Verificar que la tabla existe
\dt productos
```

#### Error: "permission denied for table productos"
```sql
-- Verificar políticas RLS
SELECT * FROM pg_policies WHERE tablename = 'productos';
```

#### Error: "bucket 'productos' does not exist"
```sql
-- Verificar bucket
SELECT * FROM storage.buckets WHERE id = 'productos';
```

#### Error: "permission denied for storage.objects"
```sql
-- Verificar políticas de storage
SELECT * FROM pg_policies WHERE tablename = 'objects' AND policyname LIKE '%productos%';
```

---

**Configuración**: Productos App-Tx  
**Versión**: 1.0.0  
**Última actualización**: Diciembre 2024  
**Estado**: Listo para producción
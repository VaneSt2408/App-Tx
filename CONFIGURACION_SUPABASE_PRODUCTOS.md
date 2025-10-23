# Configuración de Supabase para Productos

## 1. Crear la tabla `productos`

Ejecuta el siguiente SQL en el editor SQL de Supabase:

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

-- Crear índices para mejor rendimiento
CREATE INDEX idx_productos_artesano_id ON productos(artesano_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- Habilitar RLS (Row Level Security)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- Política para que los artesanos solo puedan ver/editar sus propios productos
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
  FOR SELECT USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
  FOR INSERT WITH CHECK (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
  FOR UPDATE USING (auth.uid() = artesano_id);

CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
  FOR DELETE USING (auth.uid() = artesano_id);

-- Política para que los clientes puedan ver productos activos
CREATE POLICY "Clientes pueden ver productos activos" ON productos
  FOR SELECT USING (estado = 'activo');
```

## 2. Crear bucket para imágenes

En el dashboard de Supabase, ve a Storage y crea un nuevo bucket:

1. **Nombre del bucket**: `productos`
2. **Público**: ✅ (marcado como público para que las imágenes sean accesibles)
3. **File size limit**: 10MB (ajusta según necesites)
4. **Allowed MIME types**: `image/jpeg, image/png, image/webp`

## 3. Configurar políticas de Storage

Ejecuta el siguiente SQL para las políticas de Storage:

```sql
-- Política para que los artesanos puedan subir imágenes
CREATE POLICY "Artesanos pueden subir imágenes" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'productos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que los artesanos puedan actualizar sus imágenes
CREATE POLICY "Artesanos pueden actualizar sus imágenes" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'productos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que los artesanos puedan eliminar sus imágenes
CREATE POLICY "Artesanos pueden eliminar sus imágenes" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'productos' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Política para que todos puedan ver las imágenes (lectura pública)
CREATE POLICY "Imágenes públicas" ON storage.objects
  FOR SELECT USING (bucket_id = 'productos');
```

## 4. Instalar dependencias necesarias

Ejecuta en tu terminal:

```bash
npm install expo-image-picker expo-file-system
```

## 5. Configurar permisos en app.json

Agrega los siguientes permisos a tu `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-image-picker",
        {
          "photosPermission": "La app necesita acceso a tus fotos para subir productos.",
          "cameraPermission": "La app necesita acceso a la cámara para tomar fotos de productos."
        }
      ]
    ]
  }
}
```

## 6. Estructura de archivos en Storage

Las imágenes se organizarán de la siguiente manera:

```
productos/
├── producto_[ID]_[timestamp].jpg
├── producto_[ID]_[timestamp].jpg
└── ...
```

## 7. Funcionalidades implementadas

✅ **Selección de imagen**: Con compresión automática (70% de calidad)
✅ **Validación de formulario**: Campos requeridos y validación de precio
✅ **Subida a Supabase Storage**: Con nombres únicos y organización por carpetas
✅ **Base de datos**: Tabla `productos` con todas las relaciones necesarias
✅ **Seguridad**: RLS habilitado con políticas apropiadas
✅ **UI/UX**: Modal intuitivo con indicadores de carga

## 8. Uso

1. El artesano toca el botón "Subir producto"
2. Se abre el modal con el formulario
3. Selecciona una imagen (opcional)
4. Llena los datos del producto
5. Presiona "Subir Producto"
6. La imagen se comprime y sube a Supabase Storage
7. Los datos se guardan en la tabla `productos`
8. Se muestra confirmación de éxito

## 9. Próximos pasos recomendados

- Implementar lista de productos del artesano
- Agregar funcionalidad de editar/eliminar productos
- Implementar búsqueda y filtros para clientes
- Agregar sistema de categorías dinámicas

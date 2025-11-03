# API Documentation - App-Tx

## 📋 Tabla de Contenidos

- [Autenticación](#autenticación)
- [Servicios de Usuario](#servicios-de-usuario)
- [Servicios de Productos](#servicios-de-productos)
- [Gestión de Archivos](#gestión-de-archivos)
- [Códigos de Error](#códigos-de-error)

## 🔐 Autenticación

### `signUpWithEmail(email, password)`
Registra un nuevo usuario con email y contraseña.

**Parámetros:**
- `email` (string): Email del usuario
- `password` (string): Contraseña del usuario

**Retorna:**
```javascript
{
  data: {
    user: User | null,
    session: Session | null
  },
  error: AuthError | null
}
```

**Ejemplo:**
```javascript
const { data, error } = await signUpWithEmail('usuario@ejemplo.com', 'password123');
```

### `signInWithPassword(email, password)`
Inicia sesión con email y contraseña.

**Parámetros:**
- `email` (string): Email del usuario
- `password` (string): Contraseña del usuario

**Retorna:**
```javascript
{
  data: {
    user: User,
    session: Session
  },
  error: AuthError | null
}
```

### `signInWithGoogle()`
Inicia sesión con Google OAuth.

**Retorna:**
```javascript
{
  data: {
    user: User,
    session: Session
  },
  error: AuthError | null
}
```

### `resetPassword(email)`
Envía email de recuperación de contraseña.

**Parámetros:**
- `email` (string): Email del usuario

**Retorna:**
```javascript
{
  data: {},
  error: AuthError | null
}
```

### `updatePassword(newPassword)`
Actualiza la contraseña del usuario autenticado.

**Parámetros:**
- `newPassword` (string): Nueva contraseña

**Retorna:**
```javascript
{
  data: {
    user: User
  },
  error: AuthError | null
}
```

## 👤 Servicios de Usuario

### `createClientProfile(userId, fullName, phone, avatarUrl)`
Crea el perfil de un cliente.

**Parámetros:**
- `userId` (string): ID del usuario
- `fullName` (string): Nombre completo
- `phone` (string): Número de teléfono (opcional)
- `avatarUrl` (string): URL del avatar (opcional)

**Retorna:**
```javascript
{
  data: ClientProfile,
  error: PostgrestError | null
}
```

**Ejemplo:**
```javascript
const { data, error } = await createClientProfile(
  'user-id',
  'Juan Pérez',
  '555-123-4567',
  'https://supabase.co/storage/v1/object/public/avatars/user-id/avatar.jpg'
);
```

### `checkUserRole(userId)`
Verifica el rol y perfil del usuario.

**Parámetros:**
- `userId` (string): ID del usuario

**Retorna:**
```javascript
{
  rol: 'cliente' | 'artesano',
  perfil: ClientProfile | null,
  error: string | null
}
```

## 🛍️ Servicios de Productos

### `selectAndCompressImage()`
Selecciona y comprime una imagen desde la galería.

**Retorna:**
```javascript
{
  uri: string,
  base64: string,
  mimeType: string,
  width: number,
  height: number
} | null
```

**Ejemplo:**
```javascript
const imageAsset = await selectAndCompressImage();
if (imageAsset) {
}
```

### `uploadImageToSupabase(imageAsset, productId)`
Sube una imagen a Supabase Storage.

**Parámetros:**
- `imageAsset` (object): Asset de imagen con base64
- `productId` (string): ID del producto (opcional)

**Retorna:**
```javascript
string // URL pública de la imagen
```

**Ejemplo:**
```javascript
const imageUrl = await uploadImageToSupabase(imageAsset, 'product-123');
```

### `createProduct(productData)`
Crea un nuevo producto.

**Parámetros:**
```javascript
{
  nombre: string,
  descripcion: string,
  precio: string,
  categoria?: string,
  imageAsset?: object
}
```

**Retorna:**
```javascript
{
  id: string,
  artesano_id: string,
  nombre: string,
  descripcion: string,
  precio: string,
  categoria: string,
  imagen_url: string | null,
  estado: string,
  created_at: string
}
```

**Ejemplo:**
```javascript
const productData = {
  nombre: 'Jarro de barro tradicional',
  descripcion: 'Jarro artesanal hecho a mano',
  precio: '150.00',
  categoria: 'cerámica',
  imageAsset: selectedImage
};

const product = await createProduct(productData);
```

### `getProducts(artesanoId)`
Obtiene productos de un artesano específico.

**Parámetros:**
- `artesanoId` (string): ID del artesano

**Retorna:**
```javascript
Array<{
  id: string,
  nombre: string,
  descripcion: string,
  precio: string,
  categoria: string,
  imagen_url: string | null,
  estado: string,
  created_at: string
}>
```

### `getAllProducts()`
Obtiene todos los productos activos.

**Retorna:**
```javascript
Array<{
  id: string,
  artesano_id: string,
  nombre: string,
  descripcion: string,
  precio: string,
  categoria: string,
  imagen_url: string | null,
  estado: string,
  created_at: string
}>
```

## 📁 Gestión de Archivos

### Estructura de Storage

#### Bucket: `avatars`
```
avatars/
├── user-id-1/
│   ├── 1703123456789.jpg
│   └── 1703123456790.jpg
└── user-id-2/
    └── 1703123456791.jpg
```

#### Bucket: `productos`
```
productos/
├── user-id-1/
│   ├── 1703123456789.jpg
│   └── 1703123456790.jpg
└── user-id-2/
    └── 1703123456791.jpg
```

### Configuración de Storage

#### Políticas RLS para `avatars`
```sql
-- Los usuarios solo pueden subir a su propia carpeta
CREATE POLICY "Users can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Los usuarios pueden ver sus propias imágenes
CREATE POLICY "Users can view own images" ON storage.objects
FOR SELECT USING (
  bucket_id = 'avatars' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Políticas RLS para `productos`
```sql
-- Los artesanos pueden subir a su propia carpeta
CREATE POLICY "Artisans can upload to own folder" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'productos' AND 
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Todos pueden ver imágenes de productos
CREATE POLICY "Everyone can view product images" ON storage.objects
FOR SELECT USING (bucket_id = 'productos');
```

## ❌ Códigos de Error

### Errores de Autenticación
- `invalid_credentials`: Credenciales incorrectas
- `email_not_confirmed`: Email no confirmado
- `weak_password`: Contraseña muy débil
- `user_not_found`: Usuario no encontrado

### Errores de Base de Datos
- `duplicate_key`: Clave duplicada
- `foreign_key_violation`: Violación de clave foránea
- `not_null_violation`: Violación de campo requerido
- `check_violation`: Violación de restricción

### Errores de Storage
- `file_too_large`: Archivo muy grande
- `invalid_file_type`: Tipo de archivo inválido
- `storage_quota_exceeded`: Cuota de almacenamiento excedida
- `upload_failed`: Fallo en la subida

### Errores de Validación
- `required_field`: Campo requerido faltante
- `invalid_format`: Formato inválido
- `value_too_long`: Valor muy largo
- `value_too_short`: Valor muy corto

## 🔄 Flujos de Datos

### Flujo de Registro
1. Usuario ingresa email/password
2. `signUpWithEmail()` crea cuenta
3. Email de verificación enviado
4. Usuario verifica email
5. `createClientProfile()` completa perfil
6. Redirección a app principal

### Flujo de Subida de Producto
1. Artesano selecciona imagen
2. `selectAndCompressImage()` procesa imagen
3. `createProduct()` con `imageAsset`
4. `uploadImageToSupabase()` sube imagen
5. URL de imagen guardada en BD
6. Producto creado exitosamente

### Flujo de Cambio de Contraseña
1. Usuario solicita reset
2. `resetPassword()` envía email
3. Usuario hace clic en enlace
4. `updatePassword()` actualiza contraseña
5. Validación de similitud implementada
6. Contraseña actualizada

## 📊 Límites y Restricciones

### Límites de Archivos
- **Tamaño máximo**: 10MB por imagen
- **Formatos permitidos**: JPG, PNG, WEBP
- **Compresión**: Automática a 50% de calidad
- **Resolución**: Máximo 2048x2048px

### Límites de Base de Datos
- **Productos por artesano**: Sin límite
- **Caracteres en descripción**: 1000 máximo
- **Categorías**: Texto libre
- **Precios**: Formato decimal

### Límites de API
- **Requests por minuto**: 100
- **Tamaño de request**: 1MB
- **Timeout**: 30 segundos
- **Retry**: 3 intentos automáticos

---

**Última actualización**: Diciembre 2024
**Versión API**: 1.0.0

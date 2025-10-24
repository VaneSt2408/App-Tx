# App-Tx - Plataforma de Artesanías

Una aplicación móvil desarrollada con React Native y Expo que conecta artesanos con clientes, permitiendo la compra y venta de productos artesanales únicos.

## 🚀 Características Principales

### Para Artesanos
- **Gestión de productos**: Subir, editar y administrar productos artesanales
- **Galería de imágenes**: Subida de fotos con compresión automática
- **Perfil profesional**: Completar información personal y de contacto
- **Categorización**: Organizar productos por categorías
- **Modal de subida**: Interfaz intuitiva para agregar productos
- **Compresión de imágenes**: Optimización automática de archivos

### Para Clientes
- **Catálogo de productos**: Explorar productos artesanales
- **Búsqueda y filtros**: Encontrar productos específicos
- **Perfil de usuario**: Gestión completa de información personal
- **Edición de perfil**: Modificar nombre, teléfono y avatar
- **Sistema de autenticación**: Registro e inicio de sesión seguro
- **Completar perfil**: Flujo obligatorio para nuevos usuarios
- **Validación de contraseñas**: Prevención de contraseñas similares

## 🛠️ Tecnologías Utilizadas

### Frontend
- **React Native** - Framework para desarrollo móvil
- **Expo** - Plataforma de desarrollo y deployment
- **TypeScript** - Tipado estático para JavaScript
- **Expo Router** - Navegación basada en archivos
- **React Context** - Gestión de estado global

### Backend y Base de Datos
- **Supabase** - Backend as a Service (BaaS)
- **PostgreSQL** - Base de datos relacional
- **Row Level Security (RLS)** - Seguridad a nivel de fila
- **Supabase Storage** - Almacenamiento de archivos

### Autenticación
- **Supabase Auth** - Sistema de autenticación
- **OAuth** - Login con Google
- **Email/Password** - Autenticación tradicional
- **Recuperación de contraseña** - Flujo completo de reset

### UI/UX
- **Expo Linear Gradient** - Gradientes personalizados
- **Moti** - Animaciones fluidas
- **React Native Vector Icons** - Iconografía
- **Expo Image Picker** - Selección de imágenes

## 📱 Estructura del Proyecto

```
App-Tx/
├── app/                          # Páginas principales (Expo Router)
│   ├── (app)/                    # Rutas protegidas
│   │   ├── ArtPage.js           # Página principal del artesano
│   │   └── ...
│   ├── (auth)/                   # Rutas de autenticación
│   │   ├── auth.tsx             # Login/Registro
│   │   ├── resetPassword.tsx    # Cambio de contraseña
│   │   └── verification.tsx     # Verificación de email
│   ├── completeProfile.tsx       # Completar perfil de cliente
│   └── _layout.tsx              # Layout principal
├── src/                         # Código fuente
│   ├── context/                 # Contextos de React
│   │   └── AuthContext.tsx      # Contexto de autenticación
│   ├── services/                # Servicios de backend
│   │   ├── authService.js       # Servicios de autenticación
│   │   ├── productService.js    # Servicios de productos
│   │   └── userService.js       # Servicios de usuario
│   └── supabase/                # Configuración de Supabase
│       └── client.js            # Cliente de Supabase
├── components/                  # Componentes reutilizables
│   └── UploadProductModal.js    # Modal para subir productos
└── docs/                        # Documentación
    ├── API.md                   # Documentación de API
    ├── DATABASE.md              # Esquema de base de datos
    └── DEPLOYMENT.md            # Guía de deployment
```

## 📦 Dependencias y Paquetes

### Dependencias Principales
```json
{
  "expo": "~50.0.0",
  "react": "18.2.0",
  "react-native": "0.73.0",
  "@expo/vector-icons": "^14.0.0",
  "expo-router": "~3.4.0",
  "expo-status-bar": "~1.11.0"
}
```

### Dependencias de Autenticación
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "expo-auth-session": "~5.4.0",
  "expo-crypto": "~12.8.0",
  "expo-linking": "~6.2.0"
}
```

### Dependencias de UI/UX
```json
{
  "expo-linear-gradient": "~12.7.0",
  "moti": "^0.25.0",
  "react-native-reanimated": "~3.6.0",
  "react-native-safe-area-context": "4.8.0",
  "react-native-screens": "~3.29.0"
}
```

### Dependencias de Imágenes
```json
{
  "expo-image-picker": "~14.7.0",
  "expo-file-system": "~16.0.0",
  "base64-arraybuffer": "^1.0.0"
}
```

### Dependencias de Utilidades
```json
{
  "react-native-get-random-values": "~1.9.0",
  "react-native-url-polyfill": "^2.0.0"
}
```

### Instalación de Dependencias

#### Instalación Completa
```bash
# Instalar todas las dependencias
npm install

# O con yarn
yarn install
```

#### Instalación Individual (si es necesario)
```bash
# Dependencias principales
npm install expo@~50.0.0 react@18.2.0 react-native@0.73.0

# Autenticación
npm install @supabase/supabase-js@^2.38.0 expo-auth-session@~5.4.0

# UI/UX
npm install expo-linear-gradient@~12.7.0 moti@^0.25.0

# Imágenes
npm install expo-image-picker@~14.7.0 expo-file-system@~16.0.0

# Utilidades
npm install react-native-get-random-values@~1.9.0 base64-arraybuffer@^1.0.0
```

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- Cuenta de Supabase
- Android Studio (para desarrollo Android)
- Xcode (para desarrollo iOS)

### Pasos de Instalación

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd App-Tx
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Instalar Expo CLI globalmente (si no lo tienes)**
```bash
npm install -g @expo/cli
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Configurar Supabase**
- Crear proyecto en Supabase
- Ejecutar scripts SQL (ver `docs/DATABASE.md`)
- Configurar políticas RLS
- Crear buckets de Storage

5. **Ejecutar la aplicación**
```bash
npm start
# o
expo start
```

## 🗄️ Base de Datos

### Tablas Principales

#### `auth.users` (Tabla de usuarios de Supabase)
- Gestión automática por Supabase Auth

#### `clientes`
```sql
CREATE TABLE clientes (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Trigger para actualizar updated_at automáticamente
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
```

#### `productos`
```sql
CREATE TABLE productos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  artesano_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  precio TEXT NOT NULL,
  categoria TEXT DEFAULT 'general',
  imagen_url TEXT,
  estado TEXT DEFAULT 'activo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Políticas RLS

#### Para tabla `clientes`
```sql
-- Ver perfil
CREATE POLICY "Clientes pueden ver su perfil" ON clientes
    FOR SELECT USING (auth.uid() = id);

-- Crear perfil
CREATE POLICY "Clientes pueden crear su perfil" ON clientes
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Actualizar perfil
CREATE POLICY "Clientes pueden actualizar su perfil" ON clientes
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Eliminar perfil
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
    FOR DELETE USING (auth.uid() = id);
```

#### Para tabla `productos`
```sql
-- Artesanos pueden ver sus productos
CREATE POLICY "Artesanos pueden ver sus productos" ON productos
    FOR SELECT USING (auth.uid() = artesano_id);

-- Artesanos pueden insertar productos
CREATE POLICY "Artesanos pueden insertar sus productos" ON productos
    FOR INSERT WITH CHECK (auth.uid() = artesano_id);

-- Artesanos pueden actualizar sus productos
CREATE POLICY "Artesanos pueden actualizar sus productos" ON productos
    FOR UPDATE USING (auth.uid() = artesano_id);

-- Artesanos pueden eliminar sus productos
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
    FOR DELETE USING (auth.uid() = artesano_id);

-- Clientes pueden ver productos activos
CREATE POLICY "Clientes pueden ver productos activos" ON productos
    FOR SELECT USING (estado = 'activo');
```

#### Para Storage
- **Bucket `avatars`**: Acceso controlado por usuario
- **Bucket `productos`**: Acceso controlado por artesano

## 🔐 Autenticación

### Flujo de Autenticación
1. **Registro**: Email/Password con verificación
2. **Login**: Credenciales o OAuth (Google)
3. **Perfil**: Completar información personal
4. **Navegación**: Redirección automática según rol

### Roles de Usuario
- **Cliente**: Puede ver productos y completar perfil
- **Artesano**: Puede gestionar productos y ver su catálogo

## 📸 Gestión de Imágenes

### Funcionalidades Implementadas
- **Compresión automática**: Quality 0.5 para optimización
- **Formato base64**: Para compatibilidad con Supabase Storage
- **Organización por usuario**: Carpetas individuales por ID
- **Buckets especializados**: `avatars` para perfiles, `productos` para productos
- **Validación de permisos**: Verificación de acceso a galería
- **Manejo de errores**: Gestión robusta de fallos de subida

### Proceso de Subida de Avatar
1. **Selección**: `expo-image-picker` con permisos de galería
2. **Compresión**: Quality 0.5, aspect ratio 1:1
3. **Conversión**: Base64 para compatibilidad
4. **Subida**: Supabase Storage bucket `avatars`
5. **URL**: Generación de URL pública
6. **Actualización**: Guardado en tabla `clientes`

### Proceso de Subida de Producto
1. **Selección**: `expo-image-picker` con permisos de galería
2. **Compresión**: Quality 0.5, aspect ratio 4:3
3. **Conversión**: Base64 para compatibilidad
4. **Subida**: Supabase Storage bucket `productos`
5. **URL**: Generación de URL pública
6. **Almacenamiento**: Guardado en tabla `productos`

### Configuración de Storage
```javascript
// Ejemplo de configuración de buckets
const avatarConfig = {
  bucket: 'avatars',
  path: `${userId}/${fileName}`,
  contentType: 'image/jpeg'
};

const productConfig = {
  bucket: 'productos',
  path: `${userId}/${fileName}`,
  contentType: 'image/jpeg'
};
```

## 🚀 Deployment

### Preparación
1. Configurar variables de entorno de producción
2. Configurar dominio de Supabase
3. Configurar políticas de CORS
4. Configurar buckets de Storage

### Build de Producción
```bash
# Android
expo build:android

# iOS
expo build:ios
```

## 🧪 Testing

### Pruebas Manuales
- [ ] Registro de nuevos usuarios
- [ ] Login con diferentes métodos
- [ ] Subida de productos con imágenes
- [ ] Navegación entre pantallas
- [ ] Validaciones de formularios

### Casos de Uso
- [ ] Cliente completa perfil
- [ ] Artesano sube producto
- [ ] Recuperación de contraseña
- [ ] Cambio de contraseña con validación

## 📚 Documentación Adicional

- [API Documentation](docs/API.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 👥 Equipo

- **Desarrollador Principal**: [Tu Nombre]
- **Diseño UX/UI**: [Nombre del Diseñador]
- **Backend**: Supabase

## 📞 Soporte

Para soporte, contacta a [email@ejemplo.com] o crea un issue en el repositorio.

---

**Última actualización**: Diciembre 2024
**Versión**: 1.0.0

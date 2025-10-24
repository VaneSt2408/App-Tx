# App-Tx - Plataforma de Artesanías

Una aplicación móvil desarrollada con React Native y Expo que conecta artesanos con clientes, permitiendo la compra y venta de productos artesanales únicos.

## 🚀 Características Principales

### Para Artesanos
- **Gestión de productos**: Subir, editar y administrar productos artesanales
- **Galería de imágenes**: Subida de fotos con compresión automática
- **Perfil profesional**: Completar información personal y de contacto
- **Categorización**: Organizar productos por categorías

### Para Clientes
- **Catálogo de productos**: Explorar productos artesanales
- **Búsqueda y filtros**: Encontrar productos específicos
- **Perfil de usuario**: Gestión de información personal
- **Sistema de autenticación**: Registro e inicio de sesión seguro

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

## 🔧 Instalación y Configuración

### Prerrequisitos
- Node.js (v18 o superior)
- npm o yarn
- Expo CLI
- Cuenta de Supabase

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
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
- **Clientes**: Solo pueden ver/editar su propio perfil
- **Productos**: Artesanos pueden gestionar sus productos, clientes pueden ver productos activos
- **Storage**: Acceso controlado por usuario

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

### Subida de Imágenes
- **Compresión automática**: Quality 0.5
- **Formato base64**: Para compatibilidad con Supabase
- **Organización**: Carpetas por usuario
- **Buckets**: `avatars` para perfiles, `productos` para productos

### Proceso de Subida
1. Selección de imagen con `expo-image-picker`
2. Compresión y conversión a base64
3. Subida a Supabase Storage
4. Generación de URL pública
5. Almacenamiento de URL en base de datos

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

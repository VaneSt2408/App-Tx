# Deployment Guide - App-Tx

## 📋 Tabla de Contenidos

- [Preparación del Entorno](#preparación-del-entorno)
- [Configuración de Supabase](#configuración-de-supabase)
- [Variables de Entorno](#variables-de-entorno)
- [Build de Producción](#build-de-producción)
- [Deployment en Stores](#deployment-en-stores)
- [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)

## 🚀 Preparación del Entorno

### Prerrequisitos

#### Herramientas Necesarias
- Node.js 18+ 
- npm o yarn
- Expo CLI (`npm install -g @expo/cli`)
- EAS CLI (`npm install -g eas-cli`)
- Android Studio (para Android)
- Xcode (para iOS, solo en macOS)

#### Cuentas Requeridas
- Cuenta de Expo
- Cuenta de Supabase
- Cuenta de Apple Developer (iOS)

### Configuración Inicial

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar Expo
npx expo install --fix

# 3. Configurar EAS
eas login
eas build:configure
```

## 🔧 Configuración de Supabase

### 1. Crear Proyecto en Supabase

1. Ir a [supabase.com](https://supabase.com)
2. Crear nuevo proyecto
3. Configurar región (recomendado: más cercana a usuarios)
4. Configurar contraseña de base de datos

### 2. Configurar Base de Datos

```sql
-- Ejecutar en SQL Editor de Supabase
-- Ver docs/DATABASE.md para scripts completos

-- 1. Crear tablas
CREATE TABLE clientes (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  nombre_completo TEXT NOT NULL,
  telefono TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

-- 2. Crear índices
CREATE INDEX idx_productos_artesano_id ON productos(artesano_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_categoria ON productos(categoria);

-- 3. Habilitar RLS
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;

-- 4. Crear políticas RLS
-- (Ver docs/DATABASE.md para políticas completas)
```

### 3. Configurar Storage

```sql
-- Crear buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('avatars', 'avatars', true),
('productos', 'productos', true);

-- Configurar políticas de Storage
-- (Ver docs/DATABASE.md para políticas completas)
```

### 4. Configurar Autenticación

#### En Supabase Dashboard:
1. **Authentication > Settings**
2. **Site URL**: `https://your-app.com`
3. **Redirect URLs**: 
   - `https://your-app.com/auth/callback`
   - `exp://localhost:8081` (desarrollo)
4. **Email Templates**: Personalizar templates
5. **OAuth Providers**: Configurar Google OAuth

#### Configuración de Google OAuth:
2. Crear proyecto o seleccionar existente
3. Habilitar Google+ API
4. Crear credenciales OAuth 2.0
5. Configurar URIs de redirección:
   - `https://your-project.supabase.co/auth/v1/callback`

## 🔐 Variables de Entorno

### Archivo `.env.local` (Desarrollo)

```env
# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# App Configuration
EXPO_PUBLIC_APP_NAME=App-Tx
EXPO_PUBLIC_APP_VERSION=1.0.0

# Deep Linking
EXPO_PUBLIC_SCHEME=apptx
EXPO_PUBLIC_DOMAIN=apptx.com
```

### Archivo `.env.production` (Producción)

```env
# Supabase Configuration (Producción)
EXPO_PUBLIC_SUPABASE_URL=https://your-project-prod.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-prod-anon-key

# App Configuration
EXPO_PUBLIC_APP_NAME=App-Tx
EXPO_PUBLIC_APP_VERSION=1.0.0

# Deep Linking (Producción)
EXPO_PUBLIC_SCHEME=apptx
EXPO_PUBLIC_DOMAIN=apptx.com
```

### Configuración en `app.json`

```json
{
  "expo": {
    "name": "App-Tx",
    "slug": "app-tx",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.apptx.mobile"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.apptx.mobile"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "scheme": "apptx",
    "plugins": [
      "expo-router"
    ]
  }
}
```

## 🏗️ Build de Producción

### Configuración de EAS

#### `eas.json`
```json
{
  "cli": {
    "version": ">= 3.0.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      },
      "ios": {
        "autoIncrement": "buildNumber"
      }
    }
  },
  "submit": {
    "production": {
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      },
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "1234567890",
        "appleTeamId": "ABCD123456"
      }
    }
  }
}
```

### Build para Android

```bash
# 1. Configurar variables de entorno
export EXPO_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export EXPO_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"

# 2. Build de desarrollo
eas build --platform android --profile development

# 3. Build de preview
eas build --platform android --profile preview

# 4. Build de producción
eas build --platform android --profile production
```

### Build para iOS

```bash
# 1. Build de desarrollo
eas build --platform ios --profile development

# 2. Build de preview
eas build --platform ios --profile preview

# 3. Build de producción
eas build --platform ios --profile production
```

### Build Universal (Ambas Plataformas)

```bash
# Build para ambas plataformas
eas build --platform all --profile production
```

## 📱 Deployment en Stores

### Google Play Store

#### 1. Preparación
```bash
# Generar keystore (si no existe)
keytool -genkey -v -keystore apptx-release-key.keystore -alias apptx -keyalg RSA -keysize 2048 -validity 10000

# Configurar en eas.json
```


```bash
# Subir automáticamente
eas submit --platform android --profile production

# O subir manualmente el AAB generado
```

- **App Bundle**: Subir el archivo `.aab`
- **Store Listing**: Completar información de la app
- **Content Rating**: Configurar clasificación
- **Pricing**: Configurar precio (gratis)
- **Release**: Crear release interno/prueba

### Apple App Store

#### 1. Preparación
```bash
# Configurar certificados en EAS
eas credentials

# Build para App Store
eas build --platform ios --profile production
```

#### 2. Subir a App Store Connect
```bash
# Subir automáticamente
eas submit --platform ios --profile production

# O usar Xcode/Transporter
```

#### 3. Configuración en App Store Connect
- **App Information**: Completar metadatos
- **Pricing**: Configurar precio (gratis)
- **App Review**: Enviar para revisión
- **TestFlight**: Configurar testing beta

## 🔍 Monitoreo y Mantenimiento

### Monitoreo de Aplicación

#### Métricas Importantes
- **Crashes**: Monitorear crashes con Sentry
- **Performance**: Tiempo de carga de pantallas
- **Storage**: Uso de Supabase Storage
- **Database**: Consultas lentas y uso de recursos

#### Configuración de Sentry
```bash
# Instalar Sentry
npm install @sentry/react-native

# Configurar en App.js
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: __DEV__ ? 'development' : 'production',
});
```

### Monitoreo de Supabase

#### Dashboard de Supabase
- **Database**: Monitorear consultas y performance
- **Auth**: Usuarios activos y autenticaciones
- **Storage**: Uso de almacenamiento
- **API**: Requests y rate limits

#### Alertas Configuradas
- **High CPU Usage**: > 80% por 5 minutos
- **Database Connections**: > 100 conexiones simultáneas
- **Storage Quota**: > 80% de cuota utilizada
- **Failed Requests**: > 5% de requests fallidos

### Mantenimiento Regular

#### Semanal
- [ ] Revisar logs de errores
- [ ] Verificar performance de base de datos
- [ ] Revisar uso de storage
- [ ] Actualizar dependencias

#### Mensual
- [ ] Análisis de uso de la aplicación
- [ ] Optimización de consultas lentas
- [ ] Limpieza de datos antiguos
- [ ] Backup de base de datos

#### Trimestral
- [ ] Actualización de dependencias principales
- [ ] Revisión de seguridad
- [ ] Optimización de imágenes
- [ ] Análisis de costos

## 🚨 Troubleshooting

### Problemas Comunes

#### Build Failures
```bash
# Limpiar cache
expo start --clear
npx expo install --fix

# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

#### Supabase Connection Issues
```bash
# Verificar variables de entorno
echo $EXPO_PUBLIC_SUPABASE_URL
echo $EXPO_PUBLIC_SUPABASE_ANON_KEY

# Probar conexión
npx expo start --clear
```

#### Storage Upload Issues
- Verificar políticas RLS
- Revisar permisos de bucket
- Comprobar tamaño de archivos
- Verificar formato de archivos

### Logs y Debugging

#### Habilitar Logs Detallados
```javascript
// En desarrollo

// En producción
import { LogBox } from 'react-native';
LogBox.ignoreAllLogs(); // Solo en producción
```

#### Debugging de Supabase
```javascript
// Habilitar debug en Supabase client
const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      debug: __DEV__ // Solo en desarrollo
    }
  }
);
```

## 📊 Métricas de Deployment

### KPIs Importantes
- **Build Success Rate**: > 95%
- **Deployment Time**: < 30 minutos
- **App Size**: < 50MB
- **Startup Time**: < 3 segundos
- **Crash Rate**: < 1%

### Monitoreo Continuo
- **Uptime**: 99.9%
- **Response Time**: < 200ms
- **Error Rate**: < 1%
- **User Satisfaction**: > 4.5/5

---

**Última actualización**: Diciembre 2024
**Versión de Deployment**: 1.0.0

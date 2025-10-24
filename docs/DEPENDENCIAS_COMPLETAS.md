# Dependencias Completas del Proyecto App-Tx

## 📦 Resumen de Dependencias

Este documento detalla todas las dependencias utilizadas en el proyecto App-Tx, organizadas por categorías y con instrucciones de instalación.

## 🎯 Dependencias Principales

### Core de React Native y Expo
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

**Instalación:**
```bash
npm install expo@~50.0.0 react@18.2.0 react-native@0.73.0 @expo/vector-icons@^14.0.0 expo-router@~3.4.0 expo-status-bar@~1.11.0
```

## 🔐 Dependencias de Autenticación

### Supabase y Autenticación
```json
{
  "@supabase/supabase-js": "^2.38.0",
  "expo-auth-session": "~5.4.0",
  "expo-crypto": "~12.8.0",
  "expo-linking": "~6.2.0"
}
```

**Instalación:**
```bash
npm install @supabase/supabase-js@^2.38.0 expo-auth-session@~5.4.0 expo-crypto@~12.8.0 expo-linking@~6.2.0
```

**Propósito:**
- `@supabase/supabase-js`: Cliente principal de Supabase
- `expo-auth-session`: Manejo de sesiones de autenticación
- `expo-crypto`: Funciones criptográficas
- `expo-linking`: Deep linking para autenticación

## 🎨 Dependencias de UI/UX

### Animaciones y Gradientes
```json
{
  "expo-linear-gradient": "~12.7.0",
  "moti": "^0.25.0",
  "react-native-reanimated": "~3.6.0",
  "react-native-safe-area-context": "4.8.0",
  "react-native-screens": "~3.29.0"
}
```

**Instalación:**
```bash
npm install expo-linear-gradient@~12.7.0 moti@^0.25.0 react-native-reanimated@~3.6.0 react-native-safe-area-context@4.8.0 react-native-screens@~3.29.0
```

**Propósito:**
- `expo-linear-gradient`: Gradientes personalizados
- `moti`: Animaciones fluidas y modernas
- `react-native-reanimated`: Animaciones de alto rendimiento
- `react-native-safe-area-context`: Manejo de áreas seguras
- `react-native-screens`: Optimización de pantallas

## 📸 Dependencias de Imágenes

### Manejo de Imágenes y Archivos
```json
{
  "expo-image-picker": "~14.7.0",
  "expo-file-system": "~16.0.0",
  "base64-arraybuffer": "^1.0.0"
}
```

**Instalación:**
```bash
npm install expo-image-picker@~14.7.0 expo-file-system@~16.0.0 base64-arraybuffer@^1.0.0
```

**Propósito:**
- `expo-image-picker`: Selección de imágenes de galería/cámara
- `expo-file-system`: Manejo de archivos del sistema
- `base64-arraybuffer`: Conversión de base64 a ArrayBuffer

## 🔧 Dependencias de Utilidades

### Utilidades y Polyfills
```json
{
  "react-native-get-random-values": "~1.9.0",
  "react-native-url-polyfill": "^2.0.0"
}
```

**Instalación:**
```bash
npm install react-native-get-random-values@~1.9.0 react-native-url-polyfill@^2.0.0
```

**Propósito:**
- `react-native-get-random-values`: Polyfill para crypto.getRandomValues
- `react-native-url-polyfill`: Polyfill para URL en React Native

## 📋 Instalación Completa

### Método 1: Instalación Automática
```bash
# Clonar el repositorio
git clone <repository-url>
cd App-Tx

# Instalar todas las dependencias
npm install

# O con yarn
yarn install
```

### Método 2: Instalación Manual por Categorías
```bash
# 1. Dependencias principales
npm install expo@~50.0.0 react@18.2.0 react-native@0.73.0 @expo/vector-icons@^14.0.0 expo-router@~3.4.0 expo-status-bar@~1.11.0

# 2. Autenticación
npm install @supabase/supabase-js@^2.38.0 expo-auth-session@~5.4.0 expo-crypto@~12.8.0 expo-linking@~6.2.0

# 3. UI/UX
npm install expo-linear-gradient@~12.7.0 moti@^0.25.0 react-native-reanimated@~3.6.0 react-native-safe-area-context@4.8.0 react-native-screens@~3.29.0

# 4. Imágenes
npm install expo-image-picker@~14.7.0 expo-file-system@~16.0.0 base64-arraybuffer@^1.0.0

# 5. Utilidades
npm install react-native-get-random-values@~1.9.0 react-native-url-polyfill@^2.0.0
```

## 🔍 Verificación de Instalación

### Verificar Dependencias Instaladas
```bash
# Ver todas las dependencias
npm list

# Ver dependencias específicas
npm list expo
npm list @supabase/supabase-js
npm list expo-image-picker
```

### Verificar Versiones
```bash
# Ver versión de Expo
npx expo --version

# Ver versión de React Native
npx react-native --version

# Ver versión de Node
node --version
```

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Error de Versiones
```bash
# Limpiar cache
npm cache clean --force

# Eliminar node_modules
rm -rf node_modules package-lock.json

# Reinstalar
npm install
```

#### 2. Error de Expo CLI
```bash
# Instalar Expo CLI globalmente
npm install -g @expo/cli

# Verificar instalación
expo --version
```

#### 3. Error de Dependencias Nativas
```bash
# Limpiar y reinstalar
npx expo install --fix

# O específicamente
npx expo install expo-image-picker expo-file-system
```

### Dependencias Opcionales

#### Para Desarrollo
```json
{
  "@expo/cli": "latest",
  "expo-dev-client": "latest"
}
```

#### Para Testing (Futuro)
```json
{
  "jest": "^29.0.0",
  "@testing-library/react-native": "^12.0.0",
  "detox": "^20.0.0"
}
```

## 📊 Resumen de Dependencias

### Total de Dependencias
- **Principales**: 6 dependencias
- **Autenticación**: 4 dependencias
- **UI/UX**: 5 dependencias
- **Imágenes**: 3 dependencias
- **Utilidades**: 2 dependencias
- **Total**: 20 dependencias principales

### Tamaño Estimado
- **node_modules**: ~500MB
- **Tiempo de instalación**: 2-5 minutos
- **Espacio en disco**: ~1GB (incluyendo cache)

## 🔄 Actualización de Dependencias

### Actualizar Todas
```bash
# Verificar actualizaciones
npm outdated

# Actualizar todas
npm update

# O específicamente
npm install expo@latest
```

### Actualizar Específicas
```bash
# Actualizar Supabase
npm install @supabase/supabase-js@latest

# Actualizar Expo
npm install expo@latest
```

## 📝 Notas Importantes

### Compatibilidad
- **Node.js**: v18 o superior
- **npm**: v8 o superior
- **Expo SDK**: 50.x
- **React Native**: 0.73.x

### Requisitos del Sistema
- **Android**: API 21+ (Android 5.0+)
- **iOS**: iOS 13.0+
- **Expo Go**: Última versión

### Configuración Adicional
```bash
# Configurar Expo CLI
npx expo install --fix

# Verificar configuración
npx expo doctor
```

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0.0  
**Mantenido por**: Equipo de desarrollo App-Tx

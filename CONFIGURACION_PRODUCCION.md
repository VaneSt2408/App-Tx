# Configuración para Producción - Recuperación de Contraseña

## Cambios Realizados

### 1. Función Utilitaria Centralizada para URIs de Redirección

Se creó una función utilitaria `getRedirectUri()` en todos los archivos de servicios que detecta automáticamente el entorno y genera la URI apropiada:

- **Desarrollo**: Usa `useProxy: true` (funciona con Expo Go)
- **Producción**: Usa el scheme personalizado `txapp://` configurado en `app.json`

### 2. Métodos de Autenticación Actualizados

Se actualizaron todos los métodos que requieren redirección externa:

#### `src/services/authService.js`:
- ✅ `signInWithGoogle()` - Autenticación con Google
- ✅ `resetPasswordForEmail()` - Recuperación de contraseña

#### `src/services/userService.js`:
- ✅ `sendArtesanoInvite()` - Magic Link para invitación de artesanos

#### `src/services/produccionService.js`:
- ✅ `signInWithGoogle()` - Autenticación con Google (versión alternativa)
- ✅ `sendArtesanoInvite()` - Magic Link para invitación de artesanos (versión alternativa)

### 3. Actualización del manejo de Deep Links

Se actualizó el archivo `src/context/AuthContext.tsx` para manejar correctamente todos los tipos de deep links:

- Deep links de recuperación de contraseña (`resetPassword`)
- Deep links de Magic Link (invitaciones)
- Deep links de autenticación con Google

Los cambios permiten detectar específicamente diferentes tipos de deep links y establecer sesiones apropiadas.

## Configuración Requerida en Supabase

Para que el flujo funcione correctamente en producción, necesitas configurar las siguientes URLs en tu dashboard de Supabase:

### 1. Site URL
```
https://tu-dominio.com
```

### 2. Redirect URLs (Agregar estas URLs)
```
# Para desarrollo (Expo Go) - Todas las funcionalidades
https://auth.expo.io/@tu-usuario/TxApp
https://auth.expo.io/@tu-usuario/TxApp/resetPassword

# Para producción (APK compilado) - Todas las funcionalidades
txapp://
txapp://resetPassword

# Para web (si aplica)
https://tu-dominio.com
https://tu-dominio.com/resetPassword
```

### 3. Pasos para configurar en Supabase:

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Authentication** → **URL Configuration**
3. En **Site URL**, agrega tu dominio de producción
4. En **Redirect URLs**, agrega las URLs mencionadas arriba
5. Guarda los cambios

## Testing

### En Desarrollo
```bash
# Inicia el servidor de desarrollo
npm start

# Prueba el flujo de recuperación de contraseña
# La app usará automáticamente el proxy de Expo
```

### En Producción
```bash
# Compila la app para producción
expo build:android
# o
expo build:ios

# Instala la APK/IPA generada
# Prueba el flujo de recuperación de contraseña
# La app usará el scheme txapp://
```

## Flujos de Autenticación Actualizados

### Flujo de Recuperación de Contraseña
1. Usuario solicita recuperación de contraseña
2. Se envía email con enlace de recuperación
3. Usuario hace clic en el enlace
4. La app se abre automáticamente con el deep link
5. Se establece sesión temporal
6. Usuario puede cambiar su contraseña
7. Se redirige al login

### Flujo de Autenticación con Google
1. Usuario selecciona "Iniciar sesión con Google"
2. Se abre navegador con Google OAuth
3. Usuario autentica con Google
4. Google redirige a la app con tokens
5. Se establece sesión en Supabase
6. Usuario queda autenticado

### Flujo de Magic Link (Invitations)
1. Admin envía invitación a artesano
2. Se envía email con Magic Link
3. Usuario hace clic en el enlace
4. La app se abre automáticamente
5. Se establece sesión con rol temporal
6. Usuario completa registro
7. Rol se actualiza a "artesano"

## Troubleshooting

### Si los deep links no funcionan:

1. **Verifica la configuración de Supabase**: Asegúrate de que las URLs de redirección estén correctamente configuradas
2. **Verifica el scheme**: Confirma que `txapp` esté configurado en `app.json`
3. **Revisa los logs**: Los logs mostrarán qué URI se está generando y si hay errores
4. **Prueba en desarrollo primero**: Asegúrate de que funcione con Expo Go antes de compilar para producción

### Logs importantes a revisar:
- `🔗 Redirect URI generada:`
- `📱 Entorno: Desarrollo/Producción`
- `🔑 Deep link de recuperación de contraseña detectado`
- `✅ Sesión temporal establecida correctamente`

## Notas Importantes

- El scheme `txapp` debe coincidir exactamente con el configurado en `app.json`
- Las URLs de redirección en Supabase deben incluir tanto la versión de desarrollo como la de producción
- La sesión temporal permite al usuario cambiar la contraseña sin estar completamente autenticado
- Después de cambiar la contraseña, el usuario debe iniciar sesión nuevamente

# Correcciones Aplicadas - Sistema de Cambio de Contraseña

## 🎯 Objetivos de Seguridad

Implementar un sistema de seguridad robusto para prevenir:
- **Robo de cuentas** mediante fuerza bruta
- **Acceso no autorizado** al cambio de contraseña
- **Pérdida de datos** por ataques automatizados

---

## ✅ Correcciones Implementadas

### 1. **Race Condition en Contadores** ✅ COMPLETADO

**Problema:**
- El estado `totalFailedAttempts` se leía antes de actualizarse
- Los contadores estaban dentro de callbacks asíncronos
- Permitía más intentos de los permitidos

**Solución:**
```javascript
// Usar refs para contadores que no causan re-renders
const totalFailedAttemptsRef = useRef(0);
const currentPasswordAttemptsRef = useRef(0);

// En la función de verificación
currentPasswordAttemptsRef.current = currentPasswordAttemptsRef.current + 1;
totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1;
```

**Ubicación:** `app/(app)/ClientProfile.js` líneas 51-53

---

### 2. **Persistencia de Intentos Fallidos** ✅ COMPLETADO

**Problema:**
- Los intentos se perdían al recargar la app
- Un atacante podía cerrar/reabrir la app para resetear intentos

**Solución:**
```javascript
// Cargar desde AsyncStorage
const loadFailedAttempts = async () => {
  const attempts = await AsyncStorage.getItem('passwordFailedAttempts');
  if (attempts !== null) {
    totalFailedAttemptsRef.current = parseInt(attempts);
    setTotalFailedAttempts(parseInt(attempts));
  }
};

// Guardar en AsyncStorage
const saveFailedAttempts = async (attempts) => {
  await AsyncStorage.setItem('passwordFailedAttempts', attempts.toString());
  totalFailedAttemptsRef.current = attempts;
};
```

**Ubicación:** `app/(app)/ClientProfile.js` líneas 75-109

---

### 3. **Mejora del Cierre de Sesión** ✅ COMPLETADO

**Problema:**
- El alert se mostraba DESPUÉS de cerrar sesión
- No había opción de confirmar antes del cierre
- El usuario perdía su sesión sin previo aviso

**Solución:**
```javascript
// Mostrar alerta ANTES de cerrar sesión
Alert.alert(
  'Sesión será cerrada por seguridad',
  'Has excedido 6 intentos fallidos...',
  [
    {
      text: 'Entendido',
      onPress: async () => {
        // Limpiar y cerrar sesión
        await clearFailedAttempts();
        await signOut();
        router.replace('/(auth)');
      }
    }
  ]
);
```

**Ubicación:** `app/(app)/ClientProfile.js` líneas 414-446

---

### 4. **Unificar Longitud Mínima de Contraseña** ✅ COMPLETADO

**Problema:**
- Contraseña actual: 6 caracteres
- Nueva contraseña: 8 caracteres
- Inconsistencia en validaciones

**Solución:**
```javascript
// Cambiar todas las validaciones a 8 caracteres mínimo
if (passwordData.currentPassword.length < 8) {
  Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
  return;
}
```

**Ubicaciones:**
- `app/(app)/ClientProfile.js` línea 383
- `app/(app)/ClientProfile.js` línea 611 (eliminación de perfil)
- `src/services/profileInfo.js` línea 230

---

### 5. **Eliminar Instancia Redundante de Supabase** ✅ COMPLETADO

**Problema:**
- Se creaba otra instancia de Supabase innecesariamente
- Credenciales expuestas en código
- Duplicación de configuración

**Solución:**
```javascript
// ANTES: Creaba instancia temporal
const tempSupabase = createClient(url, key, {...});

// AHORA: Usa el cliente importado
const { error } = await supabase.auth.signInWithPassword({
  email: user.email,
  password: currentPassword
});
```

**Ubicación:** `src/services/profileInfo.js` líneas 234-256

---

## 📋 Lógica de Seguridad Implementada

### Flujo de Validación:

1. **Usuario abre modal de cambio de contraseña**
   - Se cargan intentos fallidos anteriores (si existen)
   - Contador local se resetea a 0

2. **Usuario debe escribir contraseña actual correctamente**
   - Si es incorrecta → suma 1 al contador
   - Muestra: "Intentos restantes: X"
   - Guarda intentos en AsyncStorage

3. **Después de 3 intentos fallidos:**
   - Modal se cierra automáticamente
   - Botón "Cambiar contraseña" se bloquea por 5 minutos
   - Timer visible: "Bloqueado (X min)"
   - Muestra: "Acceso bloqueado por 5 minutos"

4. **Después de 6 intentos fallidos (3 + 3):**
   - Muestra alerta explicativa
   - Usuario hace clic en "Entendido"
   - Limpia intentos de AsyncStorage
   - Cierra sesión automáticamente
   - Redirige al login
   - Muestra: "Sesión cerrada por seguridad"

---

## 🔒 Características de Seguridad

### ✅ Implementadas:

1. **Bloqueo temporal** (5 minutos) después de 3 intentos
2. **Persistencia de intentos** con AsyncStorage
3. **Cierre automático de sesión** después de 6 intentos
4. **Previene ataques de fuerza bruta**
5. **Feedback visual** del estado de bloqueo
6. **Alerta antes de cerrar sesión** (mejora UX)

### 🔒 Medidas Adicionales:

- **No se resetean intentos** al cancelar el modal
- **Persisten entre sesiones** de la app
- **Solo se limpian** cuando:
  - Se valida correctamente la contraseña
  - Se cierra sesión por seguridad
  - Se cambia exitosamente la contraseña

---

## 📝 Estado de TODOs

- ✅ **Race condition corregida**
- ✅ **Persistencia con AsyncStorage**
- ✅ **Mejora del cierre de sesión**
- ✅ **Longitud mínima unificada (8 caracteres)**
- ✅ **Eliminada instancia redundante de Supabase**
- ⏳ Pendientes (opcionales):
  - Validación en tiempo real de confirmación
  - Debounce en validaciones
  - Mover credenciales a .env

---

## 🧪 Cómo Probar

### Escenario 1: Validación exitosa
1. Abrir modal "Cambiar contraseña"
2. Escribir contraseña actual CORRECTA
3. Escribir nueva contraseña válida
4. Confirmar contraseña
5. Clic en "Cambiar contraseña"
6. ✅ Debe redirigir al login con mensaje de éxito

### Escenario 2: Bloqueo temporal
1. Abrir modal "Cambiar contraseña"
2. Escribir contraseña INCORRECTA 3 veces
3. ✅ Modal se cierra automáticamente
4. ✅ Botón muestra "Bloqueado (5 min)"
5. Intentar abrir modal de nuevo
6. ✅ Muestra "Inténtalo de nuevo en X minutos"

### Escenario 3: Cierre de sesión
1. Abrir modal "Cambiar contraseña"
2. Escribir contraseña INCORRECTA 6 veces (2 sesiones)
3. ✅ Muestra alerta: "Sesión será cerrada por seguridad"
4. Clic en "Entendido"
5. ✅ Cierra sesión y redirige al login

### Escenario 4: Persistencia entre sesiones
1. Escribir contraseña INCORRECTA 4 veces
2. Cerrar completamente la app
3. Reabrir la app
4. ✅ Debe recordar los 4 intentos
5. ✅ Solo quedan 2 intentos antes del cierre

---

## 📊 Beneficios

### Seguridad:
- 🛡️ Previene ataques de fuerza bruta
- 🔒 Bloqueo temporal reduce riesgo
- 🚫 Cierre de sesión automático protege cuenta
- 💾 Persistencia evita que se evite el bloqueo

### UX:
- ✅ Feedback claro del estado
- ✅ Advertencia antes de cerrar sesión
- ✅ Indicador de intentos restantes
- ✅ Timer visible de bloqueo

---

**Fecha:** 2025-01-27  
**Archivos modificados:** 
- `app/(app)/ClientProfile.js`
- `src/services/profileInfo.js`


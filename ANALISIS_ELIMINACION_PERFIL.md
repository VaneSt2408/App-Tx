# Análisis de Eliminación de Perfil por Contraseña - ClientProfile.js

## 🔍 Resumen Ejecutivo

**Ubicación:** `app/(app)/ClientProfile.js`  
**Funcionalidad:** Eliminación de perfil con validación de contraseña  
**Seguridad:** Implementada con bloqueo temporal y cierre de sesión

---

## 🎯 FLUJO DE ELIMINACIÓN DE PERFIL

### **Paso 1: Usuario intenta eliminar perfil**
```javascript
handleDeleteProfile() → Alert de confirmación → Abre modal
```

### **Paso 2: Validación de contraseña**
```javascript
handleVerifyDeletePassword() → Valida con instancia temporal → NO recarga sesión
```

### **Paso 3: Confirmación final**
```javascript
handleConfirmDeleteProfile() → Alert final de confirmación → Elimina perfil
```

---

## ⚠️ PROBLEMAS CRÍTICOS IDENTIFICADOS

### 1. **Race Condition en Contadores** 🔴 CRÍTICO

**Ubicación:** Líneas 628-689

**Problema:**
```javascript
setDeletePasswordAttempts(prev => {
  const newAttempts = prev + 1;
  const newTotalAttempts = totalDeleteAttempts + 1; // ❌ LEE ESTADO DESACTUALIZADO
  setTotalDeleteAttempts(newTotalAttempts); // ❌ RACE CONDITION
  
  if (newAttempts >= 3) {
    // Bloquea acceso
  }
  return newAttempts;
});
```

**Impacto:**
- Puede permitir más intentos de los permitidos
- El cierre de sesión a los 6 intentos puede no ejecutarse
- Contadores desincronizados

---

### 2. **No Usa AsyncStorage para Persistencia** 🟡 ALTA

**Ubicación:** Estados de eliminación no persisten

**Problema:**
- Los intentos de eliminación solo viven en memoria
- Si el usuario cierra y reabre la app → Se resetean intentos
- Un atacante puede simplemente cerrar la app para resetear

**Comparación con cambio de contraseña:**
- ✅ Cambio de contraseña: Usa AsyncStorage
- ❌ Eliminación de perfil: NO usa AsyncStorage

---

### 3. **Cierre de Sesión Antes de Alert** 🟡 ALTA

**Ubicación:** Líneas 640-665

**Problema:**
```javascript
setTimeout(() => {
  // Limpia estados...
  signOut(); // ❌ Cierra sesión ANTES del alert
  
  Alert.alert(
    'Sesión cerrada por seguridad',
    'Has excedido 6 intentos fallidos...',
    [...]
  );
}, 2000);
```

**Impacto:**
- La sesión se cierra primero
- El alert se muestra después
- El usuario no puede interactuar correctamente

---

### 4. **Contadores Independientes vs Compartidos** 🔵 CONFUSO

**Estados duplicados:**
```javascript
// Para cambio de contraseña:
totalFailedAttemptsRef
totalFailedAttempts

// Para eliminación (INDEPENDIENTES):
totalDeleteAttempts  // ❌ No está compartido
deletePasswordAttemptsRef
```

**Pregunta:** ¿Deberían compartirse los intentos entre cambio y eliminación?

**Actualmente:**
- Si fallas 3 veces cambiando contraseña → Bloqueado para cambio
- Pero puedes intentar eliminar perfil 3 veces (sin bloqueo compartido)

**Seguridad:**
- Un atacante puede alternar entre intentar cambiar contraseña y eliminar perfil
- Bypassea el sistema de bloqueo

---

### 5. **No Hay Persistencia de Bloqueo de Eliminación** 🟡 MEDIA

**Ubicación:** Estado `deletePasswordBlocked`

**Problema:**
- Solo vive en memoria
- Al recargar la app, el bloqueo se pierde
- Un atacante puede cerrar y reabrir para evitar bloqueo

---

## ✅ ASPECTOS BIEN IMPLEMENTADOS

### ✅ Doble Confirmación
- Primera: Alert antes de abrir modal
- Segunda: Alert final antes de eliminar

### ✅ Validación de Longitud (8 caracteres)
- Consistente con cambio de contraseña

### ✅ Bloqueo Temporal (5 minutos)
- Después de 3 intentos fallidos

### ✅ Cierre de Sesión Automático
- Después de 6 intentos fallidos totales

### ✅ Diferencia entre Google y Contraseña
- Usuarios Google no necesitan validar contraseña

---

## 📊 COMPARACIÓN: Cambio vs Eliminación

| Característica | Cambio Contraseña | Eliminación Perfil |
|---|---|---|
| AsyncStorage | ✅ SÍ | ❌ NO |
| Refs para race conditions | ✅ SÍ | ❌ NO |
| Alerta antes de cerrar sesión | ✅ SÍ | ❌ NO (cierra primero) |
| Bloqueo persistente | ✅ SÍ | ❌ NO |
| Validación con instancia temporal | ✅ SÍ | ✅ SÍ |
| Longitud mínima (8 chars) | ✅ SÍ | ✅ SÍ |

---

## 🔧 RECOMENDACIONES DE CORRECCIÓN

### Prioridad 🔴 ALTA:

1. **Arreglar race condition:**
```javascript
// Usar refs en lugar de estado para contadores
const totalDeleteAttemptsRef = useRef(0);

// En la función:
deletePasswordAttemptsRef.current = deletePasswordAttemptsRef.current + 1;
totalDeleteAttemptsRef.current = totalDeleteAttemptsRef.current + 1;

const newAttempts = deletePasswordAttemptsRef.current;
const newTotalAttempts = totalDeleteAttemptsRef.current;
```

2. **Agregar persistencia con AsyncStorage:**
```javascript
// Función para guardar intentos de eliminación
const saveDeleteAttempts = async (attempts) => {
  await AsyncStorage.setItem('deleteFailedAttempts', attempts.toString());
};

// Cargar al montar
useEffect(() => {
  if (visible) loadDeleteAttempts();
}, [visible]);
```

3. **Compartir contadores entre cambio y eliminación:**
```javascript
// Usar el MISMO contador de intentos
// Si fallas 3 veces cambiando contraseña → También bloqueado para eliminar
totalFailedAttemptsRef // COMPARTIDO entre ambas funciones
```

### Prioridad 🟡 MEDIA:

4. **Mejorar alertas:**
```javascript
// Mostrar alerta ANTES de cerrar sesión
Alert.alert(
  'Sesión será cerrada',
  'Tienes 6 intentos fallidos...',
  [
    {
      text: 'Entendido',
      onPress: async () => {
        await clearDeleteAttempts();
        await signOut();
        router.replace('/(auth)');
      }
    }
  ]
);
```

---

## 💡 PROPUESTA DE REFACTORIZACIÓN

### Opción A: Mover a componente reutilizable
Crear `DeleteProfileModal.js` similar a `ChangePasswordModal.js`:
- Lógica centralizada
- Persistencia con AsyncStorage
- Sin race conditions
- Reutilizable en Cliente y Artesano

### Opción B: Compartir contadores
```javascript
// Usar contadores compartidos
totalFailedAttemptsRef  // Para AMBOS: cambio y eliminación
currentPasswordAttemptsRef  // Para cambio de contraseña
deletePasswordAttemptsRef  // Para eliminación

// Si totalFailedAttempts >= 6 → Bloquea AMBAS funciones
```

### Opción C: Servicio de seguridad centralizado
Crear `src/services/securityService.js`:
```javascript
export const useSecurityAttempts = () => {
  const attemptsRef = useRef(0);
  const [blocked, setBlocked] = useState(false);
  
  const incrementAttempts = () => {
    attemptsRef.current++;
    if (attemptsRef.current >= 6) {
      setBlocked(true);
      // Cerrar sesión
    }
  };
  
  return { attemptsRef, blocked, incrementAttempts };
};
```

---

## 🎯 PRÓXIMOS PASOS SUGERIDOS

1. ✅ **Arreglar race condition** en handleVerifyDeletePassword
2. ✅ **Agregar AsyncStorage** para persistir intentos de eliminación
3. ✅ **Compartir contadores** entre cambio y eliminación (seguridad mejorada)
4. ⏳ **Crear DeleteProfileModal** reutilizable (como ChangePasswordModal)
5. ⏳ **Mejorar UX** del cierre de sesión (mostrar alerta antes)

---

**Fecha:** 2025-01-27  
**Archivos analizados:** `app/(app)/ClientProfile.js`  
**Líneas analizadas:** 556-695


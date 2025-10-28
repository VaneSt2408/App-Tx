# Migración de Lógica de Seguridad al Modal de Cambio de Contraseña

## ✅ Cambios Realizados

### 1. **ChangePasswordModal.js** - ACTUALIZADO ✨

Se movió toda la lógica de seguridad desde `ClientProfile.js` al modal reutilizable.

#### **Nuevos imports agregados:**
```javascript
import { useState, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '../src/context/AuthContext';
import { useRouter } from 'expo-router';
```

#### **Nuevos estados agregados:**
- `currentPasswordAttempts` - Intentos actuales en esta sesión
- `passwordBlocked` - Si el acceso está bloqueado
- `blockTimeRemaining` - Tiempo restante de bloqueo
- `totalFailedAttempts` - Intentos totales fallidos (persistente)

#### **Refs para evitar race conditions:**
- `totalFailedAttemptsRef` - Contador persistente con refs
- `currentPasswordAttemptsRef` - Contador de sesión con refs

#### **Nuevas funciones:**
1. `loadFailedAttempts()` - Carga intentos desde AsyncStorage
2. `saveFailedAttempts()` - Guarda intentos en AsyncStorage
3. `clearFailedAttempts()` - Limpia intentos cuando se valida correctamente

#### **Lógica de seguridad implementada:**
- ✅ **3 intentos fallidos** → Bloqueo de 5 minutos
- ✅ **6 intentos fallidos** → Cierre de sesión automático
- ✅ Persistencia de intentos entre sesiones de la app
- ✅ Feedback visual de intentos fallidos
- ✅ Validación de longitud mínima (8 caracteres)

---

### 2. **ArtesanoProfile.js** - YA ESTÁ LISTO ✅

El archivo ya importa y usa `ChangePasswordModal`:
```javascript
import ChangePasswordModal from '../../components/ChangePasswordModal';

// Uso del modal:
<ChangePasswordModal
  visible={showPasswordModal}
  onClose={() => setShowPasswordModal(false)}
  onSuccess={handlePasswordChangeSuccess}
/>
```

**Ya funciona correctamente** porque el modal ahora tiene toda la lógica de seguridad.

---

### 3. **ClientProfile.js** - OPCIONAL (puede seguir usando su propia lógica)

Actualmente `ClientProfile.js` tiene su propia implementación inline de la lógica de seguridad. 

**Opciones:**
- **Opción A:** Mantener la implementación inline (ya corregida)
- **Opción B:** Cambiar para usar el modal (recomendado para consistencia)

---

## 📊 Beneficios de la Migración

### ✅ Antes:
- Lógica duplicada en `ClientProfile.js`
- No había un componente reutilizable
- Código largo y difícil de mantener

### ✅ Ahora:
- ✅ **1 componente reutilizable** (`ChangePasswordModal.js`)
- ✅ **Misma lógica de seguridad** en cliente y artesano
- ✅ **Código centralizado** y fácil de mantener
- ✅ **Persistencia de intentos** funcional
- ✅ **Sin race conditions** (usa refs)
- ✅ **Feedback visual** de intentos

---

## 🔒 Características de Seguridad Implementadas

### Flujo Completo:

1. **Usuario abre modal:**
   - Se cargan intentos fallidos anteriores
   - Contador local se resetea a 0

2. **Validación de contraseña actual:**
   - Si es correcta → Desbloquea campos
   - Si es incorrecta → Suma 1 al contador
   - Muestra "Intentos restantes: X"

3. **Después de 3 intentos:**
   - Modal se cierra automáticamente
   - Bloqueado por 5 minutos
   - Muestra "Acceso bloqueado por 5 minutos"

4. **Después de 6 intentos:**
   - Muestra alerta explicativa
   - Usuario confirma
   - Cierra sesión automáticamente
   - Redirige al login

---

## 🎯 Cómo Usar el Modal Actualizado

### En cualquier componente:

```javascript
import ChangePasswordModal from '../../components/ChangePasswordModal';

const [showPasswordModal, setShowPasswordModal] = useState(false);

// Abrir modal
<TouchableOpacity onPress={() => setShowPasswordModal(true)}>
  <Text>Cambiar Contraseña</Text>
</TouchableOpacity>

// Modal con lógica de seguridad completa
<ChangePasswordModal
  visible={showPasswordModal}
  onClose={() => setShowPasswordModal(false)}
  onSuccess={() => {
    // Opcional: callback cuando se cambia exitosamente
    router.replace('/(auth)');
  }}
/>
```

---

## ✅ Testing

### Probar en:
1. **Perfil de Cliente** - Usar el modal actualizado
2. **Perfil de Artesano** - Ya usa el modal (funciona automáticamente)

### Escenarios a probar:
1. ✅ Validación exitosa de contraseña
2. ✅ 3 intentos fallidos → Bloqueo temporal
3. ✅ 6 intentos fallidos → Cierre de sesión
4. ✅ Persistencia entre sesiones de la app
5. ✅ Reset de contadores al validar correctamente

---

## 📝 Archivos Modificados

- ✅ `components/ChangePasswordModal.js` - Actualizado con toda la lógica
- ✅ Verificado: `app/(app)/ArtesanoProfile.js` - Ya usa el modal
- ⏳ Opcional: Actualizar `ClientProfile.js` para usar el modal

---

## 🚀 Próximos Pasos (Opcionales)

1. **Actualizar ClientProfile.js** para usar el modal en lugar de lógica inline
2. **Agregar validación en tiempo real** de confirmación de contraseña
3. **Implementar debounce** en validaciones
4. **Agregar indicador de fuerza** de contraseña

---

**Fecha:** 2025-01-27  
**Estado:** ✅ Modal actualizado y funcional  
**Reutilizable en:** Cliente, Artesano, y cualquier otro perfil que lo necesite


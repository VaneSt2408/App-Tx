# Manejo de Usuarios Sin Perfil

## 📋 **Descripción**

Esta funcionalidad maneja automáticamente a usuarios que se loguean pero no tienen un perfil definido en la base de datos. Después de 10 segundos de carga, se muestra un alert y se redirige al login.

## 🔧 **Implementación**

### **Lógica Implementada:**

#### **1. Detección de Usuario Sin Perfil:**
```typescript
if (userProfile) {
  // Usuario tiene perfil - continuar normalmente
  setProfile(userProfile);
  setRole(userProfile.rol);
} else {
  // Usuario sin perfil - iniciar timer de 10 segundos
  handleNoProfile();
}
```

#### **2. Timer de 10 Segundos:**
```typescript
const handleNoProfile = () => {
  const timer = setTimeout(() => {
    Alert.alert(
      'Perfil no encontrado',
      'No tienes un perfil definido. Regístrate de nuevo.',
      [
        {
          text: 'OK',
          onPress: async () => {
            await supabase.auth.signOut();
          }
        }
      ]
    );
  }, 10000); // 10 segundos
};
```

#### **3. Limpieza de Timer:**
```typescript
useEffect(() => {
  return () => {
    if (noProfileTimer) {
      clearTimeout(noProfileTimer);
    }
  };
}, [noProfileTimer]);
```

## 🎯 **Flujo de Usuario**

### **Escenario: Usuario Sin Perfil**

#### **Paso 1: Login Exitoso**
```javascript
1. Usuario se loguea correctamente
2. Sesión se establece en Supabase
3. AuthContext detecta sesión activa
4. Inicia búsqueda de perfil
```

#### **Paso 2: Búsqueda de Perfil**
```javascript
1. Se ejecuta checkUserRole()
2. Busca en tabla 'clientes'
3. Busca en tabla 'perfiles'
4. No encuentra datos del usuario
5. Retorna null (sin perfil)
```

#### **Paso 3: Timer de 10 Segundos**
```javascript
1. Se inicia timer de 10 segundos
2. Indicador de carga se mantiene
3. Usuario ve pantalla de carga
4. Después de 10 segundos se ejecuta alert
```

#### **Paso 4: Alert y Redirección**
```javascript
1. Se muestra alert: "Perfil no encontrado"
2. Mensaje: "No tienes un perfil definido. Regístrate de nuevo."
3. Usuario presiona "OK"
4. Se ejecuta signOut()
5. Usuario es redirigido al login
```

## 🛡️ **Casos de Uso**

### **1. Usuario Eliminado:**
- ✅ **Perfil eliminado** - Datos borrados de la base de datos
- ✅ **Cuenta de auth existe** - Pero sin datos asociados
- ✅ **Login exitoso** - Pero sin perfil definido
- ✅ **Timer activado** - 10 segundos de carga
- ✅ **Alert mostrado** - "Regístrate de nuevo"

### **2. Usuario Nuevo Sin Completar:**
- ✅ **Registro incompleto** - Solo auth, sin perfil
- ✅ **Login exitoso** - Pero sin datos de perfil
- ✅ **Timer activado** - 10 segundos de carga
- ✅ **Alert mostrado** - "Regístrate de nuevo"

### **3. Error de Base de Datos:**
- ✅ **Error en consulta** - No se puede obtener perfil
- ✅ **Fallback a timer** - 10 segundos de carga
- ✅ **Alert mostrado** - "Regístrate de nuevo"

## 🔄 **Estados de la Aplicación**

### **Estados del Timer:**
```javascript
// Estado inicial
noProfileTimer: null
loading: true

// Usuario sin perfil detectado
noProfileTimer: setTimeout(10000)
loading: true

// Después de 10 segundos
noProfileTimer: null
loading: false
alert: "Perfil no encontrado"

// Después de presionar OK
session: null
loading: false
redirect: /(auth)
```

### **Estados del Usuario:**
```javascript
// Usuario con perfil
session: { user: {...} }
profile: { id, nombre, rol }
role: "cliente"
loading: false

// Usuario sin perfil
session: { user: {...} }
profile: null
role: null
loading: true (10 segundos)
```

## 📱 **Experiencia de Usuario**

### **UI/UX:**
- ✅ **Indicador de carga** - Se mantiene durante 10 segundos
- ✅ **Alert claro** - Mensaje específico sobre el problema
- ✅ **Redirección automática** - Al login después del alert
- ✅ **Sin errores** - Proceso fluido y claro

### **Mensajes:**
```
Título: "Perfil no encontrado"
Mensaje: "No tienes un perfil definido. Regístrate de nuevo."
Botón: "OK" → Cierra sesión y redirige
```

## 🔧 **Configuración**

### **Tiempo de Espera:**
```typescript
setTimeout(() => {
  // Mostrar alert
}, 10000); // 10 segundos - configurable
```

### **Mensaje Personalizable:**
```typescript
Alert.alert(
  'Perfil no encontrado', // Título
  'No tienes un perfil definido. Regístrate de nuevo.', // Mensaje
  [{ text: 'OK', onPress: signOut }] // Acción
);
```

## 🎯 **Beneficios**

### **1. Experiencia Clara:**
- ✅ **Feedback específico** - Usuario sabe qué pasó
- ✅ **Solución clara** - "Regístrate de nuevo"
- ✅ **Sin confusión** - Proceso transparente

### **2. Seguridad:**
- ✅ **Sesión cerrada** - No queda sesión activa
- ✅ **Redirección segura** - Al login
- ✅ **Sin datos expuestos** - No accede a la app

### **3. Mantenimiento:**
- ✅ **Limpieza automática** - Timer se limpia correctamente
- ✅ **Sin memory leaks** - useEffect de limpieza
- ✅ **Manejo de errores** - Try/catch en todas las operaciones

## 📝 **Notas Técnicas**

### **Dependencias:**
- ✅ **React Native Alert** - Para mostrar mensajes
- ✅ **Supabase Auth** - Para cerrar sesión
- ✅ **useEffect** - Para limpieza de timers
- ✅ **useState** - Para manejo de estado

### **Consideraciones:**
- 🔄 **Timer único** - Solo un timer activo a la vez
- 🔄 **Limpieza automática** - Timer se limpia al desmontar
- 🔄 **Fallback robusto** - Manejo de errores en signOut
- 🔄 **Performance** - No impacta usuarios con perfil

**¡La funcionalidad está completamente implementada y maneja usuarios sin perfil de manera elegante!** 🎉

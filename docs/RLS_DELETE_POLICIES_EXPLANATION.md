# Políticas RLS para Eliminación de Datos

## 📋 **Descripción**

Este documento explica las políticas RLS (Row Level Security) necesarias para permitir que los usuarios eliminen sus propios datos en Supabase.

## 🔒 **Políticas Requeridas**

### 1. **Tabla `clientes`**
```sql
CREATE POLICY "Clientes pueden eliminar su perfil" ON clientes
FOR DELETE 
USING (auth.uid() = id);
```
- **Propósito**: Permite que los usuarios eliminen su propio perfil
- **Condición**: Solo pueden eliminar registros donde `id = auth.uid()`

### 2. **Tabla `productos`**
```sql
CREATE POLICY "Artesanos pueden eliminar sus productos" ON productos
FOR DELETE 
USING (auth.uid() = artesano_id);
```
- **Propósito**: Permite que los artesanos eliminen sus propios productos
- **Condición**: Solo pueden eliminar productos donde `artesano_id = auth.uid()`

### 3. **Storage `avatars`**
```sql
CREATE POLICY "Usuarios pueden eliminar sus avatares" ON storage.objects
FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```
- **Propósito**: Permite que los usuarios eliminen sus propios avatares
- **Condición**: Solo pueden eliminar archivos en su carpeta personal

## 🚀 **Instalación**

### **Paso 1: Ejecutar Script SQL**
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Ejecutar el script `FIX_RLS_DELETE_POLICIES.sql`

### **Paso 2: Verificar Políticas**
```sql
SELECT policyname, tablename, cmd 
FROM pg_policies 
WHERE policyname LIKE '%eliminar%' OR policyname LIKE '%delete%'
ORDER BY tablename;
```

## 🛡️ **Seguridad**

### **Principios de Seguridad:**
- ✅ **Aislamiento de datos**: Usuarios solo pueden eliminar sus propios datos
- ✅ **Autenticación requerida**: Solo usuarios autenticados pueden eliminar
- ✅ **Autorización específica**: Solo el propietario puede eliminar

### **Protecciones:**
- 🔒 **No cross-user**: Usuario A no puede eliminar datos de Usuario B
- 🔒 **Validación de propiedad**: Verificación de `auth.uid()`
- 🔒 **Scope limitado**: Solo operaciones DELETE permitidas

## 📊 **Tablas Afectadas**

| Tabla | Política | Condición |
|-------|----------|-----------|
| `clientes` | Eliminar perfil | `auth.uid() = id` |
| `productos` | Eliminar productos | `auth.uid() = artesano_id` |
| `storage.objects` | Eliminar avatares | `auth.uid() = folder_name` |

## 🔧 **Troubleshooting**

### **Error: "Permission denied"**
- ✅ Verificar que las políticas RLS estén creadas
- ✅ Verificar que el usuario esté autenticado
- ✅ Verificar que `auth.uid()` no sea null

### **Error: "Row Level Security policy"**
- ✅ Ejecutar el script de políticas
- ✅ Verificar que RLS esté habilitado en las tablas
- ✅ Verificar que las políticas estén activas

## 📝 **Notas Importantes**

1. **Orden de eliminación**: Los datos se eliminan antes de cerrar la sesión
2. **Verificación**: Se verifica que los datos se eliminaron correctamente
3. **Fallback**: Si falla la eliminación, se cierra la sesión como alternativa
4. **Logs**: Se registran todos los pasos para debugging

## 🎯 **Resultado Esperado**

Después de implementar estas políticas:
- ✅ Los usuarios pueden eliminar su perfil
- ✅ Los artesanos pueden eliminar sus productos
- ✅ Los usuarios pueden eliminar sus avatares
- ✅ La eliminación funciona sin errores de permisos
- ✅ Los datos se eliminan realmente de Supabase

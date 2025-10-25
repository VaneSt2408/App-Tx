// En: src/services/profileInfo.js
import { supabase } from '../supabase/client';

// --- Función para obtener el perfil completo del cliente ---
export const getClientProfile = async (userId) => {
  try {
    console.log('Obteniendo perfil del cliente...', userId);
    
    // Obtener datos del perfil desde la tabla 'clientes'
    const { data: profileData, error: profileError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError);
      throw new Error(`Error al obtener perfil: ${profileError.message}`);
    }

    // Obtener datos del usuario desde auth.users
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Error al obtener datos del usuario:', userError);
      throw new Error(`Error al obtener datos del usuario: ${userError.message}`);
    }

    // Combinar datos del perfil y del usuario
          const completeProfile = {
            id: profileData.id,
            email: userData.user?.email || 'No disponible',
            nombre_completo: profileData.nombre_completo || 'No especificado',
            telefono: profileData.telefono || 'No especificado',
            avatar_url: profileData.avatar_url || null,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at || profileData.created_at // Fallback si no existe updated_at
          };

    console.log('Perfil obtenido exitosamente:', completeProfile);
    return { data: completeProfile, error: null };
    
  } catch (error) {
    console.error('Error en getClientProfile:', error);
    return { data: null, error: error.message };
  }
};

// --- Función para actualizar el perfil del cliente ---
export const updateClientProfile = async (userId, updateData) => {
  try {
    console.log('Actualizando perfil del cliente...', userId, updateData);
    
    // Primero verificar que el usuario existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('Error al verificar perfil existente:', checkError);
      throw new Error(`No se encontró el perfil del usuario: ${checkError.message}`);
    }

    // Actualizar el perfil
    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre_completo: updateData.nombre_completo,
        telefono: updateData.telefono,
        avatar_url: updateData.avatar_url
        // updated_at se actualiza automáticamente por el trigger
      })
      .eq('id', userId)
      .select();

    if (error) {
      console.error('Error al actualizar perfil:', error);
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No se pudo actualizar el perfil');
    }

    console.log('Perfil actualizado exitosamente:', data[0]);
    return { data: data[0], error: null };
    
  } catch (error) {
    console.error('Error en updateClientProfile:', error);
    return { data: null, error: error.message };
  }
};

// --- Función para subir avatar a Supabase Storage ---
export const uploadAvatar = async (userId, imageAsset) => {
  try {
    console.log('Subiendo avatar...', userId);
    
    if (!imageAsset || !imageAsset.base64) {
      throw new Error('No se encontró la imagen o los datos base64');
    }
    
    // Generar nombre único para el archivo
    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    // Importar decode desde base64-arraybuffer
    const { decode } = require('base64-arraybuffer');
    
    // Subir imagen al bucket 'avatars'
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      console.error('Error al subir avatar:', uploadError);
      throw new Error(`Error al subir avatar: ${uploadError.message}`);
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    console.log('Avatar subido exitosamente:', urlData.publicUrl);
    return { data: urlData.publicUrl, error: null };
    
  } catch (error) {
    console.error('Error en uploadAvatar:', error);
    return { data: null, error: error.message };
  }
};

//Funcion para editar el perfil del cliente
export const editClientProfile = async (userId, updateData) => {
  try {
    console.log('Editando perfil del cliente...', userId, updateData);
    
    // Primero verificar que el usuario existe y obtener datos actuales
    const { data: existingProfile, error: checkError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError) {
      console.error('Error al verificar perfil existente:', checkError);
      throw new Error(`No se encontró el perfil del usuario: ${checkError.message}`);
    }

    console.log('Perfil existente encontrado:', existingProfile);

    // Preparar datos de actualización (solo campos que han cambiado)
    const updateFields = {};
    if (updateData.nombre_completo !== existingProfile.nombre_completo) {
      updateFields.nombre_completo = updateData.nombre_completo;
    }
    if (updateData.telefono !== existingProfile.telefono) {
      updateFields.telefono = updateData.telefono;
    }
    if (updateData.avatar_url !== existingProfile.avatar_url) {
      updateFields.avatar_url = updateData.avatar_url;
    }

    // Si no hay cambios, devolver el perfil actual
    if (Object.keys(updateFields).length === 0) {
      console.log('No hay cambios en el perfil');
      return { data: existingProfile, error: null };
    }

    console.log('Campos a actualizar:', updateFields);

    // Actualizar el perfil
    const { data, error } = await supabase
      .from('clientes')
      .update(updateFields)
      .eq('id', userId);

    if (error) {
      console.error('Error al editar perfil:', error);
      throw new Error(`Error al editar perfil: ${error.message}`);
    }

    console.log('Resultado de la actualización:', { data, error });

    // Siempre obtener el perfil actualizado después de la actualización
    console.log('Obteniendo perfil actualizado después de la actualización...');
    
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error al obtener perfil actualizado:', fetchError);
      // Si no podemos obtener el perfil actualizado, devolver el existente con los cambios aplicados
      const updatedExistingProfile = {
        ...existingProfile,
        ...updateFields
      };
      console.log('Usando perfil existente con cambios aplicados:', updatedExistingProfile);
      return { data: updatedExistingProfile, error: null };
    }

    console.log('Perfil actualizado obtenido:', updatedProfile);
    return { data: updatedProfile, error: null };
    
  } catch (error) {
    console.error('Error en editClientProfile:', error);
    return { data: null, error: error.message };
  }
};

//Funcion para validar la contraseña actual
export const validateCurrentPassword = async (currentPassword) => {
  try {
    console.log('Validando contraseña actual...');
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }
    
    // Validación básica de formato
    if (!currentPassword || currentPassword.length < 6) {
      return { data: false, error: 'Contraseña muy corta' };
    }
    
    // Validar la contraseña actual usando un enfoque más seguro
    // En lugar de hacer login completo, usamos una validación alternativa
    try {
      // Crear una instancia temporal de Supabase para la validación
      // Esto evita afectar la sesión actual
      const { createClient } = require('@supabase/supabase-js');
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Usar la misma configuración pero con una instancia separada
      const tempSupabase = createClient(
        'https://wjgnktfkbdvofzdotkdn.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ25rdGZrYmR2b2Z6ZG90a2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEwODYsImV4cCI6MjA3NDU4NzA4Nn0.y4zqWisgouwsnkIN7-tRQ_8R7sWA0tdlz-6LeFWcQ78',
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: false, // Deshabilitar refresh automático
            persistSession: false, // No persistir la sesión temporal
            detectSessionInUrl: false,
          },
        }
      );
      
      // Intentar login con la instancia temporal
      const { data: loginData, error: loginError } = await tempSupabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (loginError) {
        console.log('Contraseña incorrecta:', loginError.message);
        return { data: false, error: 'Contraseña actual incorrecta' };
      }
      
      // Si llegamos aquí, la contraseña es correcta
      // No necesitamos restaurar nada porque usamos una instancia temporal
      console.log('Contraseña actual validada correctamente');
      return { data: true, error: null };
      
    } catch (loginError) {
      console.error('Error en validación de contraseña:', loginError);
      return { data: false, error: 'Error validando contraseña actual' };
    }
    
  } catch (error) {
    console.error('Error en validateCurrentPassword:', error);
    return { data: false, error: error.message };
  }
};

//Funcion para validar la nueva contraseña
export const validateNewPassword = (newPassword, currentPassword) => {
  const errors = [];
  
  // Validar longitud mínima
  if (newPassword.length < 8) {
    errors.push('La contraseña debe tener al menos 8 caracteres');
  }
  
  // Validar que sea diferente a la actual
  if (currentPassword && newPassword === currentPassword) {
    errors.push('La nueva contraseña debe ser diferente a la actual');
  }
  
  // Validar que tenga al menos una mayúscula
  if (!/[A-Z]/.test(newPassword)) {
    errors.push('Debe contener al menos una letra mayúscula');
  }
  
  // Validar que tenga al menos una minúscula
  if (!/[a-z]/.test(newPassword)) {
    errors.push('Debe contener al menos una letra minúscula');
  }
  
  // Validar que tenga al menos un número
  if (!/[0-9]/.test(newPassword)) {
    errors.push('Debe contener al menos un número');
  }
  
  // Validar que tenga al menos un carácter especial
  if (!/[^A-Za-z0-9]/.test(newPassword)) {
    errors.push('Debe contener al menos un carácter especial');
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

//Funcion para cambiar la contraseña del cliente
export const changeClientPassword = async (currentPassword, newPassword) => {
  try {
    console.log('Cambiando contraseña del cliente...');
    
    // Validar la nueva contraseña
    const passwordValidation = validateNewPassword(newPassword, currentPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.errors.join(', '));
    }
    
    // Actualizar contraseña usando Supabase Auth
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      console.error('Error al cambiar contraseña:', error);
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
    
    console.log('Contraseña cambiada exitosamente');
    return { data: true, error: null };
    
  } catch (error) {
    console.error('Error en changeClientPassword:', error);
    return { data: null, error: error.message };
  }
};

// Función para eliminar completamente el perfil del cliente
export const deleteClientProfile = async (currentPassword) => {
  try {
    console.log('Eliminando perfil del cliente...');
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }
    
    // Validar la contraseña actual antes de proceder
    const passwordValidation = await validateCurrentPassword(currentPassword);
    if (!passwordValidation.data) {
      throw new Error('Contraseña actual incorrecta');
    }
    
    console.log('Contraseña validada, procediendo con la eliminación...');
    
    // 1. Eliminar avatar del storage si existe
    try {
      const { data: profileData } = await supabase
        .from('clientes')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileData?.avatar_url) {
        console.log('Eliminando avatar del storage...');
        const avatarPath = profileData.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${avatarPath}`]);
      }
    } catch (storageError) {
      console.warn('Error eliminando avatar del storage:', storageError);
      // Continuar con la eliminación aunque falle el storage
    }
    
    // 2. Eliminar registros de la tabla clientes
    console.log('Eliminando registro de clientes...');
    console.log('User ID:', user.id);
    
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .delete()
      .eq('id', user.id)
      .select();
    
    if (clientesError) {
      console.error('Error eliminando de clientes:', clientesError);
      throw new Error(`Error eliminando perfil: ${clientesError.message}`);
    }
    
    console.log('Resultado eliminación clientes:', clientesData);
    console.log('Registros eliminados de clientes:', clientesData?.length || 0);
    
    // 3. Eliminar registros de la tabla perfiles si existe
    try {
      console.log('Eliminando registro de perfiles...');
      const { error: perfilesError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', user.id);
      
      if (perfilesError) {
        console.warn('Error eliminando de perfiles:', perfilesError);
        // No es crítico si esta tabla no existe
      }
    } catch (perfilesError) {
      console.warn('Tabla perfiles no existe o error:', perfilesError);
    }
    
    // 4. Eliminar productos del artesano si es que tiene
    try {
      console.log('Eliminando productos del artesano...');
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .delete()
        .eq('artesano_id', user.id)
        .select();
      
      if (productosError) {
        console.warn('Error eliminando productos:', productosError);
        // No es crítico si no tiene productos
      } else {
        console.log('Resultado eliminación productos:', productosData);
        console.log('Productos eliminados:', productosData?.length || 0);
      }
    } catch (productosError) {
      console.warn('Error eliminando productos:', productosError);
    }
    
    // 5. Eliminar cualquier otro registro que pueda tener el usuario
    // (Aquí se pueden agregar más tablas según sea necesario)
    
    // 6. Verificar que los datos se eliminaron correctamente
    console.log('Verificando eliminación de datos...');
    
    // Verificar que el perfil se eliminó
    const { data: verifyClientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', user.id);
    
    if (verifyClientes && verifyClientes.length > 0) {
      console.warn('Advertencia: El perfil de clientes no se eliminó completamente');
    } else {
      console.log('✓ Perfil de clientes eliminado correctamente');
    }
    
    // Verificar que los productos se eliminaron (si existían)
    const { data: verifyProductos } = await supabase
      .from('productos')
      .select('id')
      .eq('artesano_id', user.id);
    
    if (verifyProductos && verifyProductos.length > 0) {
      console.warn('Advertencia: Algunos productos no se eliminaron');
    } else {
      console.log('✓ Productos eliminados correctamente');
    }
    
    console.log('Datos del perfil eliminados completamente');
    
    // 7. Cerrar sesión del usuario (no se puede eliminar cuenta de auth sin permisos especiales)
    console.log('Cerrando sesión del usuario...');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('Error cerrando sesión:', signOutError);
      } else {
        console.log('✓ Sesión cerrada correctamente');
      }
    } catch (signOutError) {
      console.warn('Error cerrando sesión:', signOutError);
    }
    
    // Nota: La eliminación de cuenta de autenticación requiere permisos especiales
    // Los datos del perfil han sido eliminados completamente
    console.log('Nota: Los datos del perfil han sido eliminados completamente');
    console.log('La cuenta de autenticación permanece pero sin datos asociados');
    
    console.log('Perfil eliminado completamente');
    return { data: true, error: null };
    
  } catch (error) {
    console.error('Error en deleteClientProfile:', error);
    return { data: null, error: error.message };
  }
};

// Función para eliminar perfil de usuario Google (sin validación de contraseña)
export const deleteGoogleClientProfile = async () => {
  try {
    console.log('Eliminando perfil de usuario Google...');
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }
    
    console.log('Usuario Google identificado, procediendo con la eliminación...');
    
    // 1. Eliminar avatar del storage si existe
    try {
      const { data: profileData } = await supabase
        .from('clientes')
        .select('avatar_url')
        .eq('id', user.id)
        .single();
      
      if (profileData?.avatar_url) {
        console.log('Eliminando avatar del storage...');
        const avatarPath = profileData.avatar_url.split('/').pop();
        await supabase.storage
          .from('avatars')
          .remove([`${user.id}/${avatarPath}`]);
      }
    } catch (storageError) {
      console.warn('Error eliminando avatar del storage:', storageError);
      // Continuar con la eliminación aunque falle el storage
    }
    
    // 2. Eliminar registros de la tabla clientes
    console.log('Eliminando registro de clientes...');
    console.log('User ID:', user.id);
    
    const { data: clientesData, error: clientesError } = await supabase
      .from('clientes')
      .delete()
      .eq('id', user.id)
      .select();
    
    if (clientesError) {
      console.error('Error eliminando de clientes:', clientesError);
      throw new Error(`Error eliminando perfil: ${clientesError.message}`);
    }
    
    console.log('Resultado eliminación clientes:', clientesData);
    console.log('Registros eliminados de clientes:', clientesData?.length || 0);
    
    // 3. Eliminar registros de la tabla perfiles si existe
    try {
      console.log('Eliminando registro de perfiles...');
      const { error: perfilesError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', user.id);
      
      if (perfilesError) {
        console.warn('Error eliminando de perfiles:', perfilesError);
        // No es crítico si esta tabla no existe
      }
    } catch (perfilesError) {
      console.warn('Tabla perfiles no existe o error:', perfilesError);
    }
    
    // 4. Eliminar productos del artesano si es que tiene
    try {
      console.log('Eliminando productos del artesano...');
      const { data: productosData, error: productosError } = await supabase
        .from('productos')
        .delete()
        .eq('artesano_id', user.id)
        .select();
      
      if (productosError) {
        console.warn('Error eliminando productos:', productosError);
        // No es crítico si no tiene productos
      } else {
        console.log('Resultado eliminación productos:', productosData);
        console.log('Productos eliminados:', productosData?.length || 0);
      }
    } catch (productosError) {
      console.warn('Error eliminando productos:', productosError);
    }
    
    // 5. Verificar que los datos se eliminaron correctamente
    console.log('Verificando eliminación de datos...');
    
    // Verificar que el perfil se eliminó
    const { data: verifyClientes } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', user.id);
    
    if (verifyClientes && verifyClientes.length > 0) {
      console.warn('Advertencia: El perfil de clientes no se eliminó completamente');
    } else {
      console.log('✓ Perfil de clientes eliminado correctamente');
    }
    
    // Verificar que los productos se eliminaron (si existían)
    const { data: verifyProductos } = await supabase
      .from('productos')
      .select('id')
      .eq('artesano_id', user.id);
    
    if (verifyProductos && verifyProductos.length > 0) {
      console.warn('Advertencia: Algunos productos no se eliminaron');
    } else {
      console.log('✓ Productos eliminados correctamente');
    }
    
    console.log('Datos del perfil Google eliminados completamente');
    
    // 6. Cerrar sesión del usuario (no se puede eliminar cuenta de auth sin permisos especiales)
    console.log('Cerrando sesión del usuario Google...');
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        console.warn('Error cerrando sesión:', signOutError);
      } else {
        console.log('✓ Sesión cerrada correctamente');
      }
    } catch (signOutError) {
      console.warn('Error cerrando sesión:', signOutError);
    }
    
    // Nota: La eliminación de cuenta de autenticación requiere permisos especiales
    // Los datos del perfil han sido eliminados completamente
    console.log('Nota: Los datos del perfil han sido eliminados completamente');
    console.log('La cuenta de autenticación permanece pero sin datos asociados');
    
    console.log('Perfil Google eliminado completamente');
    return { data: true, error: null };
    
  } catch (error) {
    console.error('Error en deleteGoogleClientProfile:', error);
    return { data: null, error: error.message };
  }
};
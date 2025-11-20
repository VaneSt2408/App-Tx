// En: src/services/profileInfo.js
import { supabase } from '../supabase/client';

// --- Función para obtener el perfil completo del cliente ---
export const getClientProfile = async (userId) => {
  try {
    
    // Obtener datos del perfil desde la tabla 'clientes'
    const { data: profileData, error: profileError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      throw new Error(`Error al obtener perfil: ${profileError.message}`);
    }

    // Obtener teléfono desde la tabla 'perfiles'
    const { data: perfilData, error: perfilError } = await supabase
      .from('perfiles')
      .select('telefono')
      .eq('id', userId)
      .single();

    if (perfilError && perfilError.code !== 'PGRST116') {
    }

    // Obtener datos del usuario desde auth.users
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw new Error(`Error al obtener datos del usuario: ${userError.message}`);
    }

    // Combinar datos del perfil y del usuario
          const completeProfile = {
            id: profileData.id,
            email: userData.user?.email || 'No disponible',
            nombre_completo: profileData.nombre_completo || 'No especificado',
            telefono: perfilData?.telefono || 'No especificado',
            avatar_url: profileData.avatar_url || null,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at || profileData.created_at // Fallback si no existe updated_at
          };

    return { data: completeProfile, error: null };
    
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// --- Función para actualizar el perfil del cliente ---
export const updateClientProfile = async (userId, updateData) => {
  try {
    
    // Primero verificar que el usuario existe
    const { data: existingProfile, error: checkError } = await supabase
      .from('clientes')
      .select('id')
      .eq('id', userId)
      .single();

    if (checkError) {
      throw new Error(`No se encontró el perfil del usuario: ${checkError.message}`);
    }

    // Actualizar el perfil en tabla clientes (sin teléfono)
    const { data, error } = await supabase
      .from('clientes')
      .update({
        nombre_completo: updateData.nombre_completo,
        avatar_url: updateData.avatar_url
        // updated_at se actualiza automáticamente por el trigger
      })
      .eq('id', userId)
      .select();

    if (error) {
      throw new Error(`Error al actualizar perfil: ${error.message}`);
    }

    if (!data || data.length === 0) {
      throw new Error('No se pudo actualizar el perfil');
    }

    // Actualizar teléfono en tabla perfiles
    if (updateData.telefono !== undefined) {
      const { error: telefonoError } = await supabase
        .from('perfiles')
        .upsert({
          id: userId,
          telefono: updateData.telefono
        }, {
          onConflict: 'id'
        });

      if (telefonoError) {
        // No lanzamos error aquí para no fallar la actualización del perfil principal
      }
    }

    return { data: data[0], error: null };
    
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// --- Función para subir avatar a Supabase Storage ---
export const uploadAvatar = async (userId, imageAsset) => {
  try {
    
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
      throw new Error(`Error al subir avatar: ${uploadError.message}`);
    }

    // Obtener URL pública de la imagen
    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    return { data: urlData.publicUrl, error: null };
    
  } catch (error) {
    return { data: null, error: error.message };
  }
};

//Funcion para editar el perfil del cliente
export const editClientProfile = async (userId, updateData) => {
  try {
    
    // Primero verificar que el usuario existe y obtener datos actuales de clientes
    const { data: existingProfile, error: checkError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    if (checkError) {
      throw new Error(`No se encontró el perfil del usuario: ${checkError.message}`);
    }

    // Obtener teléfono actual desde perfiles
    const { data: existingPerfil, error: perfilCheckError } = await supabase
      .from('perfiles')
      .select('telefono')
      .eq('id', userId)
      .single();

    if (perfilCheckError && perfilCheckError.code !== 'PGRST116') {
    }

    const currentTelefono = existingPerfil?.telefono || null;

    // Preparar datos de actualización en clientes (sin teléfono)
    const updateFields = {};
    if (updateData.nombre_completo !== existingProfile.nombre_completo) {
      updateFields.nombre_completo = updateData.nombre_completo;
    }
    if (updateData.avatar_url !== existingProfile.avatar_url) {
      updateFields.avatar_url = updateData.avatar_url;
    }

    // Verificar si el teléfono cambió
    const telefonoChanged = updateData.telefono !== currentTelefono;
    
    // Si no hay cambios, devolver el perfil actual
    if (Object.keys(updateFields).length === 0 && !telefonoChanged) {
      return { data: { ...existingProfile, telefono: currentTelefono }, error: null };
    }

    if (telefonoChanged) {
    }

    // Actualizar el perfil en clientes (si hay cambios)
    if (Object.keys(updateFields).length > 0) {
      const { data, error } = await supabase
        .from('clientes')
        .update(updateFields)
        .eq('id', userId);

      if (error) {
        throw new Error(`Error al editar perfil: ${error.message}`);
      }

    }

    // Actualizar teléfono en perfiles (si cambió)
    if (telefonoChanged) {
      const { error: telefonoError } = await supabase
        .from('perfiles')
        .upsert({
          id: userId,
          telefono: updateData.telefono
        }, {
          onConflict: 'id'
        });

      if (telefonoError) {
        throw new Error(`Error al actualizar teléfono: ${telefonoError.message}`);
      }
    }
    
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', userId)
      .single();

    // Obtener teléfono actualizado desde perfiles
    const { data: updatedPerfil, error: perfilFetchError } = await supabase
      .from('perfiles')
      .select('telefono')
      .eq('id', userId)
      .single();

    if (perfilFetchError && perfilFetchError.code !== 'PGRST116') {
    }

    if (fetchError) {
      // Si no podemos obtener el perfil actualizado, devolver el existente con los cambios aplicados
      const updatedExistingProfile = {
        ...existingProfile,
        ...updateFields,
        telefono: updatedPerfil?.telefono || updateData.telefono || currentTelefono
      };
      return { data: updatedExistingProfile, error: null };
    }

    // Combinar perfil de clientes con teléfono de perfiles
    const finalProfile = {
      ...updatedProfile,
      telefono: updatedPerfil?.telefono || currentTelefono
    };

    return { data: finalProfile, error: null };
    
  } catch (error) {
    return { data: null, error: error.message };
  }
};

//Funcion para validar la contraseña actual
export const validateCurrentPassword = async (currentPassword) => {
  try {
    
    // Obtener el usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('No se encontró la sesión del usuario');
    }
    
    // Validación básica de formato
    if (!currentPassword || currentPassword.length < 8) {
      return { data: false, error: 'Contraseña muy corta (mínimo 8 caracteres)' };
    }
    
    // Validar la contraseña usando Supabase Auth sin afectar la sesión actual
    // Usamos una instancia temporal de Supabase para validar sin reiniciar sesión
    try {
      const { createClient } = require('@supabase/supabase-js');
      const AsyncStorage = require('@react-native-async-storage/async-storage');
      
      // Crear instancia temporal que NO afecta la sesión actual
      const tempSupabase = createClient(
        process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://wjgnktfkbdvofzdotkdn.supabase.co',
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqZ25rdGZrYmR2b2Z6ZG90a2RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkwMTEwODYsImV4cCI6MjA3NDU4NzA4Nn0.y4zqWisgouwsnkIN7-tRQ_8R7sWA0tdlz-6LeFWcQ78',
        {
          auth: {
            storage: AsyncStorage,
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        }
      );
      
      // Intentar login con instancia temporal (NO afecta sesión actual)
      const { error: loginError } = await tempSupabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword
      });
      
      if (loginError) {
        return { data: false, error: 'Contraseña actual incorrecta' };
      }
      
      // Si llegamos aquí, la contraseña es correcta
      return { data: true, error: null };
      
    } catch (loginError) {
      return { data: false, error: 'Error validando contraseña actual' };
    }
    
  } catch (error) {
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
      throw new Error(`Error al cambiar contraseña: ${error.message}`);
    }
    
    return { data: true, error: null };
    
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Función para eliminar completamente el perfil del cliente
export const deleteClientProfile = async (userId) => {
  try {
    if (!userId) {
      throw new Error('Se requiere el ID del usuario para eliminar la cuenta.');
    }

    // 1. Eliminar datos de tablas relacionadas
    await supabase.from('eventos_guardados').delete().eq('user_id', userId);
    await supabase.from('likes').delete().eq('user_id', userId);
    await supabase.from('likes_productos').delete().eq('user_id', userId);
    await supabase.from('seguidores_artesanos').delete().eq('cliente_id', userId);

    // 2. Eliminar de la tabla 'clientes'
    await supabase.from('clientes').delete().eq('id', userId);

    // 3. Eliminar de la tabla 'perfiles' (esto activará el trigger para borrar de auth.users)
    const { error: perfilesError } = await supabase
      .from('perfiles')
      .delete()
      .eq('id', userId);

    if (perfilesError && perfilesError.code !== 'PGRST116') { // PGRST116 = Fila no encontrada, lo cual es aceptable
      throw perfilesError;
    }

    return { data: true, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
};

// Función para eliminar perfil de usuario Google (sin validación de contraseña)
export const deleteGoogleClientProfile = async () => {
  // Esta función ahora simplemente llama a la función principal de borrado.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { data: null, error: 'No se encontró la sesión del usuario' };
  }
  return await deleteClientProfile(user.id);
};
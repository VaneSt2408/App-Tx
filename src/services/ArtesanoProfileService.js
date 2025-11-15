// Backend logic para el perfil del artesano
// Este servicio maneja todas las operaciones de backend para el perfil del artesano

// Backend logic para el perfil del artesano
// Este servicio maneja todas las operaciones de backend para el perfil del artesano

import { supabase } from '../supabase/client';

/**
 * Actualiza el perfil del artesano
 * @param {string} userId - ID del usuario
 * @param {Object} data - Datos a actualizar { nombre, telefono, ubicacion, descripcion }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePerfilArtesano(userId, data) {
  try {
    // Actualizar tabla artesanos (nombre, ubicacion, descripcion)
    const { error: artesanosError } = await supabase
      .from('artesanos')
      .update({ 
        nombre: data.nombre, 
        ubicacion: data.ubicacion, // <-- MODIFICADO: Esto ahora es el enlace
        descripcion: data.descripcion 
      })
      .eq('user_id', userId);

    if (artesanosError) throw artesanosError;

    // Actualizar tabla perfiles (telefono)
    const { error: perfilesError } = await supabase
      .from('perfiles')
      .update({ telefono: data.telefono })
      .eq('id', userId);

    if (perfilesError) throw perfilesError;

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Actualiza el perfil completo del artesano incluyendo avatar si se proporciona
 * @param {string} userId - ID del usuario
 * @param {Object} data - Datos a actualizar { nombre, telefono, ubicacion, descripcion, avatar_url } // <-- MODIFICADO
 * @param {Object} newImageAsset - Objeto de imagen de ImagePicker (opcional)
 * @returns {Promise<{success: boolean, avatar_url?: string, error?: string}>}
 */
export async function updatePerfilArtesanoCompleto(userId, data, newImageAsset) {
  try {
    
    let avatarUrl = data.avatar_url;
    
    // Si hay una nueva imagen, subirla primero
    if (newImageAsset) {
      const uploadResult = await subirAvatarArtesano(userId, newImageAsset);
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error);
      }
      
      avatarUrl = uploadResult.avatar_url;
    }
    
    // Actualizar tabla artesanos (nombre, ubicacion, descripcion, avatar_url si cambió)
    // <-- MODIFICADO: 'ubicacion' ahora es el enlace y 'google_maps_link' se elimina
    const updateData = {
      nombre: data.nombre, 
      ubicacion: data.ubicacion, // <-- Esto ahora es el enlace
      descripcion: data.descripcion,
      // <-- ELIMINADO: google_maps_link
    };
    
    // Solo actualizar avatar_url si hay una nueva imagen
    if (avatarUrl && avatarUrl !== data.avatar_url) {
      updateData.avatar_url = avatarUrl;
    }
    
    const { error: artesanosError } = await supabase
      .from('artesanos')
      .update(updateData)
      .eq('user_id', userId);

    if (artesanosError) throw artesanosError;

    // Actualizar tabla perfiles (telefono)
    const { error: perfilesError } = await supabase
      .from('perfiles')
      .update({ telefono: data.telefono })
      .eq('id', userId);

    if (perfilesError) throw perfilesError;

    return { success: true, avatar_url: avatarUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Elimina el perfil del artesano y todos sus datos relacionados
 * @param {string} userId - ID del usuario
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function eliminarPerfilArtesano(userId) {
  try {
    
    // 1. Eliminar avatar del storage si existe
    try {
      const { data: artesanoData } = await supabase
        .from('artesanos')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();
      
      if (artesanoData?.avatar_url) {
        const avatarPath = artesanoData.avatar_url.split('/').pop();
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([`${userId}/${avatarPath}`]);
        
        if (storageError) {
        } else {
        }
      }
    } catch (storageError) {
      // Continuar con la eliminación aunque falle el storage
    }
    
    // 2. Eliminar imágenes de productos del storage
    try {
      const { data: productosData } = await supabase
        .from('productos')
        .select('imagen_url')
        .eq('artesano_id', userId);
      
      if (productosData && productosData.length > 0) {
        const imagePaths = productosData
          .map(producto => producto.imagen_url)
          .filter(Boolean)
          .map(url => `${userId}/${url.split('/').pop()}`);
        
        if (imagePaths.length > 0) {
          const { error: productStorageError } = await supabase.storage
            .from('productos')
            .remove(imagePaths);
          
          if (productStorageError) {
          } else {
          }
        }
      }
    } catch (productStorageError) {
    }
    
    // 3. Eliminar imágenes de publicaciones del storage
    try {
      const { data: publicacionesData } = await supabase
        .from('publicaciones')
        .select('imagen_url')
        .eq('artesano_user_id', userId);
      
      if (publicacionesData && publicacionesData.length > 0) {
        const imagePaths = publicacionesData
          .map(publicacion => publicacion.imagen_url)
          .filter(Boolean)
          .map(url => `${userId}/${url.split('/').pop()}`);
        
        if (imagePaths.length > 0) {
          const { error: pubStorageError } = await supabase.storage
            .from('publicaciones')
            .remove(imagePaths);
          
          if (pubStorageError) {
          } else {
          }
        }
      }
    } catch (pubStorageError) {
    }
    
    // 4. Eliminar productos de la tabla productos
    const { data: productosDeleted, error: productosError } = await supabase
      .from('productos')
      .delete()
      .eq('artesano_id', userId)
      .select();
    
    if (productosError) {
      throw new Error(`Error eliminando productos: ${productosError.message}`);
    }
    
    
    // 5. Eliminar publicaciones de la tabla publicaciones
    const { data: publicacionesDeleted, error: publicacionesError } = await supabase
      .from('publicaciones')
      .delete()
      .eq('artesano_user_id', userId)
      .select();
    
    if (publicacionesError) {
      throw new Error(`Error eliminando publicaciones: ${publicacionesError.message}`);
    }
    
    // 6. Eliminar perfil de artesano de la tabla artesanos
    const { data: artesanoDeleted, error: artesanoError } = await supabase
      .from('artesanos')
      .delete()
      .eq('user_id', userId)
      .select();
    
    if (artesanoError) {
      throw new Error(`Error eliminando perfil de artesano: ${artesanoError.message}`);
    }
    
    
    // 7. Eliminar registro de la tabla perfiles si existe
    try {
      const { error: perfilesError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', userId);
      
      if (perfilesError) {
        // No es crítico si esta tabla no existe o tiene triggers
      } else {
      }
    } catch (perfilesError) {
    }
    
    // 8. Eliminar registro de la tabla infousuario si existe
    try {
      const { error: infousuarioError } = await supabase
        .from('infousuario')
        .delete()
        .eq('user_id', userId);
      
      if (infousuarioError) {
        // No es crítico
      } else {
      }
    } catch (infousuarioError) {
    }
    
    // 9. Verificar que los datos se eliminaron correctamente
    
    const { data: verifyProductos } = await supabase
      .from('productos')
      .select('id')
      .eq('artesano_id', userId);
    
    if (verifyProductos && verifyProductos.length > 0) {
    } else {
    }
    
    const { data: verifyPublicaciones } = await supabase
      .from('publicaciones')
      .select('id')
      .eq('artesano_user_id', userId);
    
    if (verifyPublicaciones && verifyPublicaciones.length > 0) {
    } else {
    }
    
    const { data: verifyArtesano } = await supabase
      .from('artesanos')
      .select('id')
      .eq('user_id', userId);
    
    if (verifyArtesano && verifyArtesano.length > 0) {
    } else {
    }
    

    
    // 10. Cerrar sesión del usuario (no se puede eliminar cuenta de auth sin permisos especiales)
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
      } else {
      }
    } catch (signOutError) {
    }
    
    // Nota: La eliminación de cuenta de autenticación requiere permisos especiales
    // Los datos del perfil han sido eliminados completamente
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Sube la imagen de avatar del artesano
 * @param {string} userId - ID del usuario
 * @param {Object} imageAsset - Objeto de imagen de ImagePicker con base64
 * @returns {Promise<{success: boolean, avatar_url?: string, error?: string}>}
 */
export async function subirAvatarArtesano(userId, imageAsset) {
  try {

    
    const { decode } = require('base64-arraybuffer');

    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    const { error: updateError } = await supabase
      .from('artesanos')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      throw updateError;
    }
    

    return { success: true, avatar_url: urlData.publicUrl };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

/**
 * Obtiene el perfil completo del artesano con publicaciones y productos
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} - Objeto con artesano, publicaciones y productos
 */
export async function getPerfilCompletoArtesano(userId) {
  try {
    // Esta función debería ser llamada desde artesanoService
    // Ya que ya existe allí, solo reexportamos o usamos la existente
    const { artesanoService } = require('./artesanoService');
    return await artesanoService.getArtesanoCompleto(userId);
  } catch (error) {
    throw error;
  }
}
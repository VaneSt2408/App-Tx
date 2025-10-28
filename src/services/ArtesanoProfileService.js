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
    // Actualizar tabla artesanos
    const { error: artesanosError } = await supabase
      .from('artesanos')
      .update({ nombre: data.nombre, ubicacion: data.ubicacion })
      .eq('user_id', userId);

    if (artesanosError) throw artesanosError;

    // Actualizar tabla perfiles (telefono)
    const { error: perfilesError } = await supabase
      .from('perfiles')
      .update({ telefono: data.telefono })
      .eq('id', userId);

    if (perfilesError) throw perfilesError;

    // Actualizar tabla infousuario (descripcion)
    const { error: infousuarioError } = await supabase
      .from('infousuario')
      .update({ descripcion: data.descripcion })
      .eq('user_id', userId);

    if (infousuarioError) throw infousuarioError;

    return { success: true };
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
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
    console.log('Iniciando eliminación completa del perfil del artesano...');
    console.log('User ID:', userId);
    
    // 1. Eliminar avatar del storage si existe
    try {
      console.log('Buscando avatar del artesano...');
      const { data: artesanoData } = await supabase
        .from('artesanos')
        .select('avatar_url')
        .eq('user_id', userId)
        .single();
      
      if (artesanoData?.avatar_url) {
        console.log('Eliminando avatar del storage...');
        const avatarPath = artesanoData.avatar_url.split('/').pop();
        const { error: storageError } = await supabase.storage
          .from('avatars')
          .remove([`${userId}/${avatarPath}`]);
        
        if (storageError) {
          console.warn('Error eliminando avatar del storage:', storageError);
        } else {
          console.log('✓ Avatar eliminado del storage');
        }
      }
    } catch (storageError) {
      console.warn('Error eliminando avatar del storage:', storageError);
      // Continuar con la eliminación aunque falle el storage
    }
    
    // 2. Eliminar imágenes de productos del storage
    try {
      console.log('Eliminando imágenes de productos del storage...');
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
            console.warn('Error eliminando imágenes de productos:', productStorageError);
          } else {
            console.log(`✓ ${imagePaths.length} imágenes de productos eliminadas del storage`);
          }
        }
      }
    } catch (productStorageError) {
      console.warn('Error eliminando imágenes de productos:', productStorageError);
    }
    
    // 3. Eliminar imágenes de publicaciones del storage
    try {
      console.log('Eliminando imágenes de publicaciones del storage...');
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
            console.warn('Error eliminando imágenes de publicaciones:', pubStorageError);
          } else {
            console.log(`✓ ${imagePaths.length} imágenes de publicaciones eliminadas del storage`);
          }
        }
      }
    } catch (pubStorageError) {
      console.warn('Error eliminando imágenes de publicaciones:', pubStorageError);
    }
    
    // 4. Eliminar productos de la tabla productos
    console.log('Eliminando productos de la tabla productos...');
    const { data: productosDeleted, error: productosError } = await supabase
      .from('productos')
      .delete()
      .eq('artesano_id', userId)
      .select();
    
    if (productosError) {
      console.error('Error eliminando productos:', productosError);
      throw new Error(`Error eliminando productos: ${productosError.message}`);
    }
    
    console.log(`✓ ${productosDeleted?.length || 0} productos eliminados`);
    
    // 5. Eliminar publicaciones de la tabla publicaciones
    console.log('Eliminando publicaciones de la tabla publicaciones...');
    const { data: publicacionesDeleted, error: publicacionesError } = await supabase
      .from('publicaciones')
      .delete()
      .eq('artesano_user_id', userId)
      .select();
    
    if (publicacionesError) {
      console.error('Error eliminando publicaciones:', publicacionesError);
      throw new Error(`Error eliminando publicaciones: ${publicacionesError.message}`);
    }
    
    console.log(`✓ ${publicacionesDeleted?.length || 0} publicaciones eliminadas`);
    
    // 6. Eliminar perfil de artesano de la tabla artesanos
    console.log('Eliminando perfil de artesano de la tabla artesanos...');
    const { data: artesanoDeleted, error: artesanoError } = await supabase
      .from('artesanos')
      .delete()
      .eq('user_id', userId)
      .select();
    
    if (artesanoError) {
      console.error('Error eliminando artesano:', artesanoError);
      throw new Error(`Error eliminando perfil de artesano: ${artesanoError.message}`);
    }
    
    console.log(`✓ Perfil de artesano eliminado`);
    
    // 7. Eliminar registro de la tabla perfiles si existe
    try {
      console.log('Eliminando registro de la tabla perfiles...');
      const { error: perfilesError } = await supabase
        .from('perfiles')
        .delete()
        .eq('id', userId);
      
      if (perfilesError) {
        console.warn('Error eliminando de perfiles:', perfilesError);
        // No es crítico si esta tabla no existe o tiene triggers
      } else {
        console.log('✓ Registro de perfiles eliminado');
      }
    } catch (perfilesError) {
      console.warn('Tabla perfiles no existe o error:', perfilesError);
    }
    
    // 8. Eliminar registro de la tabla infousuario si existe
    try {
      console.log('Eliminando registro de la tabla infousuario...');
      const { error: infousuarioError } = await supabase
        .from('infousuario')
        .delete()
        .eq('user_id', userId);
      
      if (infousuarioError) {
        console.warn('Error eliminando de infousuario:', infousuarioError);
        // No es crítico
      } else {
        console.log('✓ Registro de infousuario eliminado');
      }
    } catch (infousuarioError) {
      console.warn('Error eliminando de infousuario:', infousuarioError);
    }
    
    // 9. Verificar que los datos se eliminaron correctamente
    console.log('Verificando eliminación de datos...');
    
    const { data: verifyProductos } = await supabase
      .from('productos')
      .select('id')
      .eq('artesano_id', userId);
    
    if (verifyProductos && verifyProductos.length > 0) {
      console.warn('Advertencia: Algunos productos no se eliminaron');
    } else {
      console.log('✓ Todos los productos eliminados correctamente');
    }
    
    const { data: verifyPublicaciones } = await supabase
      .from('publicaciones')
      .select('id')
      .eq('artesano_user_id', userId);
    
    if (verifyPublicaciones && verifyPublicaciones.length > 0) {
      console.warn('Advertencia: Algunas publicaciones no se eliminaron');
    } else {
      console.log('✓ Todas las publicaciones eliminadas correctamente');
    }
    
    const { data: verifyArtesano } = await supabase
      .from('artesanos')
      .select('id')
      .eq('user_id', userId);
    
    if (verifyArtesano && verifyArtesano.length > 0) {
      console.warn('Advertencia: El perfil de artesano no se eliminó completamente');
    } else {
      console.log('✓ Perfil de artesano eliminado correctamente');
    }
    
    console.log('Datos del perfil del artesano eliminados completamente');
    
    // 10. Cerrar sesión del usuario (no se puede eliminar cuenta de auth sin permisos especiales)
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
    
    console.log('Perfil del artesano eliminado completamente');
    
    return { success: true };
  } catch (error) {
    console.error('Error en eliminarPerfilArtesano:', error);
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
    console.log('📤 [SERVICIO] Iniciando subida de avatar de artesano...');
    console.log('👤 [SERVICIO] User ID:', userId);
    console.log('📸 [SERVICIO] Image Asset URI:', imageAsset.uri);
    
    const { decode } = require('base64-arraybuffer');

    const fileExt = imageAsset.uri.split('.').pop();
    const fileName = `avatar_${Date.now()}.${fileExt}`;
    const filePath = `${userId}/${fileName}`;
    
    console.log('📁 [SERVICIO] File Path:', filePath);
    console.log('📦 [SERVICIO] Uploading to bucket: avatars');

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, decode(imageAsset.base64), {
        contentType: imageAsset.mimeType ?? 'image/jpeg',
      });

    if (uploadError) {
      console.error('❌ [SERVICIO] Error en storage upload:', uploadError);
      throw uploadError;
    }
    
    console.log('✅ [SERVICIO] Imagen subida correctamente a storage bucket "avatars"');

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    console.log('🔗 [SERVICIO] Public URL obtenida:', urlData.publicUrl);
    
    console.log('📝 [SERVICIO] Actualizando tabla "artesanos" con user_id:', userId);
    const { error: updateError } = await supabase
      .from('artesanos')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', userId);

    if (updateError) {
      console.error('❌ [SERVICIO] Error actualizando tabla artesanos:', updateError);
      throw updateError;
    }
    
    console.log('✅ [SERVICIO] Avatar actualizado en tabla "artesanos" correctamente');
    console.log('🎉 [SERVICIO] Subida completa exitosa');

    return { success: true, avatar_url: urlData.publicUrl };
  } catch (error) {
    console.error('❌ [SERVICIO] Error al subir avatar:', error);
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
    console.error('Error al obtener perfil completo:', error);
    throw error;
  }
}


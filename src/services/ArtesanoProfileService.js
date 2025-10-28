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
    // Eliminar productos
    const { error: productosError } = await supabase
      .from('productos')
      .delete()
      .eq('artesano_id', userId);

    if (productosError) throw productosError;

    // Eliminar publicaciones
    const { error: publicacionesError } = await supabase
      .from('publicaciones')
      .delete()
      .eq('artesano_user_id', userId);

    if (publicacionesError) throw publicacionesError;

    // Eliminar perfil de artesano
    const { error: artesanoError } = await supabase
      .from('artesanos')
      .delete()
      .eq('user_id', userId);

    if (artesanoError) throw artesanoError;

    return { success: true };
  } catch (error) {
    console.error('Error al eliminar perfil:', error);
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

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
    
    const { error: updateError } = await supabase
      .from('artesanos')
      .update({ avatar_url: urlData.publicUrl })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    return { success: true, avatar_url: urlData.publicUrl };
  } catch (error) {
    console.error('Error al subir avatar:', error);
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


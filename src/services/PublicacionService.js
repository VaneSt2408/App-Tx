import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';

// Función para crear una nueva publicación
export const createPost = async (userId, text, imageBase64, imageMimeType) => {
  let imageUrl = null;

  // 1. Si hay una imagen, subirla a Supabase Storage
  if (imageBase64) {
    try {
      const fileExt = imageMimeType ? imageMimeType.split('/')[1] : 'jpg';
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('imagenes-publicaciones')
        .upload(filePath, decode(imageBase64), {
          contentType: imageMimeType ?? 'image/jpeg',
          upsert: false
        });

      if (uploadError) {
        console.error("Error uploading image:", uploadError);
        throw new Error('Error al subir la imagen: ' + uploadError.message);
      }

      // Obtener la URL pública de la imagen subida
      const { data: urlData } = supabase.storage.from('imagenes-publicaciones').getPublicUrl(filePath);
      imageUrl = urlData.publicUrl;

    } catch (error) {
      console.error("Catch block - Error uploading image:", error);
      throw error;
    }
  }

  // 2. Insertar los datos de la publicación en la tabla 'publicaciones'
  const { data: postData, error: insertError } = await supabase
    .from('publicaciones')
    .insert({
      artesano_user_id: userId,
      texto: text,
      imagen_url: imageUrl
    })
    .select()
    .single();

  if (insertError) {
    console.error("Error inserting post:", insertError);
    throw new Error('Error al guardar la publicación: ' + insertError.message);
  }

  return postData;
};

/**
 * Obtener publicaciones de un artesano específico
 * @param {string} artesanoUserId - ID del usuario artesano
 * @param {number} limit - Límite de publicaciones por página
 * @param {number} offset - Offset para paginación
 * @returns {Promise<{success: boolean, data?: Array, hasMore?: boolean, totalCount?: number, error?: string}>}
 */
export async function getPublicacionesByArtesano(artesanoUserId, limit = 20, offset = 0) {
  try {
    console.log('📱 [PUBLICACIONES] Obteniendo publicaciones del artesano:', artesanoUserId);
    console.log('📱 [PUBLICACIONES] Parámetros - Limit:', limit, 'Offset:', offset);

    // Consulta principal con conteo de likes
    const { data: publicaciones, error: feedError, count } = await supabase
      .from('publicaciones')
      .select(`
        id,
        artesano_user_id,
        texto,
        imagen_url,
        created_at
      `, { count: 'exact' })
      .eq('artesano_user_id', artesanoUserId)
      .order('created_at', { ascending: false })
      .range(offset * limit, (offset + 1) * limit - 1);

    if (feedError) {
      console.error('❌ [PUBLICACIONES] Error al obtener publicaciones:', feedError);
      return { success: false, error: feedError.message };
    }

    console.log('📱 [PUBLICACIONES] Publicaciones obtenidas:', publicaciones?.length || 0);
    console.log('📱 [PUBLICACIONES] Total count:', count);

    if (!publicaciones || publicaciones.length === 0) {
      return {
        success: true,
        data: [],
        hasMore: false,
        totalCount: 0
      };
    }

    // Obtener conteo de likes para cada publicación
    const publicacionIds = publicaciones.map(pub => pub.id);
    
    const { data: likesData, error: likesError } = await supabase
      .from('likes')
      .select('publicacion_id')
      .in('publicacion_id', publicacionIds);

    if (likesError) {
      console.error('❌ [PUBLICACIONES] Error al obtener likes:', likesError);
      // Continuar sin likes si hay error
    }

    // Contar likes por publicación
    const likesCount = {};
    if (likesData) {
      likesData.forEach(like => {
        likesCount[like.publicacion_id] = (likesCount[like.publicacion_id] || 0) + 1;
      });
    }

    // Combinar datos
    const publicacionesConLikes = publicaciones.map(pub => ({
      id: pub.id,
      texto: pub.texto,
      imagen_url: pub.imagen_url,
      created_at: pub.created_at,
      likes_count: likesCount[pub.id] || 0,
    }));

    console.log('✅ [PUBLICACIONES] Publicaciones procesadas:', publicacionesConLikes.length);

    return {
      success: true,
      data: publicacionesConLikes,
      hasMore: count ? (offset * limit + limit < count) : false,
      totalCount: count || 0,
    };

  } catch (error) {
    console.error('❌ [PUBLICACIONES] Error en getPublicacionesByArtesano:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Eliminar una publicación
 * @param {string} publicacionId - ID de la publicación
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePublication(publicacionId) {
  try {
    console.log('🗑️ [PUBLICACIONES] Eliminando publicación:', publicacionId);

    // Primero eliminar los likes asociados
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('publicacion_id', publicacionId);

    if (likesError) {
      console.error('❌ [PUBLICACIONES] Error al eliminar likes:', likesError);
      return { success: false, error: 'Error al eliminar los likes de la publicación' };
    }

    // Eliminar la imagen del storage si existe
    const { data: publicacion, error: fetchError } = await supabase
      .from('publicaciones')
      .select('imagen_url')
      .eq('id', publicacionId)
      .single();

    if (!fetchError && publicacion?.imagen_url) {
      try {
        // Extraer el path del storage de la URL
        const urlParts = publicacion.imagen_url.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `publicaciones/${fileName}`;

        console.log('🗑️ [PUBLICACIONES] Eliminando imagen del storage:', filePath);
        
        const { error: storageError } = await supabase.storage
          .from('imagenes-publicaciones')
          .remove([filePath]);

        if (storageError) {
          console.error('❌ [PUBLICACIONES] Error al eliminar imagen del storage:', storageError);
          // Continuar con la eliminación aunque falle el storage
        } else {
          console.log('✅ [PUBLICACIONES] Imagen eliminada del storage');
        }
      } catch (storageError) {
        console.error('❌ [PUBLICACIONES] Error procesando eliminación de imagen:', storageError);
      }
    }

    // Eliminar la publicación
    const { error: deleteError } = await supabase
      .from('publicaciones')
      .delete()
      .eq('id', publicacionId);

    if (deleteError) {
      console.error('❌ [PUBLICACIONES] Error al eliminar publicación:', deleteError);
      return { success: false, error: deleteError.message };
    }

    console.log('✅ [PUBLICACIONES] Publicación eliminada correctamente');
    return { success: true };

  } catch (error) {
    console.error('❌ [PUBLICACIONES] Error en deletePublication:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Obtener estadísticas de publicaciones de un artesano
 * @param {string} artesanoUserId - ID del usuario artesano
 * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
 */
export async function getPublicacionesStats(artesanoUserId) {
  try {
    console.log('📊 [PUBLICACIONES] Obteniendo estadísticas del artesano:', artesanoUserId);

    // Obtener conteo total de publicaciones
    const { count: totalPublicaciones, error: countError } = await supabase
      .from('publicaciones')
      .select('*', { count: 'exact', head: true })
      .eq('artesano_user_id', artesanoUserId);

    if (countError) {
      console.error('❌ [PUBLICACIONES] Error al obtener conteo:', countError);
      return { success: false, error: countError.message };
    }

    // Obtener total de likes
    const { data: publicaciones, error: pubError } = await supabase
      .from('publicaciones')
      .select('id')
      .eq('artesano_user_id', artesanoUserId);

    if (pubError) {
      console.error('❌ [PUBLICACIONES] Error al obtener publicaciones:', pubError);
      return { success: false, error: pubError.message };
    }

    let totalLikes = 0;
    if (publicaciones && publicaciones.length > 0) {
      const publicacionIds = publicaciones.map(pub => pub.id);
      
      const { count: likesCount, error: likesError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .in('publicacion_id', publicacionIds);

      if (!likesError) {
        totalLikes = likesCount || 0;
      }
    }

    const stats = {
      total_publicaciones: totalPublicaciones || 0,
      total_likes: totalLikes,
    };

    console.log('✅ [PUBLICACIONES] Estadísticas obtenidas:', stats);
    return { success: true, data: stats };

  } catch (error) {
    console.error('❌ [PUBLICACIONES] Error en getPublicacionesStats:', error);
    return { success: false, error: error.message };
  }
}

// Exportar como objeto para compatibilidad con el código existente
const PublicacionService = {
  createPost,
  getPublicacionesByArtesano,
  deletePublication,
  getPublicacionesStats
};

export default PublicacionService;
import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';
<<<<<<< HEAD

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

=======
import 'react-native-get-random-values'; // Para generar nombres de archivo únicos si es necesario
import { Alert } from 'react-native'; // <-- ¡NUEVA IMPORTACIÓN!

// Función para crear una nueva publicación
export const createPost = async (userId, text, imageBase64, imageMimeType) => {
    let imageUrl = null;

    // 1. Si hay una imagen, subirla a Supabase Storage
    if (imageBase64) {
        try {
            const fileExt = imageMimeType ? imageMimeType.split('/')[1] : 'jpg'; // Extrae la extensión o usa 'jpg' por defecto
            const fileName = `${Date.now()}.${fileExt}`;
            const filePath = `${userId}/${fileName}`; // Guarda en una carpeta con el ID del artesano

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('imagenes-publicaciones') // Nombre del bucket que creamos
                .upload(filePath, decode(imageBase64), {
                    contentType: imageMimeType ?? 'image/jpeg',
                    upsert: false // No sobrescribir si ya existe (opcional)
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
            // Decide si quieres detener el proceso si la imagen falla o continuar sin imagen
            // throw error; // Descomenta si la imagen es obligatoria
            Alert.alert("Error de Imagen", "No se pudo subir la imagen, pero se intentará guardar el texto.")
        }
    }

    // 2. Insertar los datos de la publicación en la tabla 'publicaciones'
    const { data: postData, error: insertError } = await supabase
        .from('publicaciones')
        .insert({
            artesano_user_id: userId,
            texto: text,
            imagen_url: imageUrl // Puede ser null si no se subió imagen o falló
        })
        .select() // Opcional: devuelve el post creado
        .single(); // Esperamos un solo resultado

    if (insertError) {
        console.error("Error inserting post:", insertError);
        throw new Error('Error al guardar la publicación: ' + insertError.message);
    }

    return postData; // Devuelve la publicación creada
};


>>>>>>> 0944f5e7c0761bb475dd36b398ae1b0869f56b67
/**
 * Crea una nueva publicación para el usuario actual
 * Obtiene el usuario de la sesión y crea la publicación
 * @param {string} text - Texto de la publicación
 * @param {Object} imageAsset - Objeto de imagen de ImagePicker (opcional) con base64 y mimeType
 * @returns {Promise<Object>} - Datos de la publicación creada
 */
export async function createPostForCurrentUser(text, imageAsset) {
  try {
    console.log('📝 [SERVICE] Creando publicación para usuario actual...');
    
    // Validar que haya texto o imagen
    if (!text?.trim() && !imageAsset?.base64) {
      throw new Error('Escribe algo o selecciona una imagen para publicar');
    }

    // Obtener el usuario actual
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no autenticado');
    }

    console.log('👤 [SERVICE] Usuario obtenido:', user.id);

    // Crear la publicación usando la función existente
    const postData = await createPost(
      user.id,
      text || '',
      imageAsset?.base64 || null,
      imageAsset?.mimeType || null
    );

    console.log('✅ [SERVICE] Publicación creada exitosamente');
    return postData;
  } catch (error) {
    console.error('❌ [SERVICE] Error en createPostForCurrentUser:', error);
    throw error;
  }
}

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
 * Actualizar una publicación
 * @param {string} publicacionId - ID de la publicación
 * @param {Object} updateData - Datos a actualizar { texto }
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function updatePublication(publicacionId, updateData) {
  try {
    console.log('✏️ [SERVICE] Actualizando publicación:', publicacionId);
    
    // Validaciones
    if (!updateData.texto || !updateData.texto.trim()) {
      throw new Error('El texto de la publicación es requerido');
    }

    const { error } = await supabase
      .from('publicaciones')
      .update({ texto: updateData.texto.trim() })
      .eq('id', publicacionId);

    if (error) {
      console.error('❌ [SERVICE] Error al actualizar publicación:', error);
      throw new Error('No se pudo actualizar la publicación: ' + error.message);
    }

    console.log('✅ [SERVICE] Publicación actualizada correctamente');
    return { success: true };
  } catch (error) {
    console.error('❌ [SERVICE] Error en updatePublication:', error);
    throw error;
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
  createPostForCurrentUser,
  getPublicacionesByArtesano,
  updatePublication,
  deletePublication,
  getPublicacionesStats
};

<<<<<<< HEAD
export default PublicacionService;
=======
export default PublicacionService;
>>>>>>> 0944f5e7c0761bb475dd36b398ae1b0869f56b67

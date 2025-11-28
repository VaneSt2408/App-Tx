import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';
import 'react-native-get-random-values'; // Para generar nombres de archivo únicos si es necesario
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Abre la galería, permite seleccionar y recortar una imagen, y la comprime.
 * Es una réplica de la función en productService para mantener consistencia.
 * Devuelve un array con un solo asset para ser compatible con la lógica de galerías.
 * @returns {Promise<Array<object>|null>} - Un array con un objeto de asset o null.
 */
export const selectMultipleAndCompressImages = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permisos requeridos', 'Necesitamos acceso a tu galería para seleccionar una imagen.');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1], // Formato cuadrado para el feed
    quality: 1, // Calidad alta antes de la compresión manual.
  });

  if (result.canceled || !result.assets) return null;

  const asset = result.assets[0];

  // LOG del tamaño original (después del recorte)
  const originalSizeInBytes = asset.fileSize || (asset.base64 ? (asset.base64.length * 3) / 4 : 0);
  if (originalSizeInBytes > 0) {
    const originalSizeMB = (originalSizeInBytes / (1024 * 1024)).toFixed(2);
    console.log(`[PublicacionService] Imagen (Después de recortar): ${originalSizeMB} MB`);
  }

  // Comprimir la imagen seleccionada
  const manipulatedImage = await ImageManipulator.manipulateAsync(
    asset.uri,
    [],
    { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG, base64: true }
  );

  const compressedSizeInBytes = (manipulatedImage.base64.length * 3) / 4;
  const compressedSizeMB = (compressedSizeInBytes / (1024 * 1024)).toFixed(2);
  console.log(`[PublicacionService] Imagen (Comprimida): ${compressedSizeMB} MB`);

  const originalSize = asset.fileSize ? (asset.fileSize / 1024 / 1024).toFixed(2) : 'N/A';
  const compressedSize = (manipulatedImage.base64.length * 3 / 4 / 1024 / 1024).toFixed(2);

  return [manipulatedImage]; // Devolvemos un array para mantener la compatibilidad
};

// Función para crear una nueva publicación
export const createPost = async (userId, text, imageAssets = []) => {
    console.log('--- [createPost] INICIO (Lógica Múltiples Imágenes) ---');
    console.log(`[createPost] User ID: ${userId}, Texto: "${text}", Imágenes: ${imageAssets.length}`);
    // 1. Insertar la publicación principal para obtener un ID
    const { data: postData, error: insertError } = await supabase
        .from('publicaciones')
        .insert({
            artesano_user_id: userId,
            texto: text,
            imagen_url: 'URL_TEMPORAL' // Se actualizará después con la primera imagen
        })
        .select()
        .single();

    if (insertError) {
        console.error('[createPost] ERROR en supabase.from("publicaciones").insert():', JSON.stringify(insertError, null, 2));
        throw new Error('Error al guardar la publicación: ' + insertError.message);
    }

    const postId = postData.id;
    console.log(`[createPost] Registro principal de publicación creado con ID: ${postId}`);

    let firstImageUrl = null;

    // 2. Si hay imágenes, subirlas una por una
    if (imageAssets.length > 0) {
        for (const [index, asset] of imageAssets.entries()) {
            const fileExt = asset.uri.split('.').pop() || 'jpg';
            const fileName = `publicacion_${postId}_${Date.now()}_${index}.${fileExt}`;
            const filePath = `${userId}/${fileName}`;
            const mimeType = asset.mimeType ?? 'image/jpeg';

            console.log(`[createPost] Subiendo imagen ${index + 1}/${imageAssets.length} a la ruta: ${filePath}`);
            const { error: uploadError } = await supabase.storage
                .from('imagenes-publicaciones')
                .upload(filePath, decode(asset.base64), { contentType: mimeType });

            if (uploadError) {
                console.error(`[createPost] ERROR al subir la imagen ${index + 1}:`, uploadError.message);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage.from('imagenes-publicaciones').getPublicUrl(filePath);
            console.log(`[createPost] Imagen ${index + 1} subida. URL: ${publicUrl}`);

            if (index === 0) {
                firstImageUrl = publicUrl;
            }

            // Guardar la URL de la imagen en la nueva tabla 'publicacion_imagenes'
            const { error: insertImageError } = await supabase.from('publicacion_imagenes').insert({
                publicacion_id: postId,
                imagen_url: publicUrl,
                orden: index
            });
            if (insertImageError) {
                console.error(`[createPost] ERROR al guardar la URL de la imagen ${index + 1} en la BD:`, insertImageError.message);
            }
        }
    }

    // 3. Actualizar la publicación con la URL de la primera imagen como portada
    if (firstImageUrl) {
        console.log(`[createPost] Actualizando publicación con imagen de portada: ${firstImageUrl}`);
        const { error: updateError } = await supabase
            .from('publicaciones')
            .update({ imagen_url: firstImageUrl })
            .eq('id', postId);

        if (updateError) console.error('[createPost] ERROR al actualizar la imagen de portada:', updateError.message);
    }

    console.log('--- [createPost] FIN ---');
    return { ...postData, imagen_url: firstImageUrl };
};

/**
 * Crea una nueva publicación para el usuario actual
 * Obtiene el usuario de la sesión y crea la publicación
 * @param {string} text - Texto de la publicación
 * @param {Object} imageAsset - Objeto de imagen de ImagePicker (opcional) con base64 y mimeType
 * @returns {Promise<Object>} - Datos de la publicación creada
 */
export async function createPostForCurrentUser(text, imageAssets = []) {
  console.log('--- [createPostForCurrentUser] INICIO (Lógica Múltiples Imágenes) ---');
  console.log(`[createPostForCurrentUser] Texto recibido: "${text}", Número de imágenes: ${imageAssets?.length || 0}`);
  try {
    
    // Validar que haya texto o imagen
    if (!text?.trim() && imageAssets.length === 0) {
      console.error('[createPostForCurrentUser] ERROR: Validación fallida. No hay texto ni imágenes.');
      throw new Error('Escribe algo o selecciona una imagen para publicar');
    }

    // Obtener el usuario actual
    console.log('[createPostForCurrentUser] Obteniendo usuario de la sesión...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      console.error('[createPostForCurrentUser] ERROR: No se pudo obtener el usuario de la sesión.', userError?.message);
      throw new Error('Usuario no autenticado');
    }

    console.log(`[createPostForCurrentUser] Usuario autenticado: ${user.id}. Llamando a createPost...`);

    // Crear la publicación usando la función existente
    const postData = await createPost(
      user.id,
      text || '',
      imageAssets
    );
    
    console.log('--- [createPostForCurrentUser] FIN ---');
    return postData;
  } catch (error) {
    console.error('[createPostForCurrentUser] ERROR FATAL en el proceso. El error se originó en una de las funciones internas.', error);
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
      return { success: false, error: feedError.message };
    }

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

    return {
      success: true,
      data: publicacionesConLikes,
      hasMore: count ? (offset * limit + limit < count) : false,
      totalCount: count || 0,
    };

  } catch (error) {
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
    
    // Validaciones
    if (!updateData.texto || !updateData.texto.trim()) {
      throw new Error('El texto de la publicación es requerido');
    }

    const { error } = await supabase
      .from('publicaciones')
      .update({ texto: updateData.texto.trim() })
      .eq('id', publicacionId);

    if (error) {
      throw new Error('No se pudo actualizar la publicación: ' + error.message);
    }

    return { success: true };
  } catch (error) {
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

    // Primero eliminar los likes asociados
    const { error: likesError } = await supabase
      .from('likes')
      .delete()
      .eq('publicacion_id', publicacionId);

    if (likesError) {
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
        
        const { error: storageError } = await supabase.storage
          .from('imagenes-publicaciones')
          .remove([filePath]);

        if (storageError) {
          // Continuar con la eliminación aunque falle el storage
        } else {
        }
      } catch (storageError) {
      }
    }

    // Eliminar la publicación
    const { error: deleteError } = await supabase
      .from('publicaciones')
      .delete()
      .eq('id', publicacionId);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    return { success: true };

  } catch (error) {
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

    // Obtener conteo total de publicaciones
    const { count: totalPublicaciones, error: countError } = await supabase
      .from('publicaciones')
      .select('*', { count: 'exact', head: true })
      .eq('artesano_user_id', artesanoUserId);

    if (countError) {
      return { success: false, error: countError.message };
    }

    // Obtener total de likes
    const { data: publicaciones, error: pubError } = await supabase
      .from('publicaciones')
      .select('id')
      .eq('artesano_user_id', artesanoUserId);

    if (pubError) {
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
    return { success: true, data: stats };

  } catch (error) {
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


export default PublicacionService;

// src/services/FeedService.js
import { supabase } from '../supabase/client';

/**
 * Servicio para manejar el feed de publicaciones y likes
 */
export class FeedService {
  
  /**
   * Obtiene el usuario actual de la sesión
   * @returns {Promise<{userId: string|null, error?: string}>}
   */
  static async getCurrentUserId() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('❌ [SERVICE] Error al obtener usuario:', error);
        return { userId: null };
      }
      return { userId: user?.id || null };
    } catch (error) {
      console.error('❌ [SERVICE] Error en getCurrentUserId:', error);
      return { userId: null };
    }
  }

  /**
   * Obtiene las publicaciones del feed con paginación para el usuario actual
   * Obtiene el usuario de la sesión automáticamente
   * @param {number} limit - Cantidad de publicaciones por página (default: 10)
   * @param {number} page - Número de página (default: 0)
   * @returns {Promise<{success: boolean, data?: array, error?: string, hasMore?: boolean}>}
   */
  static async getFeedForCurrentUser(limit = 10, page = 0) {
    try {
      const { userId } = await this.getCurrentUserId();
      return await this.getFeed(limit, page, userId);
    } catch (error) {
      console.error('❌ [SERVICE] Error en getFeedForCurrentUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene las publicaciones del feed con paginación
   * @param {number} limit - Cantidad de publicaciones por página (default: 10)
   * @param {number} page - Número de página (default: 0)
   * @param {string|null} currentUserId - ID del usuario actual (para saber si dio like)
   * @returns {Promise<{success: boolean, data?: array, error?: string, hasMore?: boolean}>}
   */
  static async getFeed(limit = 10, page = 0, currentUserId = null) {
    try {
      const offset = page * limit;
      
      console.log('📱 Obteniendo feed - Página:', page, 'Límite:', limit);

      // Consulta principal con JOIN a artesanos (tabla directa)
      console.log('🔍 [FEED] Consultando publicaciones con JOIN a tabla artesanos...');
      const { data: publicaciones, error: feedError, count } = await supabase
        .from('publicaciones')
        .select(`
          id,
          artesano_user_id,
          texto,
          imagen_url,
          created_at,
          artesanos:artesano_user_id (
            nombre,
            ubicacion,
            categoria,
            avatar_url
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (feedError) {
        console.error('❌ Error al obtener feed:', feedError);
        return { success: false, error: feedError.message };
      }

      if (!publicaciones || publicaciones.length === 0) {
        return { success: true, data: [], hasMore: false };
      }

      // Obtener IDs de publicaciones
      const publicacionIds = publicaciones.map(p => p.id);

      // Obtener conteo de likes por publicación
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('publicacion_id')
        .in('publicacion_id', publicacionIds);

      if (likesError) {
        console.error('⚠️ Error al obtener likes:', likesError);
      }

      // Contar likes por publicación
      const likesCount = {};
      if (likesData) {
        likesData.forEach(like => {
          likesCount[like.publicacion_id] = (likesCount[like.publicacion_id] || 0) + 1;
        });
      }

      // Si hay usuario autenticado, verificar qué publicaciones tiene con like
      let userLikes = {};
      if (currentUserId) {
        const { data: userLikesData, error: userLikesError } = await supabase
          .from('likes')
          .select('publicacion_id')
          .eq('user_id', currentUserId)
          .in('publicacion_id', publicacionIds);

        if (!userLikesError && userLikesData) {
          userLikesData.forEach(like => {
            userLikes[like.publicacion_id] = true;
          });
        }
      }

      // Combinar datos
      const publicacionesConLikes = publicaciones.map(pub => ({
        id: pub.id,
        texto: pub.texto,
        imagen_url: pub.imagen_url,
        created_at: pub.created_at,
        artesano: {
          id: pub.artesano_user_id,
          nombre: pub.artesanos?.nombre || 'Artesano',
          ubicacion: pub.artesanos?.ubicacion || '',
          categoria: pub.artesanos?.categoria || '',
          avatar_url: pub.artesanos?.avatar_url || null,
        },
        likes_count: likesCount[pub.id] || 0,
        liked_by_user: userLikes[pub.id] || false,
      }));

      // Log para verificar avatares
      if (publicacionesConLikes.length > 0) {
        console.log('🖼️ [FEED] Primer artesano en feed - Avatar URL:', publicacionesConLikes[0].artesano?.avatar_url);
        console.log('🖼️ [FEED] Artesano completo:', publicacionesConLikes[0].artesano);
      }

      console.log('✅ Feed obtenido:', publicacionesConLikes.length, 'publicaciones');

      return {
        success: true,
        data: publicacionesConLikes,
        hasMore: count ? (offset + limit < count) : false,
        totalCount: count || 0,
      };

    } catch (error) {
      console.error('❌ Error en getFeed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Da o quita like a una publicación para el usuario actual (toggle)
   * Obtiene el usuario de la sesión automáticamente
   * @param {string} publicacionId - ID de la publicación
   * @returns {Promise<{success: boolean, liked?: boolean, likes_count?: number, error?: string}>}
   */
  static async toggleLikeForCurrentUser(publicacionId) {
    try {
      const { userId } = await this.getCurrentUserId();
      
      if (!userId) {
        return { success: false, error: 'Debes iniciar sesión para dar like' };
      }

      return await this.toggleLike(publicacionId, userId);
    } catch (error) {
      console.error('❌ [SERVICE] Error en toggleLikeForCurrentUser:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Da o quita like a una publicación (toggle)
   * @param {string} publicacionId - ID de la publicación
   * @param {string} userId - ID del usuario
   * @returns {Promise<{success: boolean, liked?: boolean, likes_count?: number, error?: string}>}
   */
  static async toggleLike(publicacionId, userId) {
    try {
      console.log('💖 Toggle like - Publicación:', publicacionId, 'Usuario:', userId);

      // Verificar si ya existe el like
      const { data: existingLike, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('publicacion_id', publicacionId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('❌ Error al verificar like:', checkError);
        return { success: false, error: checkError.message };
      }

      let liked;

      if (existingLike) {
        // Quitar like
        const { error: deleteError } = await supabase
          .from('likes')
          .delete()
          .eq('publicacion_id', publicacionId)
          .eq('user_id', userId);

        if (deleteError) {
          console.error('❌ Error al quitar like:', deleteError);
          return { success: false, error: deleteError.message };
        }

        liked = false;
        console.log('💔 Like removido');
      } else {
        // Dar like
        const { error: insertError } = await supabase
          .from('likes')
          .insert({
            publicacion_id: publicacionId,
            user_id: userId,
          });

        if (insertError) {
          console.error('❌ Error al dar like:', insertError);
          return { success: false, error: insertError.message };
        }

        liked = true;
        console.log('❤️ Like agregado');
      }

      // Obtener el nuevo conteo de likes
      const { count, error: countError } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', publicacionId);

      if (countError) {
        console.error('⚠️ Error al contar likes:', countError);
      }

      return {
        success: true,
        liked,
        likes_count: count || 0,
      };

    } catch (error) {
      console.error('❌ Error en toggleLike:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene el detalle de una publicación específica
   * @param {string} publicacionId - ID de la publicación
   * @param {string|null} currentUserId - ID del usuario actual
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getPublicacion(publicacionId, currentUserId = null) {
    try {
      // Obtener publicación
      const { data: publicacion, error: pubError } = await supabase
        .from('publicaciones')
        .select(`
          id,
          artesano_user_id,
          texto,
          imagen_url,
          created_at,
          artesanos:artesano_user_id (
            nombre,
            ubicacion,
            categoria,
            avatar_url
          )
        `)
        .eq('id', publicacionId)
        .single();

      if (pubError) {
        console.error('❌ Error al obtener publicación:', pubError);
        return { success: false, error: pubError.message };
      }

      // Contar likes
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', publicacionId);

      // Verificar si el usuario actual dio like
      let likedByUser = false;
      if (currentUserId) {
        const { data: userLike } = await supabase
          .from('likes')
          .select('id')
          .eq('publicacion_id', publicacionId)
          .eq('user_id', currentUserId)
          .maybeSingle();

        likedByUser = !!userLike;
      }

      const result = {
        id: publicacion.id,
        texto: publicacion.texto,
        imagen_url: publicacion.imagen_url,
        created_at: publicacion.created_at,
        artesano: {
          id: publicacion.artesano_user_id,
          nombre: publicacion.artesanos?.nombre || 'Artesano',
          ubicacion: publicacion.artesanos?.ubicacion || '',
          categoria: publicacion.artesanos?.categoria || '',
          avatar_url: publicacion.artesanos?.avatar_url || null,
        },
        likes_count: likesCount || 0,
        liked_by_user: likedByUser,
      };

      return { success: true, data: result };

    } catch (error) {
      console.error('❌ Error en getPublicacion:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene estadísticas de una publicación
   * @param {string} publicacionId - ID de la publicación
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getPublicacionStats(publicacionId) {
    try {
      const { count: likesCount } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('publicacion_id', publicacionId);

      return {
        success: true,
        data: {
          likes_count: likesCount || 0,
        },
      };

    } catch (error) {
      console.error('❌ Error en getPublicacionStats:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresca el feed (para pull-to-refresh)
   * @param {string|null} currentUserId - ID del usuario actual
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async refreshFeed(currentUserId = null) {
    console.log('🔄 Refrescando feed...');
    return await this.getFeed(10, 0, currentUserId);
  }
}

export default FeedService;
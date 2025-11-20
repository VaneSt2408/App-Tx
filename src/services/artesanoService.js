import { supabase } from '../supabase/client';

export const artesanoService = {
  // Obtener todos los artesanos desde la tabla artesanos directamente
  async getArtesanos() {
    try {
      const { data, error } = await supabase
        .from('artesanos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
      }
      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Obtener un artesano específico por ID con datos completos
  async getArtesanoById(userId) {
    try {
      
      // Obtener datos de la tabla artesanos (incluye descripcion ahora)
      const { data: artesanoData, error: artesanoError } = await supabase
        .from('artesanos')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (artesanoError) {
        throw artesanoError;
      }

      // Obtener telefono de la tabla perfiles
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('telefono')
        .eq('id', userId)
        .single();

      if (perfilError && perfilError.code !== 'PGRST116') {
      }

      // Combinar todos los datos (la descripcion ahora viene de artesanos)
      // 'ubicacion' (que es el link) ya está incluido en '...artesanoData'
      const artesanoCompleto = {
        ...artesanoData,
        descripcion: artesanoData?.descripcion || null,
        nombre: artesanoData?.nombre || null,
        telefono: perfil?.telefono || null,
        // <-- ELIMINADO: Ya no necesitamos 'google_maps_link'
      };
      
      return artesanoCompleto;
    } catch (error) {
      throw error;
    }
  },

  // Obtener publicaciones de un artesano
  async getPublicacionesByArtesano(userId) {
    try {
      const { data, error } = await supabase
        .from('publicaciones')
        .select('*')
        .eq('artesano_user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Obtener productos de un artesano
  async getProductosByArtesano(userId) {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('*')
        .eq('artesano_id', userId)
        .order('created_at', { ascending: false });

      if (error) {

        throw error;
      }

      return data || [];
    } catch (error) {
      throw error;
    }
  },

  // Obtener datos completos del artesano (perfil + publicaciones + productos)
  async getArtesanoCompleto(userId) {
    try {
      
      const [artesano, publicaciones, productos] = await Promise.all([
        this.getArtesanoById(userId),
        this.getPublicacionesByArtesano(userId),
        this.getProductosByArtesano(userId)
      ]);

      // Calcular total de likes de todas las publicaciones del artesano
      let totalLikes = 0;
      if (publicaciones && publicaciones.length > 0) {
        
        const publicacionIds = publicaciones.map(pub => pub.id);
        
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('publicacion_id')
          .in('publicacion_id', publicacionIds);

        if (likesError) {
        } else {
          totalLikes = likesData?.length || 0;
        }
      }

      // Agregar total_likes al objeto artesano
      const artesanoConLikes = {
        ...artesano,
        total_likes: totalLikes
      };

      return {
        artesano: artesanoConLikes,
        publicaciones,
        productos
      };
    } catch (error) {
      throw error;
    }
  },

  // Nueva función para obtener un item por ID
  getItemById: async (itemId, itemType) => {
    const tableName = itemType === 'publicaciones' ? 'publicaciones' : 'productos';
    
    const { data, error } = await supabase
      .from(tableName)
      .select(`
        *,
        artesanos (
          nombre,
          avatar_url
        )
      `)
      .eq('id', itemId)
      .single();

    if (error) {
      throw new Error(`No se pudo obtener el detalle del item.`);
    }

    return data;
  },

  // Función para eliminar el perfil de un artesano
  async deleteArtesanoProfile(userId) {
    try {
      if (!userId) {
        throw new Error('Se requiere el ID del usuario para eliminar el perfil.');
      }

      // --- INICIO DE ELIMINACIÓN SECUENCIAL MANUAL ---
      // Para evitar errores de clave foránea si no se ha configurado la cascada en la BD.

      // 1. Obtener IDs de productos para limpiar tablas dependientes.
      const { data: productos, error: getProductosError } = await supabase.from('productos').select('id').eq('artesano_id', userId);
      if (getProductosError) throw new Error(`Error obteniendo productos: ${getProductosError.message}`);

      if (productos && productos.length > 0) {
        const productoIds = productos.map(p => p.id);
        // Limpiar likes y guardados de esos productos.
        await supabase.from('likes_productos').delete().in('producto_id', productoIds);
        await supabase.from('productos_guardados').delete().in('producto_id', productoIds);
      }
      
      // 2. Eliminar los productos del artesano.
      await supabase.from('productos').delete().eq('artesano_id', userId);

      // 3. Obtener IDs de publicaciones para limpiar likes.
      const { data: publicaciones, error: getPublicacionesError } = await supabase.from('publicaciones').select('id').eq('artesano_user_id', userId);
      if (getPublicacionesError) throw new Error(`Error obteniendo publicaciones: ${getPublicacionesError.message}`);
      
      if (publicaciones && publicaciones.length > 0) {
        const publicacionIds = publicaciones.map(p => p.id);
        await supabase.from('likes').delete().in('publicacion_id', publicacionIds);
      }
      
      // 4. Eliminar las publicaciones del artesano.
      await supabase.from('publicaciones').delete().eq('artesano_user_id', userId);
      
      // 5. Eliminar relaciones de seguimiento (donde el artesano es seguido o sigue a alguien).
      await supabase.from('seguidores_artesanos').delete().or(`seguidor_id.eq.${userId},artesano_id.eq.${userId}`);
      
      // 6. Eliminar participación en eventos.
      await supabase.from('eventos_artesanos').delete().eq('artesano_id', userId);
      
      // 7. Eliminar el registro de la tabla 'artesanos'.
      await supabase.from('artesanos').delete().eq('user_id', userId);
      
      // 8. Eliminar el registro de la tabla 'perfiles'.
      // ESTE PASO ACTIVARÁ EL TRIGGER EN LA BD PARA BORRAR DE 'auth.users'
      await supabase.from('perfiles').delete().eq('id', userId);

      // --- FIN DE ELIMINACIÓN MANUAL ---

      return { error: null };
    } catch (error) {
      return { error: error.message };
    }
  },
};
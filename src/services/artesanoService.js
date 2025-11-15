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
  }
};
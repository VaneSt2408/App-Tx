import { supabase } from '../supabase/client';

export const artesanoService = {
  // Obtener todos los artesanos desde la tabla artesanos directamente
  async getArtesanos() {
    try {
      console.log('🔍 [SERVICIO] Obteniendo lista de artesanos desde tabla "artesanos"...');
      const { data, error } = await supabase
        .from('artesanos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ [SERVICIO] Error al obtener artesanos:', error);
        throw error;
      }

      console.log('✅ [SERVICIO] Artesanos obtenidos:', data?.length, 'registros');
      if (data && data.length > 0) {
        console.log('🖼️ [SERVICIO] Primer artesano avatar_url:', data[0]?.avatar_url);
      }
      return data || [];
    } catch (error) {
      console.error('❌ [SERVICIO] Error en getArtesanos:', error);
      throw error;
    }
  },

  // Obtener un artesano específico por ID con datos completos
  async getArtesanoById(userId) {
    try {
      console.log('🔍 [SERVICIO] Obteniendo artesano con ID:', userId);
      console.log('📋 [SERVICIO] Consultando tabla "artesanos" directamente...');
      
      // Obtener datos de la tabla artesanos (incluye descripcion ahora)
      const { data: artesanoData, error: artesanoError } = await supabase
        .from('artesanos')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (artesanoError) {
        console.error('❌ [SERVICIO] Error al obtener artesano:', artesanoError);
        throw artesanoError;
      }

      // Obtener telefono de la tabla perfiles
      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('telefono')
        .eq('id', userId)
        .single();

      if (perfilError && perfilError.code !== 'PGRST116') {
        console.error('❌ [SERVICIO] Error al obtener perfil:', perfilError);
      }

      // Combinar todos los datos (la descripcion ahora viene de artesanos)
      const artesanoCompleto = {
        ...artesanoData,
        descripcion: artesanoData?.descripcion || null,
        nombre: artesanoData?.nombre || null,
        telefono: perfil?.telefono || null
      };

      console.log('📊 [SERVICIO] Datos del artesano obtenidos:', artesanoCompleto);
      console.log('🖼️ [SERVICIO] Avatar URL en datos:', artesanoCompleto?.avatar_url);
      console.log('📝 [SERVICIO] Descripción:', artesanoCompleto?.descripcion ? `${artesanoCompleto.descripcion.substring(0, 50)}...` : 'null');
      console.log('📞 [SERVICIO] Teléfono:', artesanoCompleto?.telefono || 'null');
      
      return artesanoCompleto;
    } catch (error) {
      console.error('❌ [SERVICIO] Error en getArtesanoById:', error);
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
        console.error('Error al obtener publicaciones:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getPublicacionesByArtesano:', error);
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
        console.error('Error al obtener productos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getProductosByArtesano:', error);
      throw error;
    }
  },

  // Obtener datos completos del artesano (perfil + publicaciones + productos)
  async getArtesanoCompleto(userId) {
    try {
      console.log('🔍 [SERVICIO] Obteniendo datos completos del artesano:', userId);
      
      const [artesano, publicaciones, productos] = await Promise.all([
        this.getArtesanoById(userId),
        this.getPublicacionesByArtesano(userId),
        this.getProductosByArtesano(userId)
      ]);

      // Calcular total de likes de todas las publicaciones del artesano
      let totalLikes = 0;
      if (publicaciones && publicaciones.length > 0) {
        console.log('💖 [SERVICIO] Calculando likes totales para', publicaciones.length, 'publicaciones...');
        
        const publicacionIds = publicaciones.map(pub => pub.id);
        
        const { data: likesData, error: likesError } = await supabase
          .from('likes')
          .select('publicacion_id')
          .in('publicacion_id', publicacionIds);

        if (likesError) {
          console.error('❌ [SERVICIO] Error al obtener likes:', likesError);
        } else {
          totalLikes = likesData?.length || 0;
          console.log('💖 [SERVICIO] Total de likes calculado:', totalLikes);
        }
      }

      // Agregar total_likes al objeto artesano
      const artesanoConLikes = {
        ...artesano,
        total_likes: totalLikes
      };

      console.log('✅ [SERVICIO] Datos completos obtenidos - Total likes:', totalLikes);

      return {
        artesano: artesanoConLikes,
        publicaciones,
        productos
      };
    } catch (error) {
      console.error('❌ [SERVICIO] Error en getArtesanoCompleto:', error);
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
      console.error(`Error fetching item from ${tableName}:`, error);
      throw new Error(`No se pudo obtener el detalle del item.`);
    }

    return data;
  }
};

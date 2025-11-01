import { supabase } from '../supabase/client';

export const artesanoService = {
  // Obtener todos los artesanos desde la vista vista_detalle_artesanos
  async getArtesanos() {
    try {
      const { data, error } = await supabase
        .from('vista_detalle_artesanos')
        .select('*')
        .order('fecha_creacion_cuenta', { ascending: false });

      if (error) {
        console.error('Error al obtener artesanos:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error en getArtesanos:', error);
      throw error;
    }
  },

  // Obtener un artesano específico por ID con datos completos
  async getArtesanoById(userId) {
    try {
      const { data, error } = await supabase
        .from('vista_detalle_artesanos')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error al obtener artesano:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error en getArtesanoById:', error);
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
      const [artesano, publicaciones, productos] = await Promise.all([
        this.getArtesanoById(userId),
        this.getPublicacionesByArtesano(userId),
        this.getProductosByArtesano(userId)
      ]);

      return {
        artesano,
        publicaciones,
        productos
      };
    } catch (error) {
      console.error('Error en getArtesanoCompleto:', error);
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

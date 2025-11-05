import { supabase } from "../supabase/client";

export const estadisticasService = {
  async getArtesanosByLikes() {
    // Obtener todos los artesanos
    const { data: artesanos, error: artesanosError } = await supabase
      .from('artesanos')
      .select('user_id, nombre, avatar_url');

    if (artesanosError) {
      console.error('Error fetching artesanos:', artesanosError);
      return null;
    }

    // Obtener todas las publicaciones con el conteo de likes
    const { data: publicaciones, error: publicacionesError } = await supabase
      .from('publicaciones')
      .select('artesano_user_id, likes(id)');

    if (publicacionesError) {
      console.error('Error fetching publicaciones:', publicacionesError);
      return null;
    }

    // Crear un mapa de likes por artesano
    const likesPerArtesano = publicaciones.reduce((acc, pub) => {
      if (pub.artesano_user_id) {
        acc[pub.artesano_user_id] = (acc[pub.artesano_user_id] || 0) + pub.likes.length;
      }
      return acc;
    }, {});

    // Combinar artesanos con su conteo de likes
    const artesanosConLikes = artesanos.map(artesano => ({
      ...artesano,
      total_likes: likesPerArtesano[artesano.user_id] || 0
    }));

    // Ordenar por likes
    const sortedArtesanos = artesanosConLikes.sort((a, b) => b.total_likes - a.total_likes);

    return sortedArtesanos;
  },

  /**
   * Obtener los 5 artesanos con mayor número de likes.
   * Reutiliza la consulta getArtesanosByLikes y devuelve los primeros 5.
   * Retorna null en caso de error o un arreglo (posiblemente vacío) cuando hay datos.
   */
  async getTop5ArtesanosByLikes() {
    // Reutilizamos la función ya definida que devuelve los artesanos ordenados por likes
    const sorted = await this.getArtesanosByLikes();
    if (!sorted) return null;
    // Devolver sólo los primeros 5
    return sorted.slice(0, 5);
  },


  // Obtener el conteo de productos por artesano
  async getProductsCountByArtesano() {
    // Obtener todos los artesanos
    const { data: artesanos, error: artesanosError } = await supabase
      .from('artesanos')
      .select('user_id, nombre, avatar_url');

    if (artesanosError) {
      console.error('Error fetching artesanos:', artesanosError);
      return null;
    }

    // Obtener todos los productos
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('artesano_id');

    if (productosError) {
      console.error('Error fetching productos:', productosError);
      return null;
    }

    // Crear un mapa de productos por artesano
    const productsPerArtesano = productos.reduce((acc, prod) => {
      if (prod.artesano_id) {
        acc[prod.artesano_id] = (acc[prod.artesano_id] || 0) + 1;
      }
      return acc;
    }, {});

    // Combinar artesanos con su conteo de productos
    const artesanosConProductos = artesanos.map(artesano => ({
      ...artesano,
      total_productos: productsPerArtesano[artesano.user_id] || 0
    }));

    // Ordenar por conteo de productos
    const sortedArtesanos = artesanosConProductos.sort((a, b) => b.total_productos - a.total_productos);

    return sortedArtesanos;
  },

    // Obtener artesanos ordenados por fecha de registro (de más antiguo a más nuevo)
  async getArtesanosByAntiguedad() {
    // Obtener artesanos con fecha de registro
    const { data: artesanos, error } = await supabase
      .from('artesanos')
      .select('user_id, nombre, avatar_url, created_at');

    if (error) {
      console.error('Error fetching artesanos for antiguedad:', error);
      return null;
    }

    // Ordenar por created_at ascendente (el más antiguo primero)
    const sortedByOldest = [...(artesanos || [])].sort((a, b) => {
      const aDate = a?.created_at ? new Date(a.created_at).getTime() : 0;
      const bDate = b?.created_at ? new Date(b.created_at).getTime() : 0;
      return aDate - bDate;
    });

    return sortedByOldest;
  }
};


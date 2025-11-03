import { supabase } from "../supabase/client";

export const estadisticasService = {
  async getArtesanosByLikes() {
    // 1. Fetch all artesanos
    const { data: artesanos, error: artesanosError } = await supabase
      .from('artesanos')
      .select('user_id, nombre, avatar_url');

    if (artesanosError) {
      console.error('Error fetching artesanos:', artesanosError);
      return null;
    }

    // 2. Fetch all publications with likes count
    const { data: publicaciones, error: publicacionesError } = await supabase
      .from('publicaciones')
      .select('artesano_user_id, likes(id)');

    if (publicacionesError) {
      console.error('Error fetching publicaciones:', publicacionesError);
      return null;
    }

    // 3. Create a map of likes per artisan
    const likesPerArtesano = publicaciones.reduce((acc, pub) => {
      if (pub.artesano_user_id) {
        acc[pub.artesano_user_id] = (acc[pub.artesano_user_id] || 0) + pub.likes.length;
      }
      return acc;
    }, {});

    // 4. Combine artesanos with their likes count
    const artesanosConLikes = artesanos.map(artesano => ({
      ...artesano,
      total_likes: likesPerArtesano[artesano.user_id] || 0
    }));

    // 5. Sort by likes
    const sortedArtesanos = artesanosConLikes.sort((a, b) => b.total_likes - a.total_likes);

    return sortedArtesanos;
  },


  // 2. Get products count by artesano
  async getProductsCountByArtesano() {
    // 1. Fetch all artesanos
    const { data: artesanos, error: artesanosError } = await supabase
      .from('artesanos')
      .select('user_id, nombre, avatar_url');

    if (artesanosError) {
      console.error('Error fetching artesanos:', artesanosError);
      return null;
    }

    // 2. Fetch all products
    const { data: productos, error: productosError } = await supabase
      .from('productos')
      .select('artesano_id');

    if (productosError) {
      console.error('Error fetching productos:', productosError);
      return null;
    }

    // 3. Create a map of products per artisan
    const productsPerArtesano = productos.reduce((acc, prod) => {
      if (prod.artesano_id) {
        acc[prod.artesano_id] = (acc[prod.artesano_id] || 0) + 1;
      }
      return acc;
    }, {});

    // 4. Combine artesanos with their product count
    const artesanosConProductos = artesanos.map(artesano => ({
      ...artesano,
      total_productos: productsPerArtesano[artesano.user_id] || 0
    }));

    // 5. Sort by product count
    const sortedArtesanos = artesanosConProductos.sort((a, b) => b.total_productos - a.total_productos);

    return sortedArtesanos;
  }
};

// src/services/MarketplaceService.js
import { supabase } from '../supabase/client';

/**
 * Servicio para manejar operaciones del Marketplace
 */
export class MarketplaceService {

  /**
   * Obtiene productos del marketplace con paginación
   * @param {number} limit - Cantidad de productos por página (default: 20)
   * @param {number} page - Número de página (default: 0)
   * @param {object} filters - Filtros opcionales { categoria, minPrecio, maxPrecio, busqueda }
   * @returns {Promise<{success: boolean, data?: array, error?: string, hasMore?: boolean}>}
   */
  static async getProductos(limit = 20, page = 0, filters = {}) {
    try {
      console.log('[MarketplaceService] Recibidos filtros:', JSON.stringify(filters, null, 2));
      const offset = page * limit;


      // Construir query base
      let query = supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          min_may,
          categoria,
          estado,
          imagen_url,
          created_at,
          artesano_id,
          artesanos:artesano_id (
            nombre,
            ubicacion,
            categoria,
            avatar_url
          )
        `, { count: 'exact' });

      // FILTRO DE BÚSQUEDA DE TEXTO (RPC)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        console.log(`[MarketplaceService] Aplicando filtro de búsqueda de texto: "${filters.searchQuery.trim()}"`);
        const searchTerm = filters.searchQuery.trim(); // Ya no es necesario formatear para websearch_to_tsquery

        // Llamamos a la función de la base de datos
        const { data: rpcData, error: rpcError } = await supabase.rpc('buscar_productos_con_artesano', {
          search_term: searchTerm // Pasamos el texto directamente
        });

        if (rpcError) {
          console.error('[MarketplaceService] Error en RPC:', rpcError.message);
          return { success: false, error: rpcError.message };
        }

        if (!rpcData || rpcData.length === 0) {
          return { success: true, data: [], hasMore: false, totalCount: 0 };
        }

        const productIds = rpcData.map(p => p.id);
        query = query.in('id', productIds);
      }

      if (filters.categories && filters.categories.length > 0) {
        query = query.in('categoria', filters.categories);
      }

      if (filters.location && filters.location.trim()) {
        // La sintaxis para filtrar en una tabla unida es "nombre_tabla_unida.columna"
        query = query.ilike('artesanos.ubicacion', `%${filters.location.trim()}%`);
      }

      // Filtro por estado ('publicados', 'disponibles', 'vendidos', etc.)
      if (filters.estado) {
        if (filters.estado === 'disponibles') {
          query = query.eq('estado', 'activo');
        } else if (filters.estado === 'vendidos') {
          query = query.eq('estado', 'vendido');
        } else if (filters.estado === 'no-disponible') {
          query = query.eq('estado', 'inactivo');
        }
        // 'publicados' y 'todos' no necesitan un filtro de estado específico aquí.
      }

      if (filters.priceRange?.min && filters.priceRange.min !== '') {
        const minPrice = parseFloat(filters.priceRange.min);
        if (!isNaN(minPrice)) query = query.gte('precio', minPrice);
      }

      if (filters.priceRange?.max && filters.priceRange.max !== '') {
        const maxPrice = parseFloat(filters.priceRange.max);
        if (!isNaN(maxPrice)) query = query.lte('precio', maxPrice);
      }

      // Filtro por tipo de venta (minoreo/mayoreo)
      if (filters.tipo_venta === 'mayorista') {
        query = query.in('min_may', ['mayoreo', 'ambas']);
      } else if (filters.tipo_venta === 'minorista') {
        query = query.in('min_may', ['minoreo', 'ambas']);
      }

      // Filtro por stock mínimo (para mayoristas)
      if (filters.minStock && filters.minStock > 0) {
        query = query.gte('stock', filters.minStock);
      }

      // Ordenar y paginar
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: productos, error: productsError, count } = await query;

      if (productsError) {
        console.error('[MarketplaceService] Error en la consulta a Supabase:', productsError.message);
        return { success: false, error: productsError.message };
      }

      if (!productos || productos.length === 0) {
        console.log('[MarketplaceService] La consulta no devolvió productos.');
        return { success: true, data: [], hasMore: false, totalCount: 0 };
      }

      // Formatear datos
      const productosFormateados = productos.map(prod => ({
        id: prod.id,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: parseFloat(prod.precio),
        min_may: prod.min_may,
        categoria: prod.categoria,
        estado: prod.estado,
        imagen_url: prod.imagen_url,
        created_at: prod.created_at,
        artesano: {
          id: prod.artesano_id,
          nombre: prod.artesanos?.nombre || 'Artesano',
          ubicacion: prod.artesanos?.ubicacion || '',
          categoria: prod.artesanos?.categoria || '',
          avatar_url: prod.artesanos?.avatar_url || null,
        },
      }));


      return {
        success: true,
        data: productosFormateados,
        hasMore: count ? (offset + limit < count) : false,
        totalCount: count || 0,
      };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene un producto específico por ID
   * @param {string} productoId - ID del producto
   * @returns {Promise<{success: boolean, data?: object, error?: string}>}
   */
  static async getProducto(productoId) {
    try {
      // Obtener usuario actual una sola vez
      const { data: { user } } = await supabase.auth.getUser();

      const { data: producto, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria,
          imagen_url,
          min_may,
          estado,
          stock,
          created_at,
          artesano_id,
          artesanos:artesano_id (
            user_id,
            nombre,
            ubicacion,
            link_ubicacion,
            categoria,
            avatar_url,
            curp,
            numero_ine
          ),
          producto_imagenes (
            imagen_url,
            orden
          )
        `)
        .eq('id', productoId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      
      // Ordenar las imágenes de la galería por la columna 'orden'
      if (producto.producto_imagenes) {
        producto.producto_imagenes.sort((a, b) => a.orden - b.orden);
      }
      // Verificar si el usuario actual ha guardado el producto
      let isSaved = false;
      if (user) {
        const { data: savedData, error: savedError } = await supabase
          .from('productos_guardados')
          .select('id')
          .eq('producto_id', productoId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (savedError) {
          console.error('[MarketplaceService] Error checking saved status:', savedError.message);
          // No bloqueamos la carga por este error, simplemente asumimos que no está guardado
        } else {
          isSaved = !!savedData;
        }
      }

      // Verificar si el usuario actual ha dado like y obtener conteo total
      const [userLikeResult, likesCountResult] = await Promise.all([
        supabase
          .from('likes_productos')
          .select('id')
          .eq('producto_id', productoId)
          .eq('user_id', user?.id)
          .maybeSingle(),
        supabase
          .from('likes_productos')
          .select('id', { count: 'exact', head: true })
          .eq('producto_id', productoId)
      ]);

      const productoFormateado = {
        ...producto, // Mantenemos todos los campos del producto
        precio: parseFloat(producto.precio),
        is_liked: !!userLikeResult.data,
        is_saved: isSaved, // <-- AÑADIMOS EL ESTADO DE GUARDADO
        likes_count: likesCountResult.count || 0,
        // CORRECCIÓN: Renombrar 'artesanos' a 'artesano' para que coincida con la vista
        artesano: {
          ...producto.artesanos,
          id: producto.artesanos?.user_id // Aseguramos que el ID esté disponible como 'id'
        }
      };

      return { success: true, data: productoFormateado };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene los datos de contacto de un artesano (teléfono y email).
   * @param {string} artesanoId - El ID del usuario artesano.
   * @returns {Promise<{success: boolean, data?: {telefono: string | null}, error?: string}>}
   */
  static async getArtesanoContact(artesanoId) {
    try {
      if (!artesanoId) {
        return { success: false, error: 'ID de artesano no proporcionado' };
      }
 
      // 1. Obtener el teléfono de la tabla 'perfiles'
      const { data: perfilResult, error: perfilError } = await supabase
        .from('perfiles')
        .select('telefono')
        .eq('id', artesanoId)
        .single();
 
      if (perfilError && perfilError.code !== 'PGRST116') { // PGRST116 = no rows found, lo cual es válido
        throw perfilError;
      }

      const contactData = {
        telefono: perfilResult?.telefono || null,
        email: null, // Ya no se obtiene el email
      };
 
      return { success: true, data: contactData };
    } catch (error) {
      return { success: false, error: 'No se pudieron obtener los datos de contacto.' };
    }
  }

  /**
   * Obtiene productos de un artesano específico
   * @param {string} artesanoId - ID del artesano
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async getProductosPorArtesano(artesanoId) {
    try {
      const { data: productos, error } = await supabase
        .from('productos')
        .select('*')
        .eq('artesano_id', artesanoId)
        .eq('estado', 'activo')
        .order('created_at', { ascending: false });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data: productos };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtiene categorías disponibles
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async getCategorias() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select('categoria')
        .eq('estado', 'activo')
        .not('categoria', 'is', null);

      if (error) {
        return { success: false, error: error.message };
      }

      // Obtener categorías únicas
      const categoriasUnicas = [...new Set(data.map(p => p.categoria))];
      
      return { success: true, data: categoriasUnicas };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Busca productos por término
   * @param {string} searchTerm - Término de búsqueda
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async buscarProductos(searchTerm) {
    try {

      const { data: productos, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria,
          estado,
          imagen_url,
          created_at,
          artesano_id,
          artesanos:artesano_id (
            nombre,
            ubicacion,
            avatar_url
          )
        `)
        .eq('estado', 'activo')
        .or(`nombre.ilike.%${searchTerm}%,descripcion.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        return { success: false, error: error.message };
      }

      const productosFormateados = productos.map(prod => ({
        id: prod.id,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: parseFloat(prod.precio),
        categoria: prod.categoria,
        estado: prod.estado,
        imagen_url: prod.imagen_url,
        created_at: prod.created_at,
        artesano: {
          id: prod.artesano_id,
          nombre: prod.artesanos?.nombre || 'Artesano',
          ubicacion: prod.artesanos?.ubicacion || '',

          avatar_url: prod.artesanos?.avatar_url || null,
          foto: prod.artesanos?.foto || null,
        },
      }));

      return { success: true, data: productosFormateados };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresca los productos (para pull-to-refresh)
   * @param {object} filters - Filtros opcionales
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async refreshProductos(filters = {}) {
    return await this.getProductos(20, 0, filters);
  }

  /**
   * Marca/desmarca un producto como favorito (para futuro)
   * @param {string} productoId - ID del producto
   * @param {string} userId - ID del usuario
   * @returns {Promise<{success: boolean, favorited?: boolean, error?: string}>}
   */
  static async toggleFavorito(productoId, userId) {
    try {

      // Verificar si ya existe
      const { data: existingFav, error: checkError } = await supabase
        .from('favoritos_productos')
        .select('id')
        .eq('producto_id', productoId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        return { success: false, error: checkError.message };
      }

      let favorited;

      if (existingFav) {
        // Quitar favorito
        const { error: deleteError } = await supabase
          .from('favoritos_productos')
          .delete()
          .eq('producto_id', productoId)
          .eq('user_id', userId);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }

        favorited = false;
      } else {
        // Agregar favorito
        const { error: insertError } = await supabase
          .from('favoritos_productos')
          .insert({
            producto_id: productoId,
            user_id: userId,
          });

        if (insertError) {
          return { success: false, error: insertError.message };
        }

        favorited = true;
      }

      return { success: true, favorited };

    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Guarda o quita un producto de la lista de guardados de un usuario (toggle).
   * @param {string} productoId - ID del producto a guardar/quitar.
   * @returns {Promise<{success: boolean, saved?: boolean, error?: string}>}
   */
  static async toggleSaveProduct(productoId) {
    try {
      // 1. Obtener el usuario actual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'Debes iniciar sesión para guardar productos' };
      }

      const userId = user.id;

      // 2. Verificar si el producto ya está guardado
      const { data: existingSave, error: checkError } = await supabase
        .from('productos_guardados')
        .select('id')
        .eq('producto_id', productoId)
        .eq('user_id', userId)
        .maybeSingle();

      if (checkError) {
        console.error('[MarketplaceService] Error checking saved product:', checkError.message);
        return { success: false, error: checkError.message };
      }

      let saved;

      if (existingSave) {
        // 3a. Si ya existe, lo eliminamos (quitar de guardados)
        const { error: deleteError } = await supabase
          .from('productos_guardados')
          .delete()
          .eq('id', existingSave.id);

        if (deleteError) {
          return { success: false, error: deleteError.message };
        }
        saved = false;
      } else {
        // 3b. Si no existe, lo insertamos (guardar)
        const { error: insertError } = await supabase
          .from('productos_guardados')
          .insert({ producto_id: productoId, user_id: userId });

        if (insertError) {
          return { success: false, error: insertError.message };
        }
        saved = true;
      }

      return { success: true, saved };

    } catch (error) {
      console.error('[MarketplaceService] Unexpected error in toggleSaveProduct:', error.message);
      return { success: false, error: error.message };
    }
  }
}

export default MarketplaceService;

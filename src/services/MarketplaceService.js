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
      const offset = page * limit;
      
      console.log('🛒 Obteniendo productos - Página:', page, 'Límite:', limit);
      console.log('📊 Filtros:', filters);

      // Construir query base
      let query = supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria,
          imagen_url,
          created_at,
          artesano_id,
          artesanos:artesano_id (
            nombre,
            ubicacion,
            categoria,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('estado', 'activo');

      // Aplicar filtros
      if (filters.categoria) {
        query = query.eq('categoria', filters.categoria);
      }

      if (filters.busqueda) {
        query = query.or(`nombre.ilike.%${filters.busqueda}%,descripcion.ilike.%${filters.busqueda}%`);
      }

      if (filters.minPrecio !== undefined) {
        query = query.gte('precio', filters.minPrecio);
      }

      if (filters.maxPrecio !== undefined) {
        query = query.lte('precio', filters.maxPrecio);
      }

      // Ordenar y paginar
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data: productos, error: productsError, count } = await query;

      if (productsError) {
        console.error('❌ Error al obtener productos:', productsError);
        return { success: false, error: productsError.message };
      }

      if (!productos || productos.length === 0) {
        return { success: true, data: [], hasMore: false, totalCount: 0 };
      }

      // Formatear datos
      const productosFormateados = productos.map(prod => ({
        id: prod.id,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: parseFloat(prod.precio),
        categoria: prod.categoria,
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

      console.log('✅ Productos obtenidos:', productosFormateados.length);

      return {
        success: true,
        data: productosFormateados,
        hasMore: count ? (offset + limit < count) : false,
        totalCount: count || 0,
      };

    } catch (error) {
      console.error('❌ Error en getProductos:', error);
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
      console.log('🔍 Obteniendo producto:', productoId);

      const { data: producto, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria,
          imagen_url,
          estado,
          created_at,
          artesano_id,
          artesanos:artesano_id (
            nombre,
            ubicacion,
            categoria,
            avatar_url,
            curp,
            numero_ine
          )
        `)
        .eq('id', productoId)
        .eq('estado', 'activo')
        .single();

      if (error) {
        console.error('❌ Error al obtener producto:', error);
        return { success: false, error: error.message };
      }

      const productoFormateado = {
        id: producto.id,
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio: parseFloat(producto.precio),
        categoria: producto.categoria,
        imagen_url: producto.imagen_url,
        estado: producto.estado,
        created_at: producto.created_at,
        artesano: {
          id: producto.artesano_id,
          nombre: producto.artesanos?.nombre || 'Artesano',
          ubicacion: producto.artesanos?.ubicacion || '',
          categoria: producto.artesanos?.categoria || '',
          avatar_url: producto.artesanos?.avatar_url || null,
          curp: producto.artesanos?.curp || '',
          numero_ine: producto.artesanos?.numero_ine || '',
        },
      };

      return { success: true, data: productoFormateado };

    } catch (error) {
      console.error('❌ Error en getProducto:', error);
      return { success: false, error: error.message };
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
        console.error('❌ Error al obtener productos del artesano:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: productos };

    } catch (error) {
      console.error('❌ Error en getProductosPorArtesano:', error);
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
        console.error('❌ Error al obtener categorías:', error);
        return { success: false, error: error.message };
      }

      // Obtener categorías únicas
      const categoriasUnicas = [...new Set(data.map(p => p.categoria))];
      
      return { success: true, data: categoriasUnicas };

    } catch (error) {
      console.error('❌ Error en getCategorias:', error);
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
      console.log('🔍 Buscando productos:', searchTerm);

      const { data: productos, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          descripcion,
          precio,
          categoria,
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
        console.error('❌ Error en búsqueda:', error);
        return { success: false, error: error.message };
      }

      const productosFormateados = productos.map(prod => ({
        id: prod.id,
        nombre: prod.nombre,
        descripcion: prod.descripcion,
        precio: parseFloat(prod.precio),
        categoria: prod.categoria,
        imagen_url: prod.imagen_url,
        created_at: prod.created_at,
        artesano: {
          id: prod.artesano_id,
          nombre: prod.artesanos?.nombre || 'Artesano',
          ubicacion: prod.artesanos?.ubicacion || '',
<<<<<<< HEAD
=======
          avatar_url: prod.artesanos?.avatar_url || null,
>>>>>>> 0944f5e7c0761bb475dd36b398ae1b0869f56b67
          foto: prod.artesanos?.foto || null,
        },
      }));

      return { success: true, data: productosFormateados };

    } catch (error) {
      console.error('❌ Error en buscarProductos:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Refresca los productos (para pull-to-refresh)
   * @param {object} filters - Filtros opcionales
   * @returns {Promise<{success: boolean, data?: array, error?: string}>}
   */
  static async refreshProductos(filters = {}) {
    console.log('🔄 Refrescando productos...');
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
      console.log('⭐ Toggle favorito:', productoId);

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
      console.error('❌ Error en toggleFavorito:', error);
      return { success: false, error: error.message };
    }
  }
}

export default MarketplaceService;
// app/(app)/MarketplacePage.js
// Página principal del marketplace con búsqueda y filtros integrados
import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text as DefaultText, TextInput, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import useCustomFonts from '../../hooks/useFonts';
import MarketplaceService from '../../src/services/MarketplaceService';
import { useFilter } from '../../src/context/FilterContext';

const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
);


const MarketplacePage = () => {
  const { filters } = useFilter();
  const { session, role } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchInput, setSearchInput] = useState(''); // Valor del campo de texto
  const [activeSearchQuery, setActiveSearchQuery] = useState(''); // Valor que dispara la búsqueda
  const [filter, setFilter] = useState('publicados'); // 'todos', 'publicados', 'vendidos', 'borrados', 'mis-compras'


  //NO MODIFICAR: Carga de productos con filtros y búsqueda
  const loadProductos = useCallback(async (page = 0) => {
    console.log(`[MarketplacePage] ==> Cargando productos para la página: ${page}. Búsqueda activa: "${activeSearchQuery}"`);
    try {
      if (page === 0) {
        setLoading(true);
      }

      // Unificar filtros y búsqueda en un solo objeto
      const serviceFilters = { ...filters };
      if (serviceFilters.priceRange) {
        serviceFilters.priceRange.min = serviceFilters.priceRange.min ? parseFloat(serviceFilters.priceRange.min) : null;
        serviceFilters.priceRange.max = serviceFilters.priceRange.max ? parseFloat(serviceFilters.priceRange.max) : null;
      }

      const combinedFilters = {
        ...serviceFilters,
        estado: filter,
        searchQuery: activeSearchQuery, // Añadimos el término de búsqueda aquí
      };

      console.log('[MarketplacePage] Filtros combinados enviados al servicio:', JSON.stringify(combinedFilters, null, 2));

      let result;
      if (filter === 'mis-compras') {
        result = await MarketplaceService.getMisCompras(session?.user?.id, 20, page);
      } else {
        result = await MarketplaceService.getProductos(20, page, combinedFilters);
      }

      console.log(`[MarketplacePage] <== Resultado del servicio: ${result.data?.length ?? 0} productos recibidos. ¿Hay más?: ${result.hasMore}`);

      if (result.success) {
        if (page === 0) {
          const newProductos = result.data || [];
          setProductos(newProductos);
        } else {
          const newProductos = result.data || [];
          setProductos(prev => (prev ? [...prev, ...newProductos] : newProductos));
        }
        setHasMore(result.hasMore);
        setCurrentPage(page); // Actualizar la página actual
      } else {
        console.error('[MarketplacePage] El servicio devolvió un error:', result.error);
      }
    } catch (error) {
      console.error('Error en loadProductos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, filter, activeSearchQuery, session?.user?.id]);

  //NO MODIFICAR:
  // UNIFICADO: Este useEffect ahora se encarga de recargar desde el servicio cuando CUALQUIER filtro cambia.
  useEffect(() => {
    // Se recarga cuando cambian los filtros del contexto, el filtro de estado o la búsqueda de texto.
    loadProductos(0);
  }, [filters, filter, activeSearchQuery]); // Ahora depende de todos los filtros

  //NO MODIFICAR:
  // La búsqueda y el cambio de filtro de estado ahora llaman a `loadProductos` explícitamente.
  const handleSearchSubmit = () => {
    console.log(`[MarketplacePage] -> Disparando búsqueda con término: "${searchInput}"`);
    setCurrentPage(0);
    // Solo actualizamos el estado, el useEffect se encargará de llamar a loadProductos
    if (activeSearchQuery !== searchInput) {
      setActiveSearchQuery(searchInput);
    } else {
      // Si la búsqueda es la misma, forzamos la recarga por si acaso
      loadProductos(0);
    }
  };

  //NO MODIFICAR:
  // Limpiar la búsqueda
  const clearSearch = () => {
    console.log('[MarketplacePage] -> Limpiando búsqueda.');
    setSearchInput('');
    setCurrentPage(0);
    // Solo actualizamos el estado, el useEffect se encargará de llamar a loadProductos
    setActiveSearchQuery('');
  };

  //NO MODIFICAR:
  // Manejo del cambio de filtro de estado
  const handleFilterChange = (newFilter) => {
    setCurrentPage(0);
    // Solo actualizamos el estado, el useEffect se encargará de llamar a loadProductos
    setFilter(newFilter);
  };

  //NO MODIFICAR:
  // Manejo del refresco
  const onRefresh = () => {
    setRefreshing(true);
    loadProductos(0);
  };

  //NO MODIFICAR:
  // Cargar más productos
  const loadMore = () => {
    if (hasMore && !loading) {
      loadProductos(currentPage + 1); // Cargar la siguiente página
    }
  };

  //NO MODIFICAR:
  // Formateo de precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  //NO MODIFICAR:
  // Navegación al detalle del producto
  const navigateToProduct = (productId) => {
    router.push({
      pathname: '/ProductDetailPage',
      params: { productId: productId.toString() }
    });
  };

  //NO MODIFICAR: Renderizado de cada producto
  const renderProduct = ({ item }) => {
    const isOwnProduct = session?.user?.id === item.artesano?.id;

    return (
      <TouchableOpacity
        className={`flex-1 m-2 bg-white rounded-xl overflow-hidden shadow-sm border-[#9D046D] ${isOwnProduct ? 'border-2' : 'border'}`}
        onPress={() => navigateToProduct(item.id)}
        activeOpacity={0.7}
      >
        {/* Imagen */}
        <View className="w-full aspect-square bg-gray-100">
          {item.imagen_url ? (
            <Image source={{ uri: item.imagen_url }} className="w-full h-full object-cover" />
          ) : (
            <View className="w-full h-full justify-center items-center bg-gray-200">
              <MaterialCommunityIcons name="package-variant" size={40} color="#ccc" />
            </View>
          )}
        </View>

        {/* Información */}
        <View className="p-3">
          <Text className="text-sm font-semibold text-gray-900 mb-1" numberOfLines={2}>
            {item.nombre}
          </Text>
          <Text className="text-lg font-bold text-[#9D046D]">{formatPrice(item.precio)}</Text>
          {item.artesano && (
            <View className="flex-row items-center mt-1">
              <MaterialCommunityIcons name="account" size={12} color="#666" />
              <Text className="ml-1 text-xs text-gray-600" numberOfLines={1}>
                {item.artesano.nombre}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View className="py-5 items-center">
        <ActivityIndicator size="small" color="#9D046D" />
      </View>
    );
  };

  const renderEmpty = () => {
    const isSearching = activeSearchQuery.trim().length > 0;
    return (
      <View className="flex-1 justify-center items-center px-10 py-20">
        <MaterialCommunityIcons
          name={isSearching ? "magnify" : "store-off-outline"}
          size={80}
          color="#ccc"
        />
        <Text className="mt-4 text-lg font-semibold text-gray-600 text-center">
          {isSearching
            ? `No se encontraron productos para "${activeSearchQuery}"`
            : 'No hay productos disponibles'
          }
        </Text>
        <Text className="mt-2 text-sm text-gray-500 text-center">
          {isSearching
            ? 'Intenta con otra búsqueda'
            : 'Próximamente habrá productos para ti'
          }
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-100">
        <ActivityIndicator size="large" color="#9D046D" />
        <Text className="mt-3 text-sm text-gray-600">Cargando marketplace...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-100">
      {/* Header */}
      <View className="bg-white pb-3">
        <View className="px-4 flex-row items-center justify-between pt-4">          
          <Text className="text-3xl font-bold text-gray-900 mb-4">Marketplace</Text>
          {role === 'artesano' && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/ArtesanoProducts',
                  params: { userId: session?.user?.id },
                })
              }
            >
              <MaterialCommunityIcons name="plus-circle-outline" size={28} color="#9D046D" />
            </TouchableOpacity>
          )}
        </View>

        {/* Barra de Búsqueda */}
        <View className="px-4 mt-2">
          <View className="flex-row items-center bg-gray-200 rounded-xl px-4 py-2 border-2 border-[#9D046D]/50">
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Buscar y presionar Enter..."
              value={searchInput} // Controlado por searchInput
              onChangeText={setSearchInput} // Actualiza searchInput al escribir
              onSubmitEditing={handleSearchSubmit} // <-- Se activa al presionar Enter
              returnKeyType="search" // <-- Cambia el botón del teclado a "Buscar"
            />
            {/* Botón para limpiar la búsqueda */}
            {searchInput.length > 0 && (
              <TouchableOpacity onPress={clearSearch} className="p-1">
                <MaterialCommunityIcons name="close" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mt-2">
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 mr-2 rounded-xl ${
              filter === 'todos' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => router.push('/(app)/MarketplaceFilters')}
          >
            <Text className={`font-medium mr-2 ${filter === 'todos' ? 'text-white' : 'text-gray-800'}`}>
              Filtros
            </Text>
            <MaterialCommunityIcons 
              name={'tune'} 
              size={20}
              color={Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : !!f) ? '#fff' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'publicados' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => handleFilterChange('publicados')}
          >
            <Text className={`font-medium ${filter === 'publicados' ? 'text-white' : 'text-gray-800'}`}>Publicados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'disponibles' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => handleFilterChange('disponibles')}
          >
            <Text className={`font-medium ${filter === 'disponibles' ? 'text-white' : 'text-gray-800'}`}>Disponibles</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'vendidos' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => handleFilterChange('vendidos')}
          >
            <Text className={`font-medium ${filter === 'vendidos' ? 'text-white' : 'text-gray-800'}`}>Vendidos</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'no-disponible' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => handleFilterChange('no-disponible')}
          >
            <Text className={`font-medium ${filter === 'no-disponible' ? 'text-white' : 'text-gray-800'}`}>No Disponible</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Productos */}
      <FlatList
        data={productos}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={3}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#9D046D']}
            tintColor="#9D046D"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />

      {/* Botón Flotante (FAB) - SOLO PARA EL ARTESANO */}
      {role === 'artesano' && (
        <TouchableOpacity
          className="absolute right-5 bottom-5 w-14 h-14 bg-[#9D046D] rounded-full justify-center items-center shadow-lg"
          onPress={() =>
            router.push({
              pathname: '/ArtesanoProducts',
              params: { userId: session?.user?.id },
            })
          }
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MarketplacePage;
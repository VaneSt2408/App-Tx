// app/(app)/MarketplacePage.js
import React, { useState, useEffect, useMemo } from 'react';
import { View, FlatList, Image, TouchableOpacity, Text as DefaultText, TextInput, ActivityIndicator, RefreshControl, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import useCustomFonts from '../../hooks/useFonts';
import MarketplaceService from '../../src/services/MarketplaceService';

const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
);


const MarketplacePage = () => {
  const { session } = useAuth();
  const router = useRouter();
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('todos'); // 'todos', 'publicados', 'vendidos', 'borrados', 'mis-compras'
  const [filteredProductos, setFilteredProductos] = useState([]);

  // Cargar productos inicial
  useEffect(() => {
    loadProductos();
  }, []);

  // Filtro de búsqueda local y por estado
  useEffect(() => {
    filterProductos();
  }, [searchQuery, productos, filter]);

  const filterProductos = () => {
    let filtered = [...productos];

    // Aplicar filtro por estado
    if (filter === 'publicados') {
      filtered = filtered.filter(p => p.estado === 'activo');
    } else if (filter === 'vendidos') {
      filtered = filtered.filter(p => p.estado === 'vendido');
    } else if (filter === 'borrados') {
      filtered = filtered.filter(p => p.estado === 'inactivo');
    }
    // El filtro 'mis-compras' se maneja en `loadProductos` ya que requiere una consulta diferente.
    // Aquí solo nos aseguramos de no aplicar otros filtros de estado si 'mis-compras' está activo.
    else if (filter === 'mis-compras') {
    }
    // Para 'todos', no aplicamos filtro adicional

    // Aplicar filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(producto => {
        const nombre = (producto.nombre || '').toLowerCase();
        const descripcion = (producto.descripcion || '').toLowerCase();
        const categoria = (producto.categoria || '').toLowerCase();
        const artesanoNombre = (producto.artesano?.nombre || '').toLowerCase();
        const artesanoCategoria = (producto.artesano?.categoria || '').toLowerCase();

        return nombre.includes(query) ||
               descripcion.includes(query) ||
               categoria.includes(query) ||
               artesanoNombre.includes(query) ||
               artesanoCategoria.includes(query);
      });
    }

    setFilteredProductos(filtered);
  };

  const loadProductos = async (page = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
        setProductos([]); // Limpiar productos al cambiar de filtro o refrescar
      }

      let result;
      if (filter === 'mis-compras') {
        result = await MarketplaceService.getMisCompras(session?.user?.id, 20, page);
      } else {
        result = await MarketplaceService.getProductos(20, page);
      }

      if (result.success) {
        if (page === 0) {
          setProductos(result.data);
        } else {
          setProductos(prev => (prev ? [...prev, ...result.data] : result.data));
        }
        setHasMore(result.hasMore);
      }
    } catch (error) {
      console.error('Error en loadProductos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Recargar productos cuando el filtro cambia
  useEffect(() => {
    loadProductos(0);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadProductos(0);
  };

  const loadMore = () => {
    if (hasMore && !loading) {
      loadProductos(currentPage + 1);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const navigateToProduct = (productId) => {
    router.push({
      pathname: '/ProductDetailPage',
      params: { productId: productId.toString() }
    });
  };

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
    const isSearching = searchQuery.trim().length > 0;
    return (
      <View className="flex-1 justify-center items-center px-10 py-20">
        <MaterialCommunityIcons
          name={isSearching ? "magnify" : "store-off-outline"}
          size={80}
          color="#ccc"
        />
        <Text className="mt-4 text-lg font-semibold text-gray-600 text-center">
          {isSearching
            ? `No se encontraron productos para "${searchQuery}"`
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
        <View className="px-4 flex-row items-center justify-between pt-2">
          <View className="w-10 h-10" />
          <Text className="text-xl font-bold text-gray-900">Marketplace</Text>
          <TouchableOpacity 
            className="p-2" 
            onPress={() => setFilter('mis-compras')}
          >
            <MaterialCommunityIcons 
              name={filter === 'mis-compras' ? "shopping" : "shopping-outline"} 
              size={26} color={filter === 'mis-compras' ? '#9D046D' : '#333'} />
          </TouchableOpacity>
        </View>

        {/* Barra de Búsqueda */}
        <View className="px-4 mt-2">
          <View className="flex-row items-center bg-gray-200 rounded-xl px-4 py-2 border-2 border-[#9D046D]/50">
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              className="flex-1 ml-2 text-base"
              placeholder="Buscar productos, artesanos, categorías..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filtros */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4 mt-2">
          <TouchableOpacity
            className={`flex-row items-center px-4 py-2 mr-2 rounded-xl ${
              filter === 'todos' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => router.push('/MarketplaceFilters')}
          >
            <Text className={`font-medium mr-2 ${filter === 'todos' ? 'text-white' : 'text-gray-800'}`}>
              Filtros
            </Text>
            <MaterialCommunityIcons 
              name={'tune'} 
              size={20} 
              color={filter === 'todos' ? '#fff' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'publicados' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => setFilter('publicados')}
          >
            <Text className={`font-medium ${filter === 'publicados' ? 'text-white' : 'text-gray-800'}`}>Publicados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-4 py-2 mr-2 rounded-xl ${
              filter === 'vendidos' ? 'bg-[#9D046D] text-white' : 'bg-gray-200 text-gray-800'
            }`}
            onPress={() => setFilter('vendidos')}
          >
            <Text className={`font-medium ${filter === 'vendidos' ? 'text-white' : 'text-gray-800'}`}>Vendidos</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {/* Lista de Productos */}
      <FlatList
        data={filteredProductos}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
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
      {session?.user?.role === 'artesano' && (
        <TouchableOpacity
          className="absolute right-5 bottom-5 w-14 h-14 bg-[#9D046D] rounded-full justify-center items-center shadow-lg"
          onPress={() => {
            router.push('/CreateProductPage'); // Asegúrate de que esta ruta exista
          }}
        >
          <MaterialCommunityIcons name="plus" size={28} color="white" />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default MarketplacePage;
// En: app/(app)/MarketplacePage.js -> Archivo de marketplace (Frontend)
// Este archivo es el encargado de mostrar el marketplace en la aplicación.
// Muestra los productos del marketplace registrados en la base de datos y permite buscarlos por nombre, categoría o ubicación.
// También permite navegar al perfil del artesano y ver su información completa.

// Importaciones
import React, { useState, useEffect, useMemo } from 'react';
import {View,Text,FlatList,Image,TouchableOpacity,StyleSheet,TextInput,ActivityIndicator,RefreshControl,} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MarketplaceService from '../../src/services/MarketplaceService';

// Componente principal
export default function MarketplacePage() {
  const router = useRouter(); // Obtener el router
  const [productos, setProductos] = useState([]); // Establecer el estado de los productos
  const [loading, setLoading] = useState(true); // Establecer el estado de carga
  const [refreshing, setRefreshing] = useState(false); // Establecer el estado de refresco
  const [currentPage, setCurrentPage] = useState(0); // Establecer el estado de la página actual
  const [hasMore, setHasMore] = useState(true); // Establecer el estado de si hay más productos
  const [searchQuery, setSearchQuery] = useState(''); // Establecer el estado de la consulta de búsqueda
  const [filteredProductos, setFilteredProductos] = useState([]); // Establecer el estado de los productos filtrados

  // Cargar productos inicial
  useEffect(() => {
    loadProductos();
  }, []);

  // Filtro de búsqueda local
  useEffect(() => {
    filterProductos();
  }, [searchQuery, productos]);

  // Función para filtrar los productos
  const filterProductos = () => {
    if (!searchQuery.trim()) {
      setFilteredProductos(productos);
      return;
    }

    // Filtrar los productos
    const query = searchQuery.toLowerCase().trim();
    const filtered = productos.filter(producto => {
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

    setFilteredProductos(filtered);
  };

  // Función para cargar los productos
  const loadProductos = async (page = 0) => {
    try {
      if (page === 0) {
        setLoading(true);
      }

      const result = await MarketplaceService.getProductos(20, page);

      if (result.success) {
        if (page === 0) {
          setProductos(result.data);
        } else {
          setProductos(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      } else {
        console.error('Error al cargar productos:', result.error);
      }
    } catch (error) {
      console.error('Error en loadProductos:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para refrescar los productos
  const onRefresh = () => {
    setRefreshing(true);
    loadProductos(0);
  };

  // Función para cargar más productos
  const loadMore = () => {
    if (hasMore && !loading) {
      loadProductos(currentPage + 1);
    }
  };

  // Función para formatear el precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Función para navegar al detalle del producto
  const navigateToProduct = (productId) => {
    router.push({
      pathname: '/ProductDetailPage',
      params: { productId: productId.toString() }
    });
  };

  const renderProduct = ({ item }) => (
    <TouchableOpacity 
      style={styles.productCard} 
      onPress={() => navigateToProduct(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.productImage} />
        ) : (
          <View style={styles.placeholderImage}>
            <MaterialCommunityIcons name="package-variant" size={40} color="#ccc" />
          </View>
        )}
      </View>

      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.nombre}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.precio)}</Text>
        
        {item.artesano && (
          <View style={styles.artesanoInfo}>
            <MaterialCommunityIcons name="account" size={14} color="#666" />
            <Text style={styles.artesanoName} numberOfLines={1}>
              {item.artesano.nombre}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2575fc" />
      </View>
    );
  };

  const renderEmpty = () => {
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name={isSearching ? "magnify" : "store-off-outline"} 
          size={80} 
          color="#ccc" 
        />
        <Text style={styles.emptyText}>
          {isSearching 
            ? `No se encontraron productos para "${searchQuery}"`
            : 'No hay productos disponibles'
          }
        </Text>
        <Text style={styles.emptySubtext}>
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando marketplace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        
        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Busca un producto, categoría, artesano ..."
              placeholderTextColor="#000"
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <FlatList
        data={filteredProductos}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id.toString()}
        numColumns={2}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredProductos.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#2575fc']}
            tintColor="#2575fc"
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  searchContainer: {
    paddingHorizontal: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 25,
    paddingHorizontal: 15,
    height: 44,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 10,
  },
  list: {
    padding: 8,
    paddingTop: 0,
    paddingBottom: 80,
  },
  emptyList: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  productCard: {
    flex: 1,
    margin: 8,
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 6,
    minHeight: 40,
  },
  productPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2575fc',
    marginBottom: 8,
  },
  artesanoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  artesanoName: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    flex: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
});

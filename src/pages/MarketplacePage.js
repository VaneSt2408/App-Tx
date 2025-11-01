// src/pages/MarketplacePage.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import MarketplaceService from '../services/MarketplaceService';
import ProductCard from '../components/ProductCard';

const MarketplacePage = ({ navigation }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [filters, setFilters] = useState({});

  // Cargar productos inicial
  useEffect(() => {
    loadProducts();
  }, []);

  // Función para cargar productos
  const loadProducts = async (page = 0, currentFilters = {}) => {
    try {
      if (page === 0) {
        setLoading(true);
      }

      const result = await MarketplaceService.getProductos(20, page, currentFilters);

      if (result.success) {
        if (page === 0) {
          setProducts(result.data);
        } else {
          setProducts(prev => [...prev, ...result.data]);
        }
        setHasMore(result.hasMore);
        setCurrentPage(page);
      } else {
        console.error('Error al cargar productos:', result.error);
        Alert.alert('Error', 'No se pudieron cargar los productos');
      }
    } catch (error) {
      console.error('Error en loadProducts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setSearchQuery('');
    setFilters({});
    loadProducts(0, {});
  }, []);

  // Cargar más productos (infinite scroll)
  const loadMore = () => {
    if (!loadingMore && hasMore && !loading && !searchQuery) {
      setLoadingMore(true);
      loadProducts(currentPage + 1, filters);
    }
  };

  // Buscar productos
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadProducts(0, filters);
      return;
    }

    try {
      setLoading(true);
      const result = await MarketplaceService.buscarProductos(searchQuery.trim());
      
      if (result.success) {
        setProducts(result.data);
        setHasMore(false); // No hay paginación en búsqueda
      } else {
        Alert.alert('Error', 'No se pudo realizar la búsqueda');
      }
    } catch (error) {
      console.error('Error en búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearch(false);
    loadProducts(0, filters);
  };

  // Navegar a detalle de producto
  const handleProductPress = (product) => {
    navigation.navigate('ProductDetail', { productId: product.id });
    // TODO: Navegar a pantalla de detalle
    // navigation.navigate('ProductDetail', { productId: product.id });
  };

  // Formatear precio
  const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(price);
  };

  // Renderizar cada producto (2 columnas)
  const renderProduct = ({ item, index }) => {
    return (
      <View style={styles.productContainer}>
        <ProductCard 
          product={item} 
          onPress={handleProductPress}
        />
      </View>
    );
  };

  // Renderizar footer (loading más productos)
  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2575fc" />
        <Text style={styles.footerLoaderText}>Cargando más productos...</Text>
      </View>
    );
  };

  // Renderizar cuando está vacío
  const renderEmpty = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons name="store-off-outline" size={64} color="#ccc" />
        <Text style={styles.emptyText}>
          {searchQuery ? 'No se encontraron productos' : 'No hay productos disponibles'}
        </Text>
        <Text style={styles.emptySubtext}>
          {searchQuery ? 'Intenta con otra búsqueda' : 'Vuelve pronto para ver nuevos productos'}
        </Text>
      </View>
    );
  };

  // Renderizar header con búsqueda
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>Marketplace</Text>
        <TouchableOpacity 
          style={styles.searchIconButton}
          onPress={() => setShowSearch(!showSearch)}
        >
          <MaterialCommunityIcons 
            name={showSearch ? "close" : "magnify"} 
            size={24} 
            color="#2575fc" 
          />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <MaterialCommunityIcons name="magnify" size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar productos..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch}>
                <MaterialCommunityIcons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity 
            style={styles.searchButton}
            onPress={handleSearch}
          >
            <Text style={styles.searchButtonText}>Buscar</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.resultsInfo}>
        <Text style={styles.resultsText}>
          {products.length} {products.length === 1 ? 'producto' : 'productos'}
        </Text>
      </View>
    </View>
  );

  if (loading && products.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando productos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        renderItem={renderProduct}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={products.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
    marginBottom: 8,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  searchIconButton: {
    padding: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
    color: '#1a1a1a',
  },
  searchButton: {
    backgroundColor: '#2575fc',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  resultsInfo: {
    marginTop: 4,
  },
  resultsText: {
    fontSize: 13,
    color: '#666',
  },
  list: {
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyList: {
    flexGrow: 1,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  productContainer: {
    width: '48%',
    marginBottom: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
});

export default MarketplacePage;
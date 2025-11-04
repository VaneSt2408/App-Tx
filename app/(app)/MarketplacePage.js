// En: app/(app)/MarketplacePage.js -> Archivo de marketplace (Frontend)

// Importaciones
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {View,Text,FlatList,Image,TouchableOpacity,StyleSheet,TextInput,ActivityIndicator,RefreshControl,SafeAreaView,Platform,ScrollView,Animated, Alert} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import MarketplaceService from '../../src/services/MarketplaceService';

// --- PALETA DE COLORES ---
const COLORS = {
    PRIMARY: '#9D046D',        // Color principal (Morado/Vino)
    INACTIVE: '#666',          // Color para texto inactivo o secundario
    BACKGROUND: '#f5f5f5',     // Color de fondo de la pantalla
    BORDER: '#e0e0e0',         // Color de borde de las tarjetas
    RATING: '#FFC700',         // Color de la estrella de calificación
};
// --------------------------

// Componente principal
export default function MarketplacePage() {
  const router = useRouter(); 
  const [productos, setProductos] = useState([]); 
  const [loading, setLoading] = useState(true); 
  const [refreshing, setRefreshing] = useState(false); 
  const [currentPage, setCurrentPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true); 
  const [searchQuery, setSearchQuery] = useState(''); 
  const [categories, setCategories] = useState([]); 
  const [selectedCategory, setSelectedCategory] = useState('Todos'); 
  const [filteredProductos, setFilteredProductos] = useState([]); 

  // Cargar productos inicial
  useEffect(() => {
    loadProductos();
  }, []);
  
  // Filtro de búsqueda local
  useEffect(() => {
    filterProductos();
  }, [searchQuery, productos, selectedCategory]);

  // Extraer categorías únicas de los productos
  useEffect(() => {
    if (productos.length > 0) {
      const uniqueCategories = [...new Set(productos.map(p => p.categoria).filter(Boolean))];
      setCategories(['Todos', ...uniqueCategories]);
    }
  }, [productos]);

  // Función para filtrar los productos (Lógica sin cambios)
  const filterProductos = () => {
    let tempProductos = productos;

    if (selectedCategory !== 'Todos') {
      tempProductos = tempProductos.filter(p => p.categoria === selectedCategory);
    }

    if (!searchQuery.trim()) {
      setFilteredProductos(tempProductos);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = tempProductos.filter(producto => {
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

  // Función para cargar los productos (Lógica sin cambios)
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
        // Manejar error de servicio
      }
    } catch (error) {
      // Manejar error de red
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

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

  // Componente de tarjeta de producto (SIMPLIFICADO)
  const ProductCard = ({ item }) => {
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    const [isFavorite, setIsFavorite] = useState(false); // Estado para simular si es favorito

    const onPressIn = () => {
      Animated.spring(scaleAnim, { toValue: 0.97, useNativeDriver: true }).start();
    };

    const onPressOut = () => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 4, tension: 40, useNativeDriver: true }).start();
    };

    return (
      <TouchableOpacity
        onPress={() => navigateToProduct(item.id)}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        style={styles.cardWrapper}
      >
        <Animated.View style={[styles.productCard, { transform: [{ scale: scaleAnim }] }]}>
          
          {/* 1. Contenedor de Imagen */}
          <View style={styles.imageContainer}>
            {item.imagen_url ? (
              <Image source={{ uri: item.imagen_url }} style={styles.productImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderImage}>
                <MaterialCommunityIcons name="image-off" size={40} color={COLORS.BORDER} />
              </View>
            )}
          </View>

          {/* 2. Información del Producto */}
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>
              {item.nombre || 'Producto sin nombre'}
            </Text>
            
            {/* Fila de Precio y Calificación */}
            <View style={styles.priceRow}>
                {/* Precio principal */}
                <Text style={styles.currentPrice}>{formatPrice(item.precio)}</Text>
                {/* Ícono de calificación (Estrella) */}
                <View style={styles.ratingContainer}>
                    <MaterialCommunityIcons name="star" size={12} color={COLORS.RATING} />
                    <Text style={styles.ratingText}>2.5K+</Text> 
                </View>
            </View>
            
            {/* Botón de Favoritos */}
            <TouchableOpacity
              style={[styles.favoritesButton, isFavorite && styles.favoritesButtonActive]}
              onPress={(e) => {
                e.stopPropagation(); // Evita que la tarjeta navegue
                setIsFavorite(!isFavorite); // Cambia el estado de favorito
                Alert.alert(
                  'Favoritos',
                  isFavorite ? `"${item.nombre}" eliminado de tus favoritos.` : `"${item.nombre}" agregado a tus favoritos.`
                );
              }}
            >
              <MaterialCommunityIcons name={isFavorite ? "star" : "star-outline"} size={16} color={isFavorite ? '#fff' : COLORS.PRIMARY} />
              <Text style={[styles.favoritesButtonText, isFavorite && styles.favoritesButtonTextActive]}>
                {isFavorite ? 'En favoritos' : 'Favoritos'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ... (renderFooter, renderCategoryFilters, renderHeader, renderEmpty, SkeletonLoader sin cambios)

  // Renderizados sin cambios
  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={COLORS.PRIMARY} />
      </View>
    );
  };

  const renderCategoryFilters = () => (
    <View style={styles.categoryContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScrollView}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryChip,
              selectedCategory === category && styles.categoryChipActive,
            ]}
            onPress={() => setSelectedCategory(category)}
          >
            <Text style={[
              styles.categoryChipText,
              selectedCategory === category && styles.categoryChipTextActive,
            ]}>{category}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Marketplace</Text>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={COLORS.INACTIVE} />
          <TextInput
            style={styles.searchInput}
            placeholder="Busca un producto, categoría, artesano ..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialCommunityIcons name="close-circle" size={20} color={COLORS.INACTIVE} />
            </TouchableOpacity>
          )}
        </View>
      </View>
      {renderCategoryFilters()}
    </View>
  );

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

  const SkeletonLoader = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.skeletonHeader} />
      <View style={styles.skeletonSearch} />
      <View style={styles.skeletonCategoryContainer}>
        <View style={styles.skeletonCategoryChip} />
        <View style={styles.skeletonCategoryChip} />
        <View style={styles.skeletonCategoryChip} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
      <View style={styles.skeletonRow}>
        <View style={styles.skeletonCard} />
        <View style={styles.skeletonCard} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <SkeletonLoader />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredProductos}
        renderItem={({ item }) => <ProductCard item={item} />}
        numColumns={2} 
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={filteredProductos.length === 0 ? styles.emptyList : styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.PRIMARY]}
            tintColor={COLORS.PRIMARY}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BACKGROUND,
    paddingTop: Platform.OS === 'android' ? 25 : 0,
  },
  // ... (Estilos de header, search, category sin cambios estructurales)
  header: {
    backgroundColor: '#fff',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
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
  categoryContainer: {
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  categoryScrollView: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 10,
  },
  categoryChipActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  categoryChipText: {
    color: '#333',
    fontWeight: '600',
    fontSize: 14,
  },
  categoryChipTextActive: {
    color: '#fff',
  },
  list: {
    paddingHorizontal: 0,
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
    color: COLORS.INACTIVE,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  // --- ESTILOS DE LA TARJETA DE PRODUCTO (SIMPLIFICADOS) ---
  cardWrapper: {
    width: '50%',
    padding: 8,
  },
  productCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.BORDER,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#f0f0f0',
    // Borde superior redondeado para seguir el diseño de la tarjeta
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10,
  },
  productImage: {
    width: '100%',
    height: '100%',
    // Borde superior redondeado para seguir el diseño de la tarjeta
    borderTopLeftRadius: 10, 
    borderTopRightRadius: 10,
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  // Botón de corazón/favorito en la imagen
  wishlistButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: 10,
    flexGrow: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8, // Más espacio debajo del nombre
    minHeight: 36, 
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between', // Separa el precio de la calificación
    alignItems: 'center',
    marginTop: 4, 
  },
  currentPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.INACTIVE,
    marginLeft: 2,
  },
  // Eliminados los estilos buttonRow, wishlistBtn, orderBtn
  // --- NUEVOS ESTILOS BOTÓN ---
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(157, 4, 109, 0.1)', // Fondo claro del color primario
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  favoritesButtonActive: {
    backgroundColor: COLORS.PRIMARY, // Fondo sólido al estar activo
  },
  favoritesButtonText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  favoritesButtonTextActive: {
    color: '#fff', // Texto en blanco
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Estilos de esqueleto
  skeletonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  skeletonCard: {
    width: '48%',
    height: 250,
    backgroundColor: '#e0e0e0',
    borderRadius: 10,
  },
});

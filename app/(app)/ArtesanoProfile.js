import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { artesanoService } from '../../src/services/artesanoService';
const { width, height } = Dimensions.get('window');
const imageSize = (width - 10) / 3; // Para grid de 3 columnas

export default function ArtesanoProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  
  const [artesano, setArtesano] = useState(null);
  const [publicaciones, setPublicaciones] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('publicaciones'); // 'publicaciones' o 'productos'

  useEffect(() => {
    if (userId) {
      loadArtesanoCompleto();
    }
  }, [userId]);

  const loadArtesanoCompleto = async () => {
    try {
      setLoading(true);
      const data = await artesanoService.getArtesanoCompleto(userId);
      setArtesano(data.artesano);
      setPublicaciones(data.publicaciones);
      setProductos(data.productos);
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      Alert.alert('Error', 'No se pudo cargar el perfil del artesano');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const navigateToDetail = (item, type) => {
    router.push({
      pathname: './PostDetail',
      params: { itemId: item.id, itemType: type }
    });
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#9D046D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil</Text>
        <View style={styles.placeholder} />
      </View>
    </View>
  );

  const renderProfileInfo = () => (
    <View style={styles.profileSection}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          {artesano?.avatar_url ? (
            <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialCommunityIcons name="account" size={60} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{publicaciones.length}</Text>
            <Text style={styles.statLabel}>Publicaciones</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{productos.length}</Text>
            <Text style={styles.statLabel}>Productos</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{artesano?.total_likes || 0}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
        </View>
      </View>

      <View style={styles.profileInfo}>
        <Text style={styles.nombre}>{artesano?.nombre || 'No definido'}</Text>
        <Text style={styles.folio}>Folio: {artesano?.folio || 'No definido'}</Text>
        
        {artesano?.ubicacion && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.ubicacion}</Text>
          </View>
        )}
        
        {artesano?.categoria && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tag" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.categoria}</Text>
          </View>
        )}
        
        {artesano?.telefono && (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="phone" size={16} color="#666" />
            <Text style={styles.infoText}>{artesano.telefono}</Text>
          </View>
        )}

        {artesano?.descripcion && (
          <Text style={styles.descripcion}>{artesano.descripcion}</Text>
        )}
      </View>
    </View>
  );

  const renderTabs = () => (
    <View style={styles.tabsContainer}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'publicaciones' && styles.activeTab]}
        onPress={() => setActiveTab('publicaciones')}
      >
        <MaterialCommunityIcons 
          name="image-multiple" 
          size={20} 
          color={activeTab === 'publicaciones' ? '#9D046D' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'publicaciones' && styles.activeTabText]}>
          Publicaciones
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[styles.tab, activeTab === 'productos' && styles.activeTab]}
        onPress={() => setActiveTab('productos')}
      >
        <MaterialCommunityIcons 
          name="package-variant" 
          size={20} 
          color={activeTab === 'productos' ? '#9D046D' : '#666'} 
        />
        <Text style={[styles.tabText, activeTab === 'productos' && styles.activeTabText]}>
          Productos
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPublicacion = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.gridItem} 
      onPress={() => item.imagen_url && navigateToDetail(item, 'publicaciones')}
      disabled={!item.imagen_url || loading}
    >
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="image" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="heart" size={16} color="#fff" />
          <Text style={styles.overlayText}>{item.likes_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderProducto = ({ item, index }) => (
    <TouchableOpacity 
      style={styles.gridItem} 
      onPress={() => item.imagen_url && navigateToDetail(item, 'productos')}
      disabled={!item.imagen_url || loading}
    >
      {item.imagen_url ? (
        <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
      ) : (
        <View style={styles.placeholderImage}>
          <MaterialCommunityIcons name="package" size={30} color="#ccc" />
        </View>
      )}
      <View style={styles.overlay}>
        <View style={styles.overlayContent}>
          <MaterialCommunityIcons name="currency-usd" size={16} color="#fff" />
          <Text style={styles.overlayText}>{item.precio ? `$${item.precio}` : 'N/A'}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (activeTab === 'publicaciones') {
      return (
        <FlatList
          data={publicaciones}
          renderItem={renderPublicacion}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="image-multiple-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay publicaciones</Text>
            </View>
          )}
        />
      );
    } else {
      return (
        <FlatList
          data={productos}
          renderItem={renderProducto}
          keyExtractor={(item) => item.id.toString()}
          numColumns={3}
          contentContainerStyle={styles.gridContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="package-variant-outline" size={60} color="#ccc" />
              <Text style={styles.emptyText}>No hay productos</Text>
            </View>
          )}
        />
      );
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9D046D" />
          <Text style={styles.loadingText}>Cargando perfil...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!artesano) {
    return (
      <SafeAreaView style={styles.container}>
        {renderHeader()}
        <View style={styles.errorContainer}>
          <MaterialCommunityIcons name="alert-circle" size={60} color="#ccc" />
          <Text style={styles.errorText}>No se pudo cargar el perfil</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {renderHeader()}
      <View style={styles.contentContainer}>
        {renderProfileInfo()}
        {renderTabs()}
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  contentContainer: {
    flex: 1,
  },
  profileSection: {
    padding: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginRight: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  profileInfo: {
    marginTop: 10,
  },
  nombre: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  folio: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  descripcion: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginTop: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#9D046D',
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  activeTabText: {
    color: '#9D046D',
    fontWeight: 'bold',
  },
  gridContainer: {
    padding: 2,
  },
  gridItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderTopLeftRadius: 8,
  },
  overlayContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  overlayText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
});

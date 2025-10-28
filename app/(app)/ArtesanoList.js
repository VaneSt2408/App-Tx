import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  ActivityIndicator, 
  Alert,
  TouchableOpacity,
  SafeAreaView,
  TextInput
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { artesanoService } from '../../src/services/artesanoService';
import { useRouter } from 'expo-router';

export default function ArtesanoList() {
  const router = useRouter();
  const [artesanos, setArtesanos] = useState([]);
  const [filteredArtesanos, setFilteredArtesanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadArtesanos();
  }, []);

  // Efecto con debounce para filtrar artesanos cuando cambia la búsqueda
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      filterArtesanos();
    }, 300); // Debounce de 300ms

    return () => clearTimeout(timeoutId);
  }, [searchQuery, artesanos]);

  const loadArtesanos = async () => {
    try {
      setLoading(true);
      const data = await artesanoService.getArtesanos();
      setArtesanos(data);
      setError(null);
    } catch (err) {
      console.error('Error al cargar artesanos:', err);
      setError('Error al cargar la lista de artesanos');
      Alert.alert('Error', 'No se pudo cargar la lista de artesanos');
    } finally {
      setLoading(false);
    }
  };

  // Función optimizada para filtrar artesanos por búsqueda
  const filterArtesanos = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredArtesanos(artesanos);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = artesanos.filter(artesano => {
      const nombre = (artesano.nombre || '').toLowerCase();
      const folio = (artesano.folio || '').toLowerCase();
      const categoria = (artesano.categoria || '').toLowerCase();
      const ubicacion = (artesano.ubicacion || '').toLowerCase();

      return nombre.includes(query) ||
             folio.includes(query) ||
             categoria.includes(query) ||
             ubicacion.includes(query);
    });

    setFilteredArtesanos(filtered);
  }, [searchQuery, artesanos]);

  // Función para limpiar la búsqueda
  const clearSearch = () => {
    setSearchQuery('');
  };

  // Función para navegar al perfil del artesano
  const navigateToProfile = (userId) => {
    router.push({
      pathname: '/ArtesanoProfile',
      params: { userId: userId.toString() }
    });
  };

  const renderArtesano = ({ item }) => (
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigateToProfile(item.user_id)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {item.avatar_url ? (
            <Image 
              source={{ uri: item.avatar_url }} 
              style={styles.avatar}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <MaterialCommunityIcons 
                name="account" 
                size={40} 
                color="#666" 
              />
            </View>
          )}
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.nombre}>
            {item.nombre || 'No definido'}
          </Text>
          <Text style={styles.folio}>
            Folio: {item.folio || 'No definido'}
          </Text>
          {item.ubicacion && (
            <Text style={styles.ubicacion}>
              📍 {item.ubicacion}
            </Text>
          )}
          {item.categoria && (
            <Text style={styles.categoria}>
              🏷️ {item.categoria}
            </Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.arrowButton}
          onPress={() => navigateToProfile(item.user_id)}
        >
          <MaterialCommunityIcons name="chevron-right" size={24} color="#177eaaff" />
        </TouchableOpacity>
      </View>
      
      {item.descripcion && (
        <View style={styles.descripcionContainer}>
          <Text style={styles.descripcion}>
            {item.descripcion}
          </Text>
        </View>
      )}
      
      <View style={styles.footer}>
        <Text style={styles.fecha}>
          Registrado: {new Date(item.created_at || item.fecha_creacion_cuenta).toLocaleDateString('es-ES')}
        </Text>
        <Text style={styles.tapHint}>
          Toca para ver perfil completo →
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => {
    const isSearching = searchQuery.trim().length > 0;
    
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons 
          name={isSearching ? "magnify" : "account-group"} 
          size={80} 
          color="#ccc" 
        />
        <Text style={styles.emptyText}>
          {isSearching 
            ? `No se encontraron artesanos para "${searchQuery}"`
            : 'No hay artesanos registrados'
          }
        </Text>
        {isSearching ? (
          <TouchableOpacity style={styles.refreshButton} onPress={clearSearch}>
            <Text style={styles.refreshButtonText}>Limpiar búsqueda</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.refreshButton} onPress={loadArtesanos}>
            <Text style={styles.refreshButtonText}>Actualizar</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#177eaaff" />
          <Text style={styles.loadingText}>Cargando artesanos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Lista de Artesanos</Text>
        <TouchableOpacity onPress={loadArtesanos} style={styles.refreshIcon}>
          <MaterialCommunityIcons name="refresh" size={24} color="#177eaaff" />
        </TouchableOpacity>
      </View>
      
      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons 
            name="magnify" 
            size={20} 
            color="#666" 
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre, folio, categoría o ubicación..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <MaterialCommunityIcons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <FlatList
        data={filteredArtesanos}
        renderItem={renderArtesano}
        keyExtractor={(item) => item.user_id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyState}
        refreshing={loading}
        onRefresh={loadArtesanos}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  refreshIcon: {
    padding: 8,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    marginLeft: 10,
    padding: 2,
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
  listContainer: {
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'flex-start',
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  defaultAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  arrowButton: {
    padding: 8,
    marginLeft: 8,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  folio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  ubicacion: {
    fontSize: 12,
    color: '#888',
    marginBottom: 2,
  },
  categoria: {
    fontSize: 12,
    color: '#888',
  },
  descripcionContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  descripcion: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fecha: {
    fontSize: 12,
    color: '#999',
  },
  tapHint: {
    fontSize: 12,
    color: '#177eaaff',
    fontStyle: 'italic',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    marginBottom: 20,
  },
  refreshButton: {
    backgroundColor: '#177eaaff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
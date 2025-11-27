// En: app/(app)/ArtesanoList.js -> Archivo de la lista de artesanos (Frontend)
// Este archivo es el encargado de mostrar la lista de artesanos en la aplicación.
// Muestra la lista de artesanos registrados en la base de datos y permite buscarlos por nombre, folio, categoría o ubicación.
// También permite navegar al perfil del artesano y ver su información completa.


// Importaciones
// En: app/(app)/ArtesanoList.js -> Archivo de la lista de artesanos (Frontend)
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text as DefaultText, StyleSheet, FlatList, Image, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView, TextInput, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { artesanoService } from '../../src/services/artesanoService';
import { useRouter } from 'expo-router';
import useCustomFonts from '../../hooks/useFonts';


export default function ArtesanoList() {
  const router = useRouter();
  const [artesanos, setArtesanos] = useState([]);
  const [filteredArtesanos, setFilteredArtesanos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const Text = (props) => (
      <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

  const loadArtesanos = async () => {
    try {
      setLoading(true);
      const data = await artesanoService.getArtesanos();
      setArtesanos(data || []);
      setError(null);
    } catch (err) {
      setError('Error al cargar la lista de artesanos');
      Alert.alert('Error', 'No se pudo cargar la lista de artesanos');
    } finally {
      setLoading(false);
    }
  };

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
      return (
        nombre.includes(query) ||
        folio.includes(query) ||
        categoria.includes(query) ||
        ubicacion.includes(query)
      );
    });

    setFilteredArtesanos(filtered);
  }, [searchQuery, artesanos]);

  useEffect(() => {
    loadArtesanos();
  }, []);

  useEffect(() => {
    filterArtesanos();
  }, [filterArtesanos]);

  const clearSearch = () => {
    setSearchQuery('');
  };

  const navigateToProfile = (userId) => {
    router.push({
      pathname: '/ArtesanoProfileVistaVisitante', // Cambiar a la ruta correcta
      //pathname: '/ArtesanoProfile', // Cambiar a la ruta correcta
      params: { userId: userId.toString() }
    });
  };

  const renderArtesano = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigateToProfile(item.user_id)}
      activeOpacity={0.8}
    >
      
      <View style={styles.cardHeader}>
        {item.avatar_url ? (
          <Image
            source={{ uri: item.avatar_url }}
            style={styles.avatar}
          />
        ) : (
          <View style={styles.defaultAvatar}>
            <MaterialCommunityIcons
              name="account"
              size={30}
              color="#fff"
            />
          </View>
        )}
        <View style={styles.infoContainer}>
          <Text style={styles.nombre}>
            {item.nombre ? String(item.nombre) : 'No definido'}
          </Text>
          <Text style={styles.folio}>
            Folio: {item.folio ? String(item.folio) : 'No definido'}
          </Text>
        </View>
        <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
      </View>

      {/* Cuerpo Blanco */}
      <View style={styles.cardBody}>
        {item.ubicacion ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-outline" size={20} color="#555" style={styles.infoIcon} />
            <Text style={styles.infoText}>{String(item.ubicacion)}</Text>
          </View>
        ) : null}

        {item.categoria ? (
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="tag-outline" size={20} color="#555" style={styles.infoIcon} />
            <Text style={styles.infoText}>{String(item.categoria)}</Text>
          </View>
        ) : null}

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={20} color="#555" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Registro:{' '}
            {item.created_at || item.fecha_creacion_cuenta
              ? new Date(item.created_at || item.fecha_creacion_cuenta).toLocaleDateString('es-ES')
              : 'No disponible'}
          </Text>
        </View>
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
            ? `No se encontraron artesanos para "${searchQuery || ''}"`
            : 'No hay artesanos registrados'}
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
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#9D046D" />
          <Text style={styles.loadingText}>Cargando artesanos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Encabezado con Título y Flecha */}
      <View style={[styles.headerContainer, { justifyContent: 'flex-start' }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        </TouchableOpacity>
        <Text style={[styles.title,{fontFamily: 'Alan Sans'},{fontWeight: 'bold'},{color: '#9D046D'},{fontSize: 25}]}>Lista de Artesanos</Text>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchInputContainer}>
          <MaterialCommunityIcons
            name="magnify"
            size={25}
            color="#000"
            style={styles.searchIcon}
          />
          <TextInput
            fontFamily='Alan Sans'
            style={styles.searchInput}
            placeholder="Buscar por nombre, folio..."
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

      {/* Lista */}
      <FlatList
        data={filteredArtesanos}
        renderItem={renderArtesano}
        keyExtractor={(item) => String(item.user_id)}
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
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#fff',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 17,
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
    backgroundColor: '#f0f2f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#9D046D',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginRight: 12,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContainer: {
    flex: 1,
  },
  nombre: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  folio: {
    fontSize: 14,
    color: '#F0F0F0',
  },
  cardBody: {
    padding: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoIcon: {
    marginRight: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    flex: 1,
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
    textAlign: 'center',
  },
  refreshButton: {
    backgroundColor: '#9D046D',
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

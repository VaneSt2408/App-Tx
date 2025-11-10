import React, { useEffect, useState } from 'react';
import { View, Text as DefaultText, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { estadisticasService } from '../../src/services/estadisticasService';
import useCustomFonts from '../../hooks/useFonts';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';


//Componente de texto alan sans
const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
);

// Componente principal
export default function EstadisticasPage() {
  const [artesanosByLikes, setArtesanosByLikes] = useState([]);
  const [artesanosByProduct, setArtesanosByProduct] = useState([]);
  const [artesanosByAntiguedad, setArtesanosByAntiguedad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [view, setView] = useState('likes'); // 'likes' | 'products' | 'antiguedad'
  const router = useRouter();

  // Efecto para cargar las estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const likesData = await estadisticasService.getArtesanosByLikes();
        const productsData = await estadisticasService.getProductsCountByArtesano();
        const antiguedadData = await estadisticasService.getArtesanosByAntiguedad();
        setArtesanosByLikes(likesData || []);
        setArtesanosByProduct(productsData || []);
        setArtesanosByAntiguedad(antiguedadData || []);
        setError(null);
      } catch (e) {
        setError('Error al cargar las estadísticas');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Función para navegar al perfil del artesano
  const handlePressArtesano = (userId) => {
    router.push({ pathname: "/(app)/ArtesanoProfileVistaVisitante", params: { userId } }); //Cambiar a la ruta correcta
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return 'Sin fecha';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return 'Sin fecha';
    }
  };

  // Función para renderizar cada artesano en la lista
  const renderItem = ({ item, index }) => (
    <TouchableOpacity onPress={() => handlePressArtesano(item.user_id)} style={styles.itemContainer}>
      <Text style={styles.rank}>{index + 1}</Text>
      {item.avatar_url ? (
        <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <MaterialCommunityIcons name="account" size={30} color="#666" />
        </View>
      )}
      <View style={styles.infoContainer}>
        <Text style={styles.name}>{item.nombre}</Text>
        {view === 'likes' && (
          <Text style={styles.stat}>Likes: {item.total_likes}</Text>
        )}
        {view === 'products' && (
          <Text style={styles.stat}>Productos: {item.total_productos}</Text>
        )}
        {view === 'antiguedad' && (
          <Text style={styles.stat}>Registrado: {formatDate(item.created_at)}</Text>
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Clasificación de Artesanos</Text>
      <View style={styles.toggleContainer}>
        <TouchableOpacity 
          style={[styles.toggleButton, view === 'likes' && styles.activeButton]} 
          onPress={() => setView('likes')}>
          <Text style={[styles.toggleButtonText, view === 'likes' && styles.activeButtonText]}>Por Likes</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, view === 'products' && styles.activeButton]} 
          onPress={() => setView('products')}>
          <Text style={[styles.toggleButtonText, view === 'products' && styles.activeButtonText]}>Por Productos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.toggleButton, view === 'antiguedad' && styles.activeButton]} 
          onPress={() => setView('antiguedad')}>
          <Text style={[styles.toggleButtonText, view === 'antiguedad' && styles.activeButtonText]}>Por Antigüedad</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={
          view === 'likes' ? artesanosByLikes :
          view === 'products' ? artesanosByProduct :
          artesanosByAntiguedad
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  toggleButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#ddd',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeButton: {
    backgroundColor: '#007bff',
  },
  toggleButtonText: {
    color: '#333',
    fontWeight: 'bold',
  },
  activeButtonText: {
    color: '#fff',
  },
  listContainer: {
    paddingBottom: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rank: {
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
    width: 30,
    textAlign: 'center',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    backgroundColor: '#ccc',
  },
  infoContainer: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  stat: {
    fontSize: 14,
    color: '#888',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
});

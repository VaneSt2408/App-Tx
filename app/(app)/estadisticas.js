import React, { useEffect, useState } from 'react';
import { View, Text as DefaultText, FlatList, StyleSheet, ActivityIndicator, Image, TouchableOpacity, SafeAreaView } from 'react-native';
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
  const [view, setView] = useState('likes'); // Vista por defecto: 'likes'
  const router = useRouter();

  // Efecto para cargar las estadísticas
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Añadimos un .slice(0, 3) para mostrar solo el Top 3 como en la imagen
        const likesData = await estadisticasService.getArtesanosByLikes();
        const productsData = await estadisticasService.getProductsCountByArtesano();
        const antiguedadData = await estadisticasService.getArtesanosByAntiguedad();
        
        setArtesanosByLikes((likesData || []).slice(0, 3));
        setArtesanosByProduct((productsData || []).slice(0, 3));
        setArtesanosByAntiguedad((antiguedadData || []).slice(0, 3));
        
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
    router.push({ pathname: "/(app)/ArtesanoProfile", params: { userId } });
  };

  // Función para formatear la fecha (corta, como en la imagen)
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const d = new Date(dateString);
      // Formato DD/MM/AAAA
      return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  };
  
  // Devuelve el ícono y el valor correspondiente a la vista actual
  const getStatInfo = (item) => {
    switch(view) {
      case 'likes':
        return { icon: 'heart', value: item.total_likes };
      case 'products':
        return { icon: 'cart-outline', value: item.total_productos }; // Asumiendo 'cart' para productos
      case 'antiguedad':
        return { icon: 'calendar-clock', value: formatDate(item.created_at) }; // Asumiendo 'calendar' para antigüedad
      default:
        return { icon: 'heart', value: item.total_likes };
    }
  };

  // Función para renderizar cada artesano en la lista
  const renderItem = ({ item, index }) => {
    const statInfo = getStatInfo(item);
    
    return (
      <TouchableOpacity 
        onPress={() => handlePressArtesano(item.user_id)} 
        style={styles.itemContainer}
      >
        {/* Píldora de Ranking (ej. #1) */}
        <View style={styles.rankPill}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        {/* Avatar */}
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account" size={60} color="#999" />
          </View>
        )}
        
        {/* Nombre */}
        <Text style={styles.name}>{item.nombre}</Text>
        
        {/* Contenedor de Estadística (Número e Ícono) */}
        <View style={styles.statContainer}>
          <MaterialCommunityIcons 
            name={statInfo.icon} 
            size={22} 
            color="#9D046D" // Icono magenta
            style={styles.statIcon} 
          />
          <Text style={styles.statValue}>{statInfo.value}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#9D046D" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Encabezado */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Clasificación</Text>
        <View style={{ width: 40 }} /> {/* Espaciador */}
      </View>

      {/* Botones de Filtro (Nuevo estilo minimalista) */}
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
      
      {/* Lista */}
      <FlatList
        data={
          view === 'likes' ? artesanosByLikes :
          view === 'products' ? artesanosByProduct :
          artesanosByAntiguedad
        }
        renderItem={renderItem}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// --- ESTILOS COMPLETAMENTE NUEVOS (basados en image_36dadd.png) ---
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Fondo gris claro
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
  },
  errorText: {
    fontSize: 16,
    color: 'red',
  },
  
  // --- Estilos de los botones de filtro ---
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 14, // Reducido de 16
    paddingHorizontal: 16,
  },
  toggleButton: {
    paddingVertical: 8, // Reducido de 10
    paddingHorizontal: 16, // Reducido de 18
    borderRadius: 16, // Reducido de 20
    marginHorizontal: 6, // Reducido de 8
    backgroundColor: '#FFFFFF', // CAMBIO: de 'transparent' a blanco (fondo inactivo)
    // Sombra para todos los botones
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: {
    backgroundColor: '#9D046D', // CAMBIO: de '#FFFFFF' a magenta (fondo activo)
    // Las propiedades de sombra se movieron a 'toggleButton'
  },
  toggleButtonText: {
    color: '#6E6E73', // Texto inactivo gris
    fontWeight: '600',
    fontSize: 13, // Reducido de 14
  },
  activeButtonText: {
    color: '#FFFFFF', // CAMBIO: de '#9D046D' a blanco (texto activo)
  },
  
  // --- Estilos de la lista y tarjetas ---
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  itemContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center', // Centrar todo el contenido
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 4,
    position: 'relative', // Necesario para la píldora de ranking
  },
  rankPill: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: '#9D046D', // Fondo magenta
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  rankText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatar: {
    width: 100, // Avatar más grande
    height: 100,
    borderRadius: 50, // Circular
    marginBottom: 16,
    borderWidth: 3,
    borderColor: '#E0E0E0',
  },
  avatarPlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 20, // Nombre más grande
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
    textAlign: 'center',
  },
  statContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F7F7', // Fondo gris muy claro para la estadística
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
    width: 'auto', // Ajustar al contenido
  },
  statIcon: {
    marginRight: 8,
  },
  statValue: {
    fontSize: 22, // Número grande
    fontWeight: 'bold',
    color: '#333',
  },
});
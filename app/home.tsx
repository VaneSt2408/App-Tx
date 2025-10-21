import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Alert, Image, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Platform, StatusBar as RNStatusBar } from 'react-native';
import * as Location from 'expo-location'; 

export default function HomeScreen() {
  const router = useRouter();

  // --- ESTADOS DEL COMPONENTE ---
  const [searchText, setSearchText] = useState('');
  const [searchError, setSearchError] = useState<string | null>(null);
  const [profileImageError, setProfileImageError] = useState(false);
  
  // Estados para datos de usuario y ubicación (ahora se cargan dinámicamente)
  const [userName, setUserName] = useState('Usuario');
  const [profileImageUri, setProfileImageUri] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState('Buscando ubicación...');

  // --- DATOS DE EJEMPLO ---

  // Datos de ejemplo para las categorías/artesanías destacadas
  // Para probar el caso sin categorías, puedes cambiarlo a: const categories = [];
  const categories = [
    { id: '1', name: 'Cerámica', image: 'https://via.placeholder.com/100x100/FFD700/FFFFFF?text=Ceramica' },
    { id: '2', name: 'Textiles', image: 'https://via.placeholder.com/100x100/8B4513/FFFFFF?text=Textiles' },
    { id: '3', name: 'Madera', image: 'https://via.placeholder.com/100x100/A0522D/FFFFFF?text=Madera' },
    { id: '4', name: 'Joyería', image: 'https://via.placeholder.com/100x100/C0C0C0/FFFFFF?text=Joyeria' },
    { id: '5', name: 'Pintura', image: 'https://via.placeholder.com/100x100/4682B4/FFFFFF?text=Pintura' },
  ];

  // --- EFECTOS PARA CARGAR DATOS ---

  useEffect(() => {
    // Se define una función asíncrona dentro de useEffect para cargar todos los datos.
    const loadData = async () => {
      // 1. Carga los datos del usuario (ahora estáticos)
      setUserName("Ana López"); // O el nombre que corresponda
      setProfileImageUri("https://via.placeholder.com/40x40/FFFFFF/000000?text=A");

      // 2. Obtiene la ubicación real del dispositivo
      const getLocation = async () => {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setCurrentLocation('Ubicación no disponible');
          return;
        }

        try {
          let location = await Location.getCurrentPositionAsync({});
          let reverseGeocode = await Location.reverseGeocodeAsync(location.coords);
          if (reverseGeocode.length > 0) {
            const { city, country } = reverseGeocode[0];
            setCurrentLocation(`${city}, ${country}`);
          }
        } catch (error) {
          console.error("Error al obtener la ubicación:", error);
          setCurrentLocation('Ubicación no disponible');
        }
      };

      await getLocation(); // Se espera a que la ubicación se resuelva
    };

    loadData(); // Se llama a la función principal que carga los datos.
  }, []); // El efecto se ejecuta solo una vez al montar el componente

  // --- FUNCIONES DE MANEJO ---
  const handleSearch = () => {
    const trimmedSearch = searchText.trim();
    const validCharRegex = /^[a-zA-Z0-9\sñáéíóúÁÉÍÓÚüÜ]+$/;

    if (trimmedSearch.length === 0) {
      setSearchError('El campo de búsqueda no puede estar vacío.');
      return;
    }
    if (trimmedSearch.length > 50) {
      setSearchError('La búsqueda no puede exceder los 50 caracteres.');
      return;
    }
    if (!validCharRegex.test(trimmedSearch)) {
      setSearchError('La búsqueda contiene caracteres no válidos.');
      return;
    }

    setSearchError(null); // Limpia errores si la validación es exitosa
    console.log(`Buscando: "${trimmedSearch}"`);
    // Aquí iría la lógica para navegar a la pantalla de resultados de búsqueda
  };

  const handleCategoryPress = (category: { id: string; name: string; }) => {
    if (category && category.id) {
      console.log(`Navegando a la categoría: ${category.name} (ID: ${category.id})`);
      // router.push(`/categories/${category.id}`);
    } else {
      Alert.alert("Error", "La categoría seleccionada no es válida.");
    }
  };

  return (
    <LinearGradient
      colors={['#020202ff', '#923febff']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Sección Superior: Foto de perfil, Ubicación, Notificaciones */}
          <View style={styles.header}>
            {/* Fallback para la imagen de perfil */}
            {profileImageUri && !profileImageError ? (
              <Image
                source={{ uri: profileImageUri }}
                style={styles.profileImage}
                onError={() => setProfileImageError(true)}
              />
            ) : (
              <View style={[styles.profileImage, styles.profileImageFallback]}>
                <Feather name="user" size={20} color="white" />
              </View>
            )}
            <View style={styles.locationContainer}>
              <Feather name="map-pin" size={16} color="white" />
              <Text style={styles.locationText}>{currentLocation}</Text>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <Feather name="bell" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Saludo al Usuario */}
          <Text style={styles.greetingText}>Hola, {userName}!</Text>

          {/* Campo de Búsqueda */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar artesanías..."
              placeholderTextColor="#ccc"
              value={searchText}
              onChangeText={(text) => {
                setSearchText(text);
                if (searchError) setSearchError(null); // Limpia el error al escribir
              }}
              onSubmitEditing={handleSearch} // Permite buscar al presionar "Enter" en el teclado
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchIcon}>
              <Feather name="search" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>
          {searchError && <Text style={styles.errorText}>{searchError}</Text>}

          {/* Tarjeta Grande de Descubrimiento */}
          <View style={styles.discoveryCard}>
            <Image
              source={{ uri: 'https://via.placeholder.com/300x150/610C69/FFFFFF?text=Piezas+Unicas' }} // Imagen ilustrativa
              style={styles.discoveryImage}
            />
            <Text style={styles.discoveryText}>Descubre piezas únicas hechas a mano</Text>
          </View>

          {/* Sección de Categorías/Artesanías Destacadas */}
          <Text style={styles.sectionTitle}>Categorías</Text>
          
          {/* Mensaje si no hay categorías */}
          {categories.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
              {categories.map((category) => (
                <TouchableOpacity key={category.id} style={styles.categoryCard} onPress={() => handleCategoryPress(category)}>
                  <Image source={{ uri: category.image }} style={styles.categoryImage} />
                  <Text style={styles.categoryText}>{category.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.noCategoriesContainer}>
              <Text style={styles.noCategoriesText}>No hay artesanías disponibles en este momento.</Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'white',
  },
  profileImageFallback: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  locationText: {
    color: 'white',
    marginLeft: 5,
    fontSize: 14,
  },
  notificationButton: {
    padding: 5,
  },
  greetingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 15,
    marginBottom: 5, // Reducido para dar espacio al texto de error
  },
  errorText: {
    color: '#f87171', // Rojo claro
    marginLeft: 15,
    marginBottom: 15,
  },
  searchIcon: {
    padding: 15,
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 15,
    paddingLeft: 15,
  },
  discoveryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 20,
    marginBottom: 30,
    overflow: 'hidden',
    alignItems: 'center',
  },
  discoveryImage: {
    width: '100%',
    height: 180,
    resizeMode: 'cover',
  },
  discoveryText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    padding: 20,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 15,
  },
  categoriesScroll: {
    marginBottom: 20,
  },
  categoryCard: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 10,
    marginRight: 15,
    alignItems: 'center',
    width: 120, // Ancho fijo para las tarjetas de categoría
  },
  categoryImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
  },
  categoryText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  noCategoriesContainer: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  noCategoriesText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
  },
});
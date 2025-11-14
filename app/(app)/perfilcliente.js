import React, { useState, useEffect, useCallback } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// 1. Importar tu hook de fuentes (ajusta la ruta si es necesario)
// Usamos el nombre de exportación default 'useCustomFonts'
import useCustomFonts from '../../hooks/useFonts'; // Asumiendo que se llama 'useFonts.js'
import { supabase } from '../../src/supabase/client';
import { getClientProfile, editClientProfile, uploadAvatar } from '../../src/services/profileInfo';
import EventsModal from '../../components/EventsModal';
import { seguidosService } from '../../src/services/seguidosService';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';

// --- Componentes de la UI ---

/**
 * Un solo item de la lista de acciones (Edit Profile, Settings, etc.)
 */
const ProfileMenuItem = ({ iconName, text, href, isLogout }) => {
  const textColor = isLogout ? 'text-red-500' : 'text-gray-800';
  const iconColor = isLogout ? '#ef4444' : '#db2777'; // Rojo para logout, Rosa para otros
  const iconBg = isLogout ? 'bg-red-100' : 'bg-pink-100';

  return (
    <TouchableOpacity className="flex-row items-center bg-white p-3 rounded-full shadow-sm">
      <View className={`p-2 rounded-full ${iconBg}`}>
        <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
      </View>
      {/* 3. Aplicar la fuente personalizada y el peso */}
      <Text
        className={`flex-1 ml-4 text-base ${textColor} font-['AlanSans-VariableFont_wght'] font-medium`}>
        {text}
      </Text>
      <MaterialCommunityIcons
        name="chevron-right"
        size={20}
        className="text-gray-400"
      />
    </TouchableOpacity>
  );
};

/**
 * Un solo avatar de artesano para la lista horizontal
 */
const ArtisanAvatar = ({ imageUri, name, userId }) => {
  const router = useRouter();
  const handlePress = () => {
    if (userId) {
      router.push({ pathname: '/ArtesanoProfileVistaVisitante', params: { userId } });
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} className="items-center w-20">
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          className="w-16 h-16 rounded-full bg-gray-200"
          resizeMode="cover"
        />
      ) : (
        <View className="w-16 h-16 rounded-full bg-gray-200 justify-center items-center">
          <MaterialCommunityIcons name="account" size={32} color="#666" />
        </View>
      )}
      <Text className="mt-2 text-sm text-center text-gray-700 font-['AlanSans-VariableFont_wght']" numberOfLines={1}>
        {name}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Una tarjeta de artesanía para la cuadrícula
 */
const CraftCard = ({ productId, imageUri, title, artisan }) => {
  const router = useRouter();
  const handlePress = () => {
    if (productId) {
      router.push({ pathname: '/ProductDetailPage', params: { productId } });
    }
  };
  
  return (
    <TouchableOpacity onPress={handlePress} className="w-40 mr-4">
      <Image
        source={{ uri: imageUri || `https://placehold.co/180x160/EAD8C0/805A3B?text=${title?.[0] || 'P'}` }}
        className="w-full h-40 rounded-xl bg-gray-200"
        resizeMode="cover"
      />
      <Text className="text-base text-gray-900 mt-2 font-['AlanSans-VariableFont_wght'] font-medium" numberOfLines={1}>
        {title}
      </Text>
      <Text className="text-sm text-gray-500 font-['AlanSans-VariableFont_wght']" numberOfLines={1}>
        de {artisan}
      </Text>
    </TouchableOpacity>
  );
};

/**
 * Una tarjeta de evento para el carrusel horizontal
 */
const EventCard = ({ event, onPress }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Próximamente';
    return new Date(dateString).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity onPress={() => onPress(event)} className="w-40 mr-4">
      <Image
        source={{ uri: event.imagen_url || `https://placehold.co/180x160/EAD8C0/805A3B?text=${event.nombre?.[0] || 'E'}` }}
        className="w-full h-40 rounded-xl bg-gray-200"
        resizeMode="cover"
      />
      <Text className="text-base text-gray-900 mt-2 font-['AlanSans-VariableFont_wght'] font-medium" numberOfLines={1}>
        {event.nombre}
      </Text>
      <Text className="text-sm text-gray-500 font-['AlanSans-VariableFont_wght']" numberOfLines={1}>
        {formatDate(event.fecha)}
      </Text>
    </TouchableOpacity>
  );
};

// --- Pantalla Principal ---

export default function PerfilClienteScreen() {
  // 2. Usar el hook para cargar las fuentes
  const fontsLoaded = useCustomFonts();
  const { session } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followedArtisans, setFollowedArtisans] = useState([]);
  const [savedProducts, setSavedProducts] = useState([]);
  const [savedEvents, setSavedEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // Estados para la edición
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editData, setEditData] = useState({
    nombre_completo: '',
    telefono: '',
    avatar_url: null,
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchSavedProducts = async (clienteId) => {
    if (!clienteId) return;
    const result = await seguidosService.getSavedProducts(clienteId);
    if (result.success) {
      setSavedProducts(result.data);
    } else {
      console.error("Error al cargar productos guardados:", result.error);
    }
  };

  const fetchSavedEvents = async (clienteId) => {
    if (!clienteId) return;
    const result = await seguidosService.getSavedEvents(clienteId);
    if (result.success) {
      setSavedEvents(result.data);
    } else {
      console.error("Error al cargar eventos guardados:", result.error);
    }
  };

  const fetchFollowedArtisans = async (clienteId) => {
    if (!clienteId) return;
    const result = await seguidosService.getFollowedArtisans(clienteId);
    if (result.success) {
      setFollowedArtisans(result.data);
    } else {
      console.error("Error al cargar artesanos seguidos:", result.error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        setLoading(false);
        return;
      }

      const { data, error } = await getClientProfile(user.id);
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil: ' + error);
        setLoading(false);
        return;
      }

      // Combinamos los datos del perfil con el email de la sesión
      setProfile({ ...data, email: user.email });

      // Una vez que tenemos el perfil, cargamos los artesanos seguidos
      fetchFollowedArtisans(user.id);

      // Y también los productos guardados
      fetchSavedProducts(user.id);

      // Y finalmente, los eventos guardados
      fetchSavedEvents(user.id);

    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile().finally(() => setRefreshing(false));
  }, []);

  // --- Lógica de Edición ---
  const handleOpenEditModal = () => {
    if (profile) {
      setEditData({
        nombre_completo: profile.nombre_completo || '',
        telefono: profile.telefono || '',
        avatar_url: profile.avatar_url || null,
      });
      setSelectedImage(null);
      setIsEditModalVisible(true);
    }
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
  };

  const handleSelectImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permisos requeridos', 'Se necesita acceso a tu galería para cambiar la foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0]);
      setEditData(prev => ({ ...prev, avatar_url: result.assets[0].uri }));
    }
  };

  const handleSaveChanges = async () => {
    if (!editData.nombre_completo.trim()) {
      Alert.alert('Error', 'El nombre completo es requerido.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No se encontró la sesión del usuario.');

      let newAvatarUrl = editData.avatar_url;
      if (selectedImage) {
        const uploadResult = await uploadAvatar(user.id, selectedImage);
        if (uploadResult.error) throw new Error(uploadResult.error);
        newAvatarUrl = uploadResult.data;
      }

      const updates = {
        nombre_completo: editData.nombre_completo,
        telefono: editData.telefono,
        avatar_url: newAvatarUrl,
      };

      const { error } = await editClientProfile(user.id, updates);
      if (error) throw new Error(error);

      Alert.alert('Éxito', 'Perfil actualizado correctamente.');
      handleCloseEditModal();
      onRefresh(); // Refrescar los datos del perfil
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el perfil.');
    } finally {
      setSaving(false);
    }
  };

  // Muestra un estado de carga mientras las fuentes o el perfil no estén listos
  if (!fontsLoaded || loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#db2777" />
        <Text className="mt-2 text-gray-600">Cargando perfil...</Text>
      </SafeAreaView>
    );
  }
  // Mostrar un estado de carga mientras las fuentes no estén listas
  if (!fontsLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        {/* Puedes poner un ActivityIndicator aquí */}
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center p-4">
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="rgb(156 163 175)" />
        <Text className="text-lg text-center text-gray-600 mt-4">No se pudo cargar la información del perfil.</Text>
        <TouchableOpacity onPress={fetchProfile} className="mt-6 bg-pink-600 px-6 py-2 rounded-full">
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }
  // --- Render de la pantalla principal cuando las fuentes están cargadas ---
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#db2777']}
          />
        }>
        {/* Header */}
        <View className="flex-row justify-between items-center pt-4 pb-2">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl text-center text-gray-900 font-['AlanSans-VariableFont_wght'] font-bold">
              Mi Perfil
            </Text>
          </View>
          <TouchableOpacity onPress={handleOpenEditModal} className="p-2">
            <MaterialCommunityIcons name="pencil-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* Info de Perfil */}
        <View className="items-center mt-6">
          <Image
            source={
              profile.avatar_url
                ? { uri: profile.avatar_url }
                : {
                    uri: `https://placehold.co/100x100/EAD8C0/805A3B?text=${profile.nombre_completo?.[0] || 'U'}&font=inter`,
                  }
            }
            className="w-24 h-24 rounded-full"
          />
          <Text className="text-2xl text-gray-900 mt-4 font-['AlanSans-VariableFont_wght'] font-bold">
            {profile.nombre_completo || 'Usuario'}
          </Text>
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-base text-gray-500 mt-1 font-['AlanSans-VariableFont_wght']">
            {profile.email}
          </Text>
        </View>

        {/* Menú de Acciones */}
        {/*<View className="mt-8 space-y-3">
          <ProfileMenuItem iconName="account-outline" text="Edit Profile" />
          <ProfileMenuItem iconName="cog-outline" text="Settings" />
          <ProfileMenuItem iconName="help-circle-outline" text="Help & Support" />
          <ProfileMenuItem iconName="logout" text="Logout" isLogout />
        </View>*/}

        {/* Artesanos Favoritos */}
        <View className="mt-8">
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-lg text-gray-900 mb-4 font-['AlanSans-VariableFont_wght'] font-bold">
            Artesanos seguidos
          </Text>
          {followedArtisans.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row space-x-4">
                {followedArtisans.map((artisan) => (
                  <ArtisanAvatar
                    key={artisan.user_id}
                    userId={artisan.user_id}
                    imageUri={artisan.avatar_url}
                    name={artisan.nombre}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text className="text-gray-500 text-center py-4">No sigues a ningún artesano</Text>
          )}
        </View>

        {/* Artesanías Recientes */}
        <View className="mt-8">
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-lg text-gray-900 mb-4 font-['AlanSans-VariableFont_wght'] font-bold">
            Productos guardados
          </Text>
          {savedProducts.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {savedProducts.map((product) => (
                  <CraftCard
                    key={product.id}
                    productId={product.id}
                    imageUri={product.imagen_url}
                    title={product.nombre}
                    artisan={product.artesano?.nombre || 'Artesano Desconocido'}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text className="text-gray-500 text-center py-4">No tienes productos guardados</Text>
          )}
        </View>

        {/* Eventos Guardados */}
        <View className="mt-8">
          <Text className="text-lg text-gray-900 mb-4 font-['AlanSans-VariableFont_wght'] font-bold">
            Eventos guardados
          </Text>
          {savedEvents.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View className="flex-row">
                {savedEvents.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onPress={(e) => {
                      setSelectedEvent(e);
                      setIsModalVisible(true);
                    }}
                  />
                ))}
              </View>
            </ScrollView>
          ) : (
            <Text className="text-gray-500 text-center py-4">No tienes eventos guardados</Text>
          )}
        </View>
      </ScrollView>

      {/* Modal para detalles del evento */}
      <EventsModal 
        visible={isModalVisible} 
        event={selectedEvent} 
        onClose={() => setIsModalVisible(false)}
        // Al cerrar el modal, volvemos a cargar los eventos para reflejar los cambios
        onDataChange={() => fetchSavedEvents(session?.user?.id)}
      />

      {/* Modal para editar perfil */}
      <Modal
        visible={isEditModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseEditModal}
      >
        {(() => {
          const hasNameChanged = editData.nombre_completo !== (profile?.nombre_completo || '');
          const hasPhoneChanged = editData.telefono !== (profile?.telefono || '');
          const hasImageChanged = selectedImage !== null;
          const hasChanges = hasNameChanged || hasPhoneChanged || hasImageChanged;
          const isSaveDisabled = saving || !hasChanges;

          return (
            <View className="flex-1 justify-center items-center bg-black/50">
              <View className="w-11/12 bg-white rounded-2xl p-5">
                <Text className="text-xl font-bold mb-5">Editar Perfil</Text>
                
                <ScrollView>
                  {/* Avatar */}
                  <View className="items-center mb-4">
                    <TouchableOpacity onPress={handleSelectImage}>
                      <Image
                        source={{ uri: editData.avatar_url || `https://placehold.co/100x100/EAD8C0/805A3B?text=${editData.nombre_completo?.[0] || 'U'}` }}
                        className="w-24 h-24 rounded-full bg-gray-200"
                      />
                      <View className="absolute bottom-0 right-0 bg-pink-600 p-1.5 rounded-full border-2 border-white">
                        <MaterialCommunityIcons name="camera-plus-outline" size={16} color="white" />
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Nombre */}
                  <Text className="text-sm font-medium text-gray-600 mb-1">Nombre Completo</Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg mb-4"
                    value={editData.nombre_completo}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, nombre_completo: text }))}
                  />

                  {/* Teléfono */}
                  <Text className="text-sm font-medium text-gray-600 mb-1">Teléfono</Text>
                  <TextInput
                    className="bg-gray-100 p-3 rounded-lg mb-4"
                    value={editData.telefono}
                    onChangeText={(text) => setEditData(prev => ({ ...prev, telefono: text }))}
                    keyboardType="phone-pad"
                  />
                </ScrollView>

                {/* Botones */}
                <View className="flex-row justify-end mt-5 space-x-3">
                  <TouchableOpacity
                    onPress={handleCloseEditModal}
                    className="px-5 py-2.5 bg-gray-200 rounded-lg"
                  >
                    <Text className="font-bold text-gray-700">Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveChanges}
                    disabled={isSaveDisabled}
                    className={`px-5 py-2.5 bg-pink-600 rounded-lg ${isSaveDisabled ? 'opacity-50' : ''}`}
                  >
                    {saving ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text className="font-bold text-white">Guardar</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })()}
      </Modal>
    </SafeAreaView>
  );
}
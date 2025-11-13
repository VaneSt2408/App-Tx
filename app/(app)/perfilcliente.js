import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Image,
  TouchableOpacity,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
// 1. Importar tu hook de fuentes (ajusta la ruta si es necesario)
// Usamos el nombre de exportación default 'useCustomFonts'
import useCustomFonts from '../../hooks/useFonts'; // Asumiendo que se llama 'useFonts.js'

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
const ArtisanAvatar = ({ imageUri, name }) => (
  <View className="items-center w-20">
    <Image
      source={{ uri: imageUri }}
      className="w-16 h-16 rounded-full"
      resizeMode="cover"
    />
    {/* 3. Aplicar la fuente personalizada y el peso */}
    <Text
      className="mt-2 text-sm text-center text-gray-700 font-['AlanSans-VariableFont_wght']"
      numberOfLines={1}>
      {name}
    </Text>
  </View>
);

/**
 * Una tarjeta de artesanía para la cuadrícula
 */
const CraftCard = ({ imageUri, title, artisan }) => (
  <View className="w-[48%] mb-4">
    <Image
      source={{ uri: imageUri }}
      className="w-full h-40 rounded-lg bg-gray-200"
      resizeMode="cover"
    />
    {/* 3. Aplicar la fuente personalizada y el peso */}
    <Text className="text-base text-gray-900 mt-2 font-['AlanSans-VariableFont_wght'] font-medium">
      {title}
    </Text>
    <Text className="text-sm text-gray-500 font-['AlanSans-VariableFont_wght']">
      by {artisan}
    </Text>
  </View>
);

// --- Pantalla Principal ---

export default function ProfileScreen() {
  // 2. Usar el hook para cargar las fuentes
  const fontsLoaded = useCustomFonts();

  // Mostrar un estado de carga mientras las fuentes no estén listas
  if (!fontsLoaded) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        {/* Puedes poner un ActivityIndicator aquí */}
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  // --- Render de la pantalla principal cuando las fuentes están cargadas ---
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}>
        {/* Header */}
        <View className="flex-row justify-between items-center pt-4 pb-2">
          {/* Espaciador para centrar el título */}
          <View className="w-6" />
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-xl text-gray-900 font-['AlanSans-VariableFont_wght'] font-bold">
            Mi Perfil
          </Text>
          <TouchableOpacity>
            <MaterialCommunityIcons
              name="pencil"
              size={24}
              className="text-gray-700"
            />
          </TouchableOpacity>
        </View>

        {/* Info de Perfil */}
        <View className="items-center mt-6">
          <Image
            source={{
              uri: 'https://placehold.co/100x100/EAD8C0/805A3B?text=AC&font=inter',
            }}
            className="w-24 h-24 rounded-full"
          />
          <Text className="text-2xl text-gray-900 mt-4 font-['AlanSans-VariableFont_wght'] font-bold">
            Vanessa Soto
          </Text>
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-base text-gray-500 mt-1 font-['AlanSans-VariableFont_wght']">
            vanessa.soto.24@gmail.com
          </Text>
        </View>

        {/* Menú de Acciones */}
        <View className="mt-8 space-y-3">
          <ProfileMenuItem iconName="account-outline" text="Edit Profile" />
          <ProfileMenuItem iconName="cog-outline" text="Settings" />
          <ProfileMenuItem iconName="help-circle-outline" text="Help & Support" />
          <ProfileMenuItem iconName="logout" text="Logout" isLogout />
        </View>

        {/* Artesanos Favoritos */}
        <View className="mt-8">
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-lg text-gray-900 mb-4 font-['AlanSans-VariableFont_wght'] font-bold">
            My Favorite Artisans
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-4">
              <ArtisanAvatar
                imageUri="https://placehold.co/64x64/EAD8C0/805A3B?text=EV"
                name="Elena Vance"
              />
              <ArtisanAvatar
                imageUri="https://placehold.co/64x64/D6C0A5/805A3B?text=ML"
                name="Marcus Lowe"
              />
              <ArtisanAvatar
                imageUri="https://placehold.co/64x64/EAD8C0/805A3B?text=CF"
                name="Clara Finch"
              />
              <ArtisanAvatar
                imageUri="https://placehold.co/64x64/C8BBAE/805A3B?text=DC"
                name="David Chen"
              />
              <ArtisanAvatar
                imageUri="https://placehold.co/64x64/EAD8C0/805A3B?text=SJ"
                name="Sarah Jenkins"
              />
            </View>
          </ScrollView>
        </View>

        {/* Artesanías Recientes */}
        <View className="mt-8">
          {/* 3. Aplicar la fuente personalizada y el peso */}
          <Text className="text-lg text-gray-900 mb-4 font-['AlanSans-VariableFont_wght'] font-bold">
            Recently Viewed Crafts
          </Text>
          <View className="flex-row flex-wrap justify-between">
            <CraftCard
              imageUri="https://placehold.co/180x160/DDEBF6/5A7D9A?text=Vase&font=inter"
              title="Ceramic Vase"
              artisan="Elena Vance"
            />
            <CraftCard
              imageUri="https://placehold.co/180x160/8B4513/FFFFFF?text=Wallet&font=inter"
              title="Leather Wallet"
              artisan="Marcus Lowe"
            />
            <CraftCard
              imageUri="https://placehold.co/180x160/222222/00BFFF?text=Necklace&font=inter"
              title="Silver Necklace"
              artisan="Clara Finch"
            />
            <CraftCard
              imageUri="httpsD://placehold.co/180x160/506E86/FFFFFF?text=Print&font=inter"
              title="Forest Print"
              artisan="David Chen"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
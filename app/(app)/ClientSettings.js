// app/(app)/ClientSettings.js
// Pantalla de ajustes para el cliente con opciones de gestión, soporte y cierre de sesión
import React from 'react';
import { View, Text as DefaultText, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService';
import useCustomFonts from '../../hooks/useFonts';


const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );


const ClientSettings = () => {
  const router = useRouter();

  // Función para cerrar sesión
  const handleLogout = async () => {
    await signOut();
  };

  // Opciones de ajustes
  const settingsOptions = [
    {
      id: 'profile',
      icon: 'account-circle',
      title: 'Gestión de la Cuenta',
      description: 'Ver y editar tu perfil de cliente',
      onPress: () => router.push('/clientProfile')
    },
    {
      id: 'notifications',
      icon: 'bell-outline',
      title: 'Notificaciones',
      description: 'Configura tus preferencias de notificaciones',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
    {
      id: 'config',
      icon: 'tune',
      title: 'Configuración de la App',
      description: 'Personaliza la aplicación',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
  ];

  const supportOptions = [
    {
      id: 'help',
      icon: 'information-outline',
      title: 'Ayuda y Soporte',
      description: 'Obtén ayuda con la aplicación',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
    {
      id: 'terms',
      icon: 'file-document-outline',
      title: 'Términos y Condiciones',
      description: 'Lee nuestros términos y condiciones',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
  ];

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white py-4 px-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'Alan Sans'}}className="text-lg font-bold text-gray-900">Mi Cuenta</Text>
        <TouchableOpacity className="p-2">
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Sección de Perfil */}
      <View className="bg-white p-4 mb-4">
        <TouchableOpacity className="flex-row items-center">
          <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="account" size={24} color="#666" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'Alan Sans'}}className="text-base font-semibold text-gray-900">Nombre del Artesano</Text>
            <Text style={{fontFamily: 'Alan Sans'}}className="text-xs text-[#9D046D]">Ver mi perfil</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sección Gestión */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-sm font-medium text-gray-700">Gestión</Text>
        </View>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            className="flex-row items-center px-4 py-3 border-b border-gray-200"
            onPress={option.onPress}
          >
            <View className="w-10 h-10 bg-blue-100 rounded-full mr-3 justify-center items-center">
              <MaterialCommunityIcons name={option.icon} size={20} color="#2575fc" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">{option.title}</Text>
              <Text className="text-xs text-gray-600">{option.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Sección Soporte */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-sm font-medium text-gray-700">Soporte</Text>
        </View>
        {supportOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            className="flex-row items-center px-4 py-3 border-b border-gray-200"
            onPress={option.onPress}
          >
            <View className="w-10 h-10 bg-blue-100 rounded-full mr-3 justify-center items-center">
              <MaterialCommunityIcons name={option.icon} size={20} color="#2575fc" />
            </View>
            <View className="flex-1">
              <Text className="text-base font-medium text-gray-900">{option.title}</Text>
              <Text className="text-xs text-gray-600">{option.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Botón de Cerrar Sesión */}
      <View className="px-4 pb-4">
        <TouchableOpacity
          className="py-3 px-4 bg-[#E8C6E8] rounded-xl flex-row items-center justify-center"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#9D046D" />
          <Text className="ml-2 text-base font-semibold text-[#9D046D]">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default ClientSettings;
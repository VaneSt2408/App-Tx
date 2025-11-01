// En: app/(app)/ClientSettings.js -> Archivo de ajustes del cliente (Frontend)
// Este archivo es el encargado de mostrar los ajustes del cliente en la aplicación.
// Permite cerrar sesión, navegar al perfil del cliente, ver sus publicaciones y productos.

// Importaciones
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,Alert} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService';

// Componente principal
export default function ClientSettings() {
  const router = useRouter(); // Obtener el router

  // Función para cerrar sesión
  const handleLogout = async () => {
    await signOut();
  };

  // Opciones de ajustes
  const settingsOptions = [
    {
      id: 'profile',
      icon: 'account-circle',
      title: 'Mi Perfil',
      description: 'Ver y editar tu perfil de cliente',
      onPress: () => router.push('/clientProfile')
    },
    {
      id: 'privacy',
      icon: 'lock-outline',
      title: 'Privacidad',
      description: 'Gestiona tu privacidad y seguridad',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
    {
      id: 'notifications',
      icon: 'bell-outline',
      title: 'Notificaciones',
      description: 'Configura tus preferencias de notificaciones',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
    {
      id: 'about',
      icon: 'information-outline',
      title: 'Acerca de',
      description: 'Información sobre la aplicación',
      onPress: () => Alert.alert('Próximamente', 'Esta función estará disponible pronto')
    },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ajustes</Text>
      </View>

      <View style={styles.section}>
        {settingsOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={styles.option}
            onPress={option.onPress}
          >
            <View style={styles.optionIcon}>
              <MaterialCommunityIcons name={option.icon} size={24} color="#2575fc" />
            </View>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>{option.title}</Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    marginTop: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#db4437',
    paddingVertical: 16,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
});

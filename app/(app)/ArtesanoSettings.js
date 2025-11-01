// En: app/(app)/ArtesanoSettings.js -> Archivo de ajustes del artesano (Frontend)
// Este archivo es el encargado de mostrar los ajustes del artesano en la aplicación.
// Permite cerrar sesión, navegar al perfil del artesano, ver sus publicaciones y productos.


// Importaciones
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity,Alert} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { signOut } from '../../src/services/authService';
import { useAuth } from '../../src/context/AuthContext';

// Componente principal
export default function ArtesanoSettings() {
  const router = useRouter(); // Obtener el router
  const { session } = useAuth(); // Obtener la sesión

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
      description: 'Ver y editar tu perfil de artesano',
      onPress: () => {
        if (session?.user?.id) {
          router.push(`/ArtesanoProfile?userId=${session.user.id}`);
        }
      }
    },
    {
      id: 'products',
      icon: 'package-variant',
      title: 'Mis Productos',
      description: 'Gestiona tus productos',
      onPress: () => {
        if (session?.user?.id) {
          router.push({
            pathname: '/ArtesanoProducts',
            params: { userId: session.user.id }
          });
        }
      }
    },
    {
      id: 'posts',
      icon: 'image-multiple',
      title: 'Mis Publicaciones',
      description: 'Gestiona tus publicaciones',
      onPress: () => {
        if (session?.user?.id) {
          router.push({
            pathname: '/ArtesanoPublications',
            params: { userId: session.user.id }
          });
        }
      }
    },
  ];

  // Renderizado
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

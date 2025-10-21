import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AdminScreen() {
  const router = useRouter();

  // Función para simular el cierre de sesión y volver a la pantalla de autenticación
  const handleLogout = () => {
    // Usamos 'replace' para limpiar el historial de navegación y evitar volver a la pantalla de admin
    router.replace('/auth');
  };

  const handleRegisterArtisan = () => {
    console.log("Navegando a Registrar Artesano...");
    // Aquí podrías usar: router.push('/admin/register-artisan');
  };

  const handleAddNewAdmin = () => {
    console.log("Navegando a Agregar nuevo Administrador...");
    // Aquí podrías usar: router.push('/admin/add-admin');
  };

  const handleListArtisans = () => {
    console.log("Navegando a Lista de Artesanos...");
    // Aquí podrías usar: router.push('/admin/artisan-list');
  };

  return (
    <LinearGradient
      colors={['#610C69', '#5414AE']}
      style={styles.container}
    >
      <StatusBar style="light" />
      <SafeAreaView style={styles.safeArea}>
        <Feather name="shield" size={60} color="white" />
        <Text style={styles.title}>Panel de Administrador</Text>
        <Text style={styles.subtitle}>¡Bienvenido, Admin!</Text>

        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={handleRegisterArtisan} style={styles.actionButton}>
            <Feather name="user-plus" size={22} color="white" style={styles.icon} />
            <Text style={styles.actionButtonText}>Registrar artesano</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleAddNewAdmin} style={styles.actionButton}>
            <Feather name="user-check" size={22} color="white" style={styles.icon} />
            <Text style={styles.actionButtonText}>Agregar nuevo Administrador</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleListArtisans} style={styles.actionButton}>
            <Feather name="list" size={22} color="white" style={styles.icon} />
            <Text style={styles.actionButtonText}>Lista de artesanos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Feather name="log-out" size={20} color="white" style={styles.icon} />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1, justifyContent: 'space-between', alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
  title: { fontSize: 32, fontWeight: 'bold', color: 'white', marginTop: 20, marginBottom: 8 },
  subtitle: { fontSize: 18, color: 'rgba(255, 255, 255, 0.8)' },
  actionsContainer: {
    width: '100%',
    marginTop: 40,
    alignItems: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: '90%',
    marginBottom: 15,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  icon: {
    marginRight: 15,
  },
  logoutButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 82, 82, 0.2)', paddingVertical: 12, paddingHorizontal: 30, borderRadius: 25, marginTop: 20 },
  logoutText: { color: 'white', fontSize: 16, fontWeight: '600' },
});
// En: app/(app)/ChangePassword.js -> Archivo de cambio de contraseña (Frontend)
// Este archivo es el encargado de mostrar el formulario de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña del usuario registrado en la base de datos.

// Importaciones
import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, TouchableOpacity, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../src/supabase/client'; // Importa el cliente de Supabase para interactuar con la base de datos y la autenticación.
import { useAuth } from '../../src/context/AuthContext'; // Importa el contexto de autenticación.
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView, MotiText, AnimatePresence } from 'moti';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';

export default function ChangePassword() { // Define y exporta el componente funcional 'ChangePassword'.
  const { refreshProfile } = useAuth(); // Obtiene la función para refrescar el perfil.
  const router = useRouter();
  const [newPassword, setNewPassword] = useState(''); // Crea un estado para guardar la nueva contraseña que escribe el usuario.
  const [confirmPassword, setConfirmPassword] = useState(''); // Crea un estado para guardar la confirmación de la contraseña.
  const [loading, setLoading] = useState(false); // Crea un estado para saber si una operación está en curso (ej. para mostrar un spinner).
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const [notification, setNotification] = useState(null);

  // Requisitos de la contraseña
  const passwordRequirements = [
    { regex: /.{8,}/, text: "Al menos 8 caracteres" },
    { regex: /[A-Z]/, text: "Al menos una mayúscula" },
    { regex: /[a-z]/, text: "Al menos una minúscula" },
    { regex: /[0-9]/, text: "Al menos un número" },
    { regex: /[^A-Za-z0-9]/, text: "Al menos un caracter especial" },
  ];

  const passwordsMatch = newPassword && newPassword === confirmPassword;
  const allRequirementsMet = passwordRequirements.every(req => req.regex.test(newPassword));

  // Define la función asíncrona que se ejecutará al presionar el botón de cambiar contraseña.
  const handleChangePassword = async () => {
    setNotification(null);
    if (!newPassword || !confirmPassword) {
      setNotification({ type: 'error', message: 'Por favor completa ambos campos.' });
      return;
    }
    // Valida si las contraseñas escritas en ambos campos no coinciden.
    if (newPassword !== confirmPassword) {
      setNotification({ type: 'error', message: 'Las contraseñas no coinciden.' });
      return;
    }
    if (!allRequirementsMet) {
      setNotification({ type: 'error', message: 'La contraseña no cumple con todos los requisitos.' });
      return;
    }
    try {
      setLoading(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        setNotification({ type: 'error', message: `Error: ${error.message}` });
        return; 
      } 
      await refreshProfile();
      setNotification({ type: 'success', message: '¡Contraseña actualizada! Serás redirigido.' });
      setTimeout(() => {
        router.replace('/(app)/completeArtesanoProfile'); // Redirigir a completar perfil
      }, 2500);
    } catch (_) {  
      setNotification({ type: 'error', message: 'Ocurrió un problema inesperado.' });
    } finally { 
      setLoading(false); 
    }
  };

  const PasswordRequirement = ({ met, text }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
      <MaterialCommunityIcons 
        name={met ? "check-circle" : "close-circle"} 
        size={16} 
        color={met ? "#28a745" : "#dc3545"} 
      />
      <Text style={{ marginLeft: 8, fontSize: 14, color: met ? '#28a745' : '#dc3545' }}>{text}</Text>
    </View>
  );

  return (
    <LinearGradient colors={['#FDFAF1', '#FDFAF1']} style={styles.container}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <MotiText from={{ opacity: 0, translateY: -30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 800 }} style={styles.title}>
              Crea tu Contraseña Definitiva
            </MotiText>
            <MotiText from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', duration: 800, delay: 200 }} style={styles.subtitle}>
              Este será tu acceso principal a la aplicación.
            </MotiText>

            <AnimatePresence>
              {notification && (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  exit={{ opacity: 0, translateY: 10 }}
                  style={[styles.notificationContainer, { backgroundColor: notification.type === 'error' ? '#f8d7da' : '#d4edda' }]}
                >
                  <Text style={{ color: notification.type === 'error' ? '#721c24' : '#155724' }}>
                    {notification.message}
                  </Text>
                </MotiView>
              )}
            </AnimatePresence>

            <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400, delay: 100 }} style={{ width: '100%' }}>
              <View style={[styles.inputContainer, focusedInput === 'new' && styles.inputFocused]}>
                <MaterialCommunityIcons name="lock-outline" size={20} color="#9D046D" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nueva contraseña"
                  placeholderTextColor="#9D046D"
                  secureTextEntry={!isPasswordVisible}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  onFocus={() => setFocusedInput('new')}
                  onBlur={() => setFocusedInput(null)}
                />
                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                  <MaterialCommunityIcons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9D046D" style={styles.icon} />
                </TouchableOpacity>
              </View>
            </MotiView>

            <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400, delay: 200 }} style={{ width: '100%' }}>
              <View style={[styles.inputContainer, focusedInput === 'confirm' && styles.inputFocused]}>
                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9D046D" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Confirmar contraseña"
                  placeholderTextColor="#9D046D"
                  secureTextEntry={!isPasswordVisible}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => setFocusedInput('confirm')}
                  onBlur={() => setFocusedInput(null)}
                />
              </View>
            </MotiView>

            <MotiView style={styles.requirementsContainer} from={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ type: 'timing', delay: 300 }}>
              {passwordRequirements.map((req, index) => (
                <PasswordRequirement key={index} met={req.regex.test(newPassword)} text={req.text} />
              ))}
              <PasswordRequirement met={passwordsMatch} text="Las contraseñas coinciden" />
            </MotiView>

            <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 500, delay: 400 }} style={{ width: '100%', marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleChangePassword}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Guardar Contraseña</Text>
                )}
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(238, 3, 89, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#9D046D',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#9D046D',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  requirementsContainer: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  notificationContainer: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
});

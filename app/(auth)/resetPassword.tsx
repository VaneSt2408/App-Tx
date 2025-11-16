// En: app/(auth)/resetPassword.tsx -> Archivo de cambio de contraseña (Frontend)
// Este archivo es el encargado de mostrar el formulario de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña de un usuario mediante un formulario de cambio de contraseña.

// Importaciones
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AnimatePresence, MotiText, MotiView } from 'moti';
import React, { useState, useEffect } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Importamos la función de nuestro servicio
import { updatePassword } from '../../src/services/authService';
import { validateNewPassword } from '../../src/services/profileInfo'; // Ruta corregida
import { useAuth } from '../../src/context/AuthContext';

// Componente principal
export default function ResetPasswordScreen() {
    const router = useRouter(); // Obtener el router
    const { resetPasswordRecoveryMode } = useAuth(); // Obtener la función para resetear el modo de recuperación de contraseña
    const [password, setPassword] = useState(''); // Establecer el estado de la contraseña
    const [confirmPassword, setConfirmPassword] = useState(''); // Establecer el estado de la confirmación de la contraseña
    const [isLoading, setIsLoading] = useState(false); // Establecer el estado de carga
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Establecer el estado de visibilidad de la contraseña    
    const [focusedInput, setFocusedInput] = useState<string | null>(null);
    const [passwordValidationErrors, setPasswordValidationErrors] = useState<string[]>([]);
    const [passwordsMatch, setPasswordsMatch] = useState(true);
    const [notification, setNotification] = useState<{ type: 'error' | 'success', message: string } | null>(null);

    // NOTA: Esta pantalla se carga cuando el Deep Link trae al usuario.
    // En este punto, Supabase ya autenticó al usuario temporalmente.

    const handlePasswordChange = (value: string) => {
        setPassword(value);
        setPasswordsMatch(value === confirmPassword);
        const validation = validateNewPassword(value);
        setPasswordValidationErrors(validation.errors);
    };

    const handleConfirmPasswordChange = (value: string) => {
        setConfirmPassword(value);
        setPasswordsMatch(password === value);
    };

    const PasswordRequirement = ({ met, text }: { met: boolean, text: string }) => {
        return (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <MaterialCommunityIcons 
                    name={met ? "check-circle" : "close-circle"} 
                    size={16} 
                    color={met ? "#28a745" : "#dc3545"} 
                />
                <Text style={{ marginLeft: 8, fontSize: 14, color: met ? '#28a745' : '#dc3545' }}>{text}</Text>
            </View>
        );
    };

    useEffect(() => {
        if (notification?.type === 'success') {
            const timer = setTimeout(() => {
                resetPasswordRecoveryMode();
                router.replace('/auth');
            }, 2500); // Espera 2.5 segundos antes de redirigir
            return () => clearTimeout(timer);
        }
    }, [notification, router, resetPasswordRecoveryMode]);

    const handlePasswordUpdate = async () => {
        setNotification(null); // Limpiar notificaciones previas
        if (!password || passwordValidationErrors.length > 0 || !passwordsMatch) {
            setNotification({ type: 'error', message: 'La contraseña no cumple con todos los requisitos.' });
            return;
        }

        setIsLoading(true);
        
        // 1. Llamar a la lógica de backend para actualizar
        const result = await updatePassword(password);

        setIsLoading(false);
        
        // 2. Manejar la respuesta
        if (result.error) {
            // Si hay un error (ej: token expirado o no autenticado), la sesión es inválida.
            setNotification({ type: 'error', message: `Error: ${result.error}` });
            // Opcional: Forzar salida si el error es de autenticación
            setTimeout(() => {
                resetPasswordRecoveryMode();
                router.replace('/auth');
            }, 3000);
        } else {
            // La actualización fue exitosa
            setNotification({ type: 'success', message: '¡Contraseña actualizada! Serás redirigido.' });
        }
    };

    return (
        <LinearGradient
            colors={['#FDFAF1', '#FDFAF1']}
            style={styles.container}
        >
            <StatusBar style="dark" />
            <SafeAreaView style={{ flex: 1 }}>
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={{ flex: 1 }}
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <MotiText
                            from={{ opacity: 0, translateY: -30 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 900 }}
                            style={styles.title}
                        >
                            Establecer Nueva Contraseña
                        </MotiText>

                        <MotiText
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'timing', duration: 900, delay: 200 }}
                            style={styles.subtitle}
                        >
                            Introduce tu nueva contraseña. Asegúrate de que sea segura.
                        </MotiText>

                        {/* INPUT: Nueva Contraseña */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 100 }}
                            style={{ width: '100%' }}
                        > 
                            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
                                <MaterialCommunityIcons name="lock-outline" size={20} color="#9D046D" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Nueva Contraseña"
                                    placeholderTextColor="#9D046D"
                                    value={password}
                                    onChangeText={handlePasswordChange}
                                    secureTextEntry={!isPasswordVisible}
                                    onFocus={() => setFocusedInput('password')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <MaterialCommunityIcons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9D046D" style={styles.icon} />
                                </TouchableOpacity>
                            </View>
                        </MotiView>

                        {/* TODO: Reemplazar esto con un componente Toast/Modal más elegante */}
                        <AnimatePresence>
                            {notification && (
                                <MotiView
                                    from={{ opacity: 0, translateY: 10 }}
                                    animate={{ opacity: 1, translateY: 0 }}
                                    exit={{ opacity: 0, translateY: 10 }}
                                    style={[
                                        styles.notificationContainer,
                                        { backgroundColor: notification.type === 'error' ? '#f8d7da' : '#d4edda' }
                                    ]}
                                >
                                    <Text style={{ color: notification.type === 'error' ? '#721c24' : '#155724' }}>
                                        {notification.message}
                                    </Text>
                                </MotiView>
                            )}
                        </AnimatePresence>

                        {/* INPUT: Confirmar Contraseña */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 200 }}
                            style={{ width: '100%' }}
                        > 
                            <View style={[styles.inputContainer, focusedInput === 'confirmPassword' && styles.inputFocused]}>
                                <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9D046D" style={styles.icon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirmar Nueva Contraseña"
                                    placeholderTextColor="#9D046D"
                                    value={confirmPassword}
                                    onChangeText={handleConfirmPasswordChange}
                                    secureTextEntry={!isPasswordVisible}
                                    onFocus={() => setFocusedInput('confirmPassword')}
                                    onBlur={() => setFocusedInput(null)}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <MaterialCommunityIcons name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9D046D" style={styles.icon} />
                                </TouchableOpacity>
                            </View>
                        </MotiView>

                        {/* Requisitos de la contraseña */}
                        <MotiView 
                            style={styles.requirementsContainer}
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'timing', delay: 300 }}
                        >
                            <PasswordRequirement met={password.length >= 8} text="Al menos 8 caracteres" />
                            <PasswordRequirement met={/[A-Z]/.test(password)} text="Al menos una mayúscula" />
                            <PasswordRequirement met={/[a-z]/.test(password)} text="Al menos una minúscula" />
                            <PasswordRequirement met={/[0-9]/.test(password)} text="Al menos un número" />
                            <PasswordRequirement met={/[^A-Za-z0-9]/.test(password)} text="Al menos un caracter especial" />
                            <PasswordRequirement met={passwordsMatch && confirmPassword.length > 0} text="Las contraseñas coinciden" />
                        </MotiView>


                        {/* BOTÓN DE ACTUALIZAR */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 400, delay: 300 }}
                            style={{ width: '100%', marginTop: 20 }}
                        > 
                            <TouchableOpacity 
                                onPress={handlePasswordUpdate} 
                                disabled={isLoading}
                                style={[styles.button, isLoading && styles.buttonDisabled]}
                            >
                                <Text style={styles.buttonText}>
                                    {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                                </Text>
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

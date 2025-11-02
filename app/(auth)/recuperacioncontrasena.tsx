// En: app/(auth)/recuperacioncontrasena.tsx -> Archivo de recuperación de contraseña (Frontend)
// Este archivo es el encargado de mostrar el formulario de recuperación de contraseña en la aplicación.
// Permite recuperar la contraseña de un usuario mediante un correo electrónico.

// Importaciones
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// ¡Importamos la función del servicio que contiene la lógica de Supabase!
import { resetPasswordForEmail } from '../../src/services/authService'; 

// Componente principal
<<<<<<< HEAD
export default function recuperacioncontrasena() {
    const router = useRouter(); // Obtener el router
    const [email, setEmail] = useState(''); // Establecer el estado del correo electrónico
    const [isLoading, setIsLoading] = useState(false); // Establecer el estado de carga
    const [isFocused, setIsFocused] = useState(false); // Establecer el estado de foco
=======
export default function RecuperacionContrasena() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
>>>>>>> 0944f5e7c0761bb475dd36b398ae1b0869f56b67
    
    // Función para enviar el enlace de recuperación de contraseña
    const handlePasswordReset = async () => {
        if (!email.trim()) {
            Alert.alert('Error', 'Por favor, introduce tu correo electrónico.');
            return;
        }

        setIsLoading(true);
        
        // 1. Llamar a la lógica de backend (servicio)
        const result = await resetPasswordForEmail(email);

        setIsLoading(false);
        
        // 2. Manejar la respuesta y actualizar la UI
        if (result.error) {
            Alert.alert('Error al Enviar', result.error);
        } else {
            Alert.alert(
                'Correo Enviado',
                `Hemos enviado un enlace de recuperación a ${email}. Revisa tu bandeja de entrada. Si no lo encuentras, revisa la carpeta de spam.`,
                // Usamos Alert.alert sin callback de navegación para asegurar que el mensaje se ve
                // y el usuario debe navegar manualmente de vuelta.
            );
            // Navega de vuelta al login (reemplazando la pantalla actual en el historial)
            router.replace('/auth'); 
        }
    };

    return (
        <LinearGradient
            colors={['#FDFAF1', '#FDFAF1']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <StatusBar style="dark" />
            <SafeAreaView className="flex-1">
                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    className="flex-1"
                >
                    <ScrollView 
                        contentContainerStyle={styles.scrollContainer}
                        showsVerticalScrollIndicator={false}
                    >
                        <MotiText
                            from={{ opacity: 0, translateY: -50 }}
                            animate={{ opacity: 1, translateY: 0 }}
                            transition={{ type: 'timing', duration: 900 }}
                            className="text-gray-800 text-4xl font-bold mb-9 text-center"
                        >
                            Recuperar Contraseña
                        </MotiText>

                        <MotiText
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'timing', duration: 900, delay: 200 }}
                            className="text-gray-600 text-lg mb-8 text-center"
                        >
                            Introduce tu correo electrónico asociado a la cuenta.
                        </MotiText>

                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 100 }}
                            className="w-full"
                        > 
                            <View 
                                className="w-full p-4 rounded-2xl mb-6 border-2 flex-row items-center"
                                style={{ 
                                    backgroundColor: 'rgba(238, 3, 89, 0.25)', // #EE0359 con transparencia
                                    borderColor: isFocused ? '#9D046D' : 'rgba(0,0,0,0.1)'
                                }}
                            >
                                <Feather name="mail" size={20} color="#9D046D" style={{ marginRight: 10 }} />
                                <TextInput
                                    onFocus={() => setIsFocused(true)}
                                    onBlur={() => setIsFocused(false)}
                                    className="flex-1 text-gray-800 text-lg font-semibold"
                                    placeholder="Correo Electrónico"
                                    placeholderTextColor="#9D046D"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                />
                            </View>
                        </MotiView>

                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 400, delay: 300 }}
                            className="w-full"
                        >
                            <TouchableOpacity 
                                onPress={handlePasswordReset} 
                                disabled={isLoading}
                                style={{backgroundColor: '#9D046D'}} className="w-full p-4 rounded-2xl items-center mb-6 shadow-lg shadow-black/20"
                            >
                                <Text className="text-white text-xl font-bold">
                                    {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                                </Text>
                            </TouchableOpacity>
                        </MotiView>

                        <Link href="/auth" asChild>
                            <TouchableOpacity className='w-full items-center mt-4'>
                                <Text className= 'text-base font-semibold underline' style={{color: '#9D046D'}}>
                                    Volver al inicio de sesión
                                </Text>
                            </TouchableOpacity>
                        </Link>
                        
                    </ScrollView>
                </KeyboardAvoidingView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    scrollContainer: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 40 
    }
});
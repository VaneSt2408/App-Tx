import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// ¡Importamos la función del servicio que contiene la lógica de Supabase!
import { resetPasswordForEmail } from '../../src/services/authService'; 

export default function recuperacioncontrasena() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    // Función que llama a la lógica de backend
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
            colors={['#020202ff', '#923febff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1 }}
        >
            <StatusBar style="light" />
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
                            className="text-white text-4xl font-bold mb-9 text-center"
                        >
                            Recuperar Contraseña
                        </MotiText>

                        <MotiText
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'timing', duration: 900, delay: 200 }}
                            className="text-white/80 text-lg mb-8 text-center"
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
                                className="w-full bg-white/20 p-4 rounded-2xl mb-6 border-2 flex-row items-center"
                            >
                                <Feather name="mail" size={20} color="white" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-white text-lg"
                                    placeholder="Correo Electrónico"
                                    placeholderTextColor="#ccc"
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
                                className="w-full bg-white p-4 rounded-2xl items-center mb-6"
                            >
                                <Text className="text-black text-xl font-bold">
                                    {isLoading ? 'Enviando...' : 'Enviar Enlace de Recuperación'}
                                </Text>
                            </TouchableOpacity>
                        </MotiView>

                        <Link href="/auth" asChild>
                            <TouchableOpacity className='w-full items-center mt-4'>
                                <Text className='text-white/60 text-base font-semibold underline'>
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
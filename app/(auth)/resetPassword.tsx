import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
// Importamos la función de nuestro servicio
import { updatePassword } from '../../src/services/authService'; 
import { supabase } from '../../src/supabase/client';

export default function ResetPasswordScreen() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPasswordVisible, setIsPasswordVisible] = useState(false);

    // NOTA: Esta pantalla se carga cuando el Deep Link trae al usuario.
    // En este punto, Supabase ya autenticó al usuario temporalmente.

    const handlePasswordUpdate = async () => {
        if (password.length < 6) { // Validación simple, ajusta según tus reglas
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        setIsLoading(true);
        
        // 1. Llamar a la lógica de backend para actualizar
        const result = await updatePassword(password);

        setIsLoading(false);
        
        // 2. Manejar la respuesta
        if (result.error) {
            // Si hay un error (ej: token expirado o no autenticado), la sesión es inválida.
            Alert.alert('Error al Actualizar', `No pudimos cambiar tu contraseña. Por favor, solicita un nuevo enlace. Detalles: ${result.error}`);
            // Fuerza la salida al login
            router.replace('/auth');
        } else {
            Alert.alert(
                'Éxito',
                'Tu contraseña ha sido actualizada correctamente. ¡Ya puedes iniciar sesión con tu nueva clave!',
            );
            // La actualización fue exitosa, navegamos al login para que inicie sesión
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
                            Establecer Nueva Contraseña
                        </MotiText>

                        <MotiText
                            from={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ type: 'timing', duration: 900, delay: 200 }}
                            className="text-white/80 text-lg mb-8 text-center"
                        >
                            Has regresado exitosamente. Introduce tu nueva contraseña.
                        </MotiText>

                        {/* INPUT: Nueva Contraseña */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 100 }}
                            className="w-full mb-4"
                        > 
                            <View className="w-full bg-white/20 p-4 rounded-2xl border-2 flex-row items-center">
                                <Feather name="lock" size={20} color="white" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-white text-lg"
                                    placeholder="Nueva Contraseña"
                                    placeholderTextColor="#ccc"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>

                        {/* INPUT: Confirmar Contraseña */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 200 }}
                            className="w-full mb-6"
                        > 
                            <View className="w-full bg-white/20 p-4 rounded-2xl border-2 flex-row items-center">
                                <Feather name="lock" size={20} color="white" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-white text-lg"
                                    placeholder="Confirmar Nueva Contraseña"
                                    placeholderTextColor="#ccc"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!isPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                                    <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>

                        {/* BOTÓN DE ACTUALIZAR */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 400, delay: 300 }}
                            className="w-full"
                        >
                            <TouchableOpacity 
                                onPress={handlePasswordUpdate} 
                                disabled={isLoading}
                                className="w-full bg-white p-4 rounded-2xl items-center mb-6"
                            >
                                <Text className="text-black text-xl font-bold">
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
    scrollContainer: { 
        flexGrow: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        padding: 40 
    }
});

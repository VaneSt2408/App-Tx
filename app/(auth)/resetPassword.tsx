// En: app/(auth)/resetPassword.tsx -> Archivo de cambio de contraseña (Frontend)
// Este archivo es el encargado de mostrar el formulario de cambio de contraseña en la aplicación.
// Permite cambiar la contraseña de un usuario mediante un formulario de cambio de contraseña.

// Importaciones
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
import { useAuth } from '../../src/context/AuthContext';

// Componente principal
export default function ResetPasswordScreen() {
    const router = useRouter(); // Obtener el router
    const { resetPasswordRecoveryMode } = useAuth(); // Obtener la función para resetear el modo de recuperación de contraseña
    const [password, setPassword] = useState(''); // Establecer el estado de la contraseña
    const [confirmPassword, setConfirmPassword] = useState(''); // Establecer el estado de la confirmación de la contraseña
    const [isLoading, setIsLoading] = useState(false); // Establecer el estado de carga
    const [isPasswordVisible, setIsPasswordVisible] = useState(false); // Establecer el estado de visibilidad de la contraseña
    const [currentPassword, setCurrentPassword] = useState(''); // Establecer el estado de la contraseña actual
    const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false); // Establecer el estado de visibilidad de la contraseña actual

    // NOTA: Esta pantalla se carga cuando el Deep Link trae al usuario.
    // En este punto, Supabase ya autenticó al usuario temporalmente.

    // Función para obtener la contraseña actual del usuario
    const getCurrentPassword = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                // En un escenario real, no podemos obtener la contraseña actual por seguridad
                // Pero podemos usar el email para verificar si es un cambio de contraseña válido
                return user.email; // Usamos el email como referencia
            }
        } catch (error) {
        }
        return null;
    };

    // Función para calcular similitud entre contraseñas
    const calculateSimilarity = (password1: string, password2: string): number => {
        if (!password1 || !password2) return 0;
        
        const longer = password1.length > password2.length ? password1 : password2;
        const shorter = password1.length > password2.length ? password2 : password1;
        
        if (longer.length === 0) return 1.0;
        
        const editDistance = levenshteinDistance(longer, shorter);
        return (longer.length - editDistance) / longer.length;
    };

    // Función para calcular distancia de Levenshtein
    const levenshteinDistance = (str1: string, str2: string): number => {
        const matrix = [];
        
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[str2.length][str1.length];
    };

    // Función para validar que la contraseña nueva sea suficientemente diferente
    const validatePasswordDifference = (newPassword: string, currentPassword: string): boolean => {
        // Si no hay contraseña actual, permitir cualquier cambio
        if (!currentPassword) return true;
        
        const similarity = calculateSimilarity(newPassword, currentPassword);
        const minDifference = 0.3; // 30% de diferencia mínima
        
        return similarity < (1 - minDifference);
    };

    const handlePasswordUpdate = async () => {
        if (password.length < 6) { // Validación simple, ajusta según tus reglas
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres.');
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        // Validación de similitud con contraseña anterior
        if (currentPassword.trim()) {
            const isDifferentEnough = validatePasswordDifference(password, currentPassword);
            
            if (!isDifferentEnough) {
                Alert.alert(
                    'Contraseña muy similar',
                    'La nueva contraseña es muy similar a la anterior. Por seguridad, debes elegir una contraseña completamente diferente.',
                    [
                        { text: 'Entendido', style: 'default' }
                    ]
                );
                return; // No permite continuar
            }
        }

        setIsLoading(true);
        
        // 1. Llamar a la lógica de backend para actualizar
        const result = await updatePassword(password);

        setIsLoading(false);
        
        // 2. Manejar la respuesta
        if (result.error) {
            // Si hay un error (ej: token expirado o no autenticado), la sesión es inválida.
            Alert.alert('Error al Actualizar', `No pudimos cambiar tu contraseña. Por favor, solicita un nuevo enlace. Detalles: ${result.error}`);
            // Reseteamos el modo de recuperación de contraseña
            resetPasswordRecoveryMode();
            // Fuerza la salida al login
            router.replace('/auth');
        } else {
            Alert.alert(
                'Éxito',
                'Tu contraseña ha sido actualizada correctamente. ¡Ya puedes iniciar sesión con tu nueva clave!',
            );
            // Reseteamos el modo de recuperación de contraseña
            resetPasswordRecoveryMode();
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
                            Has regresado exitosamente. Introduce tu contraseña actual y tu nueva contraseña.
                        </MotiText>

                        {/* INPUT: Contraseña Actual */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ type: 'timing', duration: 300, delay: 50 }}
                            className="w-full mb-4"
                        > 
                            <View className="w-full bg-white/20 p-4 rounded-2xl border-2 flex-row items-center">
                                <Feather name="lock" size={20} color="white" style={{ marginRight: 10 }} />
                                <TextInput
                                    className="flex-1 text-white text-lg"
                                    placeholder="Contraseña Actual (opcional)"
                                    placeholderTextColor="#ccc"
                                    value={currentPassword}
                                    onChangeText={setCurrentPassword}
                                    secureTextEntry={!isCurrentPasswordVisible}
                                />
                                <TouchableOpacity onPress={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)}>
                                    <Feather name={isCurrentPasswordVisible ? "eye-off" : "eye"} size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </MotiView>

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

import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { signUpWithEmail } from '../services/authService';

// Nota cómo este archivo es mucho más simple. Solo se preocupa del correo y la contraseña.
export default function RegisterPage() {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleRegister = async () => {
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden.');
            return;
        }

        setLoading(true);
        const { data, error } = await signUpWithEmail(email, password);
        setLoading(false);

        if (error) {
            Alert.alert('Error en el registro', error.message);
        } else if (data.user && !data.session) {
            // Este es el mensaje clave para el usuario.
            Alert.alert(
                'Registro Exitoso',
                'Te hemos enviado un correo. Por favor, haz clic en el enlace de confirmación para activar tu cuenta y luego inicia sesión.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
            );
        }
    };

    return (
        <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
            <View style={styles.card}>
                <Text style={styles.title}>Paso 1: Crea tu Cuenta</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Correo electrónico"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    placeholderTextColor="#888"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    placeholderTextColor="#888"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Confirmar Contraseña"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    placeholderTextColor="#888"
                />
                <View style={styles.buttonContainer}>
                    {loading ? (
                        <ActivityIndicator size="small" color="#2575fc" />
                    ) : (
                        <Button title="Registrar Correo" color="#2575fc" onPress={handleRegister} />
                    )}
                </View>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                    <Text style={styles.loginText}>¿Ya tienes una cuenta? Inicia Sesión</Text>
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 16, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5 },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#2575fc' },
    input: { width: '100%', borderWidth: 1, borderColor: '#2575fc', padding: 12, marginBottom: 16, borderRadius: 8, fontSize: 16, backgroundColor: '#f5f6fa', color: '#333' },
    buttonContainer: { width: '100%', marginTop: 8, borderRadius: 8, overflow: 'hidden', justifyContent: 'center', height: 40 },
    loginText: { color: '#6a11cb', marginTop: 20, fontWeight: 'bold' }
});

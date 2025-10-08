// En: src/pages/login.js
import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { signInWithPassword, signInWithGoogle } from '../services/authService';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = async () => {
    await signInWithGoogle();
  };

  const handleLogin = async () => {
    const { error } = await signInWithPassword(email, password);
    if (error) {
      Alert.alert('Error', 'Credenciales incorrectas');
    }
  };

  return (
    <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
      <View style={styles.card}>
        <Text style={styles.title}>Iniciar Sesión</Text>
        <TextInput style={styles.input} placeholder="Correo electrónico" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor="#888" />
        <TextInput style={styles.input} placeholder="Contraseña" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor="#888" />
        <View style={styles.buttonContainer}>
          <Button title="Ingresar" color="#2575fc" onPress={handleLogin} />
        </View>
        <View style={[styles.buttonContainer, { marginTop: 12 }] }>
          <Button title="Ingresar con Google" color="#db4437" onPress={handleGoogleLogin} />
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 16, width: '85%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 8, elevation: 5, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, color: '#2575fc', textAlign: 'center' },
  input: { width: '100%', borderWidth: 1, borderColor: '#2575fc', padding: 12, marginBottom: 16, borderRadius: 8, fontSize: 16, backgroundColor: '#f5f6fa', color: '#333' },
  buttonContainer: { width: '100%', marginTop: 8, borderRadius: 8, overflow: 'hidden' },
});
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function VerificationScreen() {
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleVerifyCode = () => {
    if (code.length === 4) {
      console.log('Verifying code:', code);
      // Aquí irá tu lógica para verificar el código.
      // router.replace('/(tabs)');
    } else {
      Alert.alert('Código Inválido', 'Por favor, introduce el código de 4 dígitos.');
    }
  };

  const sendCodeByEmail = () => {
    console.log('Requesting verification code via email...');
    // Lógica para enviar el código por correo
  };

  const sendCodeBySms = () => {
    console.log('Requesting verification code via SMS...');
    // Lógica para enviar el código por SMS
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
          className="flex-1 justify-center items-center p-10"
        >
          <MotiText
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 900 }}
            className="text-white text-4xl font-bold mb-9 text-center"
          >
            Verifica tu Cuenta
          </MotiText>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="w-full"
          >
            <View style={styles.inputContainer}>
              <Feather name="shield" size={24} color="#ccc" style={styles.icon} />
              <TextInput
                key="verification-code-input"
                style={styles.input}
                placeholder="----"
                placeholderTextColor="#ccc"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </MotiView>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="w-full"
          >
            <TouchableOpacity onPress={handleVerifyCode} className="w-full bg-white p-4 rounded-2xl items-center mb-6">
              <Text className="text-black text-xl font-bold">
                Verificar Código
              </Text>
            </TouchableOpacity>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 300 }}
            className="w-full items-center"
          >
            <Text className="text-white/60 mb-4">¿No recibiste el código? Envíalo de nuevo por:</Text>
            <View className="flex-row justify-around w-full mb-8">
              <TouchableOpacity onPress={sendCodeByEmail} className="bg-white/20 p-5 rounded-2xl items-center flex-1 mx-2">
                <Text className="text-white font-semibold">Correo Electronico</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={sendCodeBySms} className="bg-white/20 p-5 rounded-2xl items-center flex-1 mx-2">
                <Text className="text-white font-semibold">SMS</Text>
              </TouchableOpacity>
            </View>
          </MotiView>

          <TouchableOpacity onPress={() => router.back()} className='w-10/12 bg-white/20 p-4 rounded-full items-center'>
            <Text className='text-white text-2xl font-semibold'> ← Regresar </Text>
          </TouchableOpacity>

        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24, // mb-6
    position: 'relative',
  },
  icon: {
    position: 'absolute',
    left: 16,
    zIndex: 1,
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 16,
    paddingLeft: 56, // Espacio para el icono
    borderRadius: 16,
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    letterSpacing: 10,
  },
});
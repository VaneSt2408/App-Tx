import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Link,useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function InviteArtisanScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);

  const handleSendInvitation = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && emailRegex.test(email)) {
      console.log('Enviando invitación a:', email);
      // Aquí va la lógica para enviar la invitación (llamar a una función de Supabase)
      Alert.alert('Éxito', `Se ha enviado la invitación a ${email}.`);
      setEmail(''); // Se va a limpiar el input después de enviar
    } else {
      Alert.alert('Correo Inválido', 'Por favor, introduce una dirección de correo electrónico válida.');
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1 justify-center items-center p-10"
        >
          <MotiText
            from={{ opacity: 0, translateY: -50 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 900 }}
            className="text-white text-4xl font-bold mb-9 text-center"
          >
            Invitar a Artesano
          </MotiText>

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="w-full"
          >
            <View
              className="w-full bg-white/20 p-4 rounded-2xl mb-6 border-2 flex-row items-center"
              style={{ borderColor: focusedInput === 'email' ? '#a855f7' : 'transparent' }}
            >
              <Feather name="mail" size={20} color="white" style={{ marginRight: 10 }} />
              <TextInput
                onFocus={() => setFocusedInput('email')}
                onBlur={() => setFocusedInput(null)}
                className="flex-1 text-white text-lg"
                placeholder="Ingresa el correo aqui"
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
            transition={{ type: 'timing', duration: 400, delay: 200 }}
            className="w-full"
          >
            <TouchableOpacity onPress={handleSendInvitation} className="w-full bg-white p-4 rounded-2xl items-center mb-8">
              <Text className="text-black text-xl font-bold">Enviar</Text>
            </TouchableOpacity>
          </MotiView>

          <TouchableOpacity onPress={() => router.back()} className="w-10/12 bg-white/20 p-4 rounded-full items-center">
            <Text className="text-white text-2xl font-semibold">← Regresar</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
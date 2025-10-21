import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
// Importa ActivityIndicator para mostrar que algo está cargando
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

// --- Asumiendo que tienes Firebase configurado en tu proyecto ---
// import firebase from 'firebase/app'; // O la importación que uses
// import 'firebase/functions';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [recoveryMethod, setRecoveryMethod] = useState<'email' | 'phone'>('email');
  const [identifier, setIdentifier] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [selectorWidth, setSelectorWidth] = useState(0);
  // 1. Añadir estado de carga
  const [isLoading, setIsLoading] = useState(false);

  // 2. Modificar la función principal para que sea asíncrona y llame al backend
  const handlePasswordReset = async () => {
    // Validación de formato (tu código original, está perfecto)
    if (recoveryMethod === 'email') {
      if (!identifier.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier)) {
        Alert.alert('Correo Inválido', 'Por favor, introduce una dirección de correo electrónico válida.');
        return;
      }
    } else { // 'phone'
      if (!identifier.trim() || !/^\d{7,15}$/.test(identifier)) {
        Alert.alert('Teléfono Inválido', 'Por favor, introduce un número de teléfono válido.');
        return;
      }
    }

    // Iniciar el estado de carga
    setIsLoading(true);

    try {
      // --- AQUÍ VA LA VERIFICACIÓN CON TU BACKEND ---
      // Ejemplo usando la Cloud Function de Firebase que creamos
      // const checkUser = firebase.functions().httpsCallable('checkUserExists');
      // const result = await checkUser({ [recoveryMethod]: identifier.toLowerCase() });
      // const userExists = result.data.exists;
      
      // --- SIMULACIÓN (reemplaza esto con tu llamada real al backend) ---
      console.log(`Verificando si existe ${recoveryMethod}: ${identifier}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simula una espera de red
      const userExists = true; // CAMBIA ESTO por el resultado real de tu backend
      // -----------------------------------------------------------------

      if (userExists) {
        // Si el usuario SÍ existe, intentamos enviar el enlace de recuperación
        console.log(`Usuario encontrado. Enviando instrucciones a ${identifier}`);
        // --- AQUÍ VA TU LÓGICA REAL DE RECUPERACIÓN (ej. Supabase) ---
        // if (recoveryMethod === 'email') {
        //   await supabase.auth.resetPasswordForEmail(identifier);
        // } else {
        //   await supabase.auth.signInWithOtp({ phone: identifier });
        // }
      } else {
        // Si el usuario NO existe, no hacemos nada, pero tampoco revelamos la información.
        // La alerta de éxito se mostrará igualmente fuera del 'if' por seguridad.
        console.log(`Usuario con ${identifier} no encontrado. No se enviará nada.`);
      }

      // Mostramos un mensaje genérico sin importar si el usuario existía o no
      Alert.alert(
        'Petición Enviada',
        'Si existe una cuenta asociada, recibirás las instrucciones para restablecer tu contraseña.',
        [{ text: 'OK', onPress: () => router.back() }]
      );

    } catch (error) {
      console.error("Error en el proceso de recuperación:", error);
      Alert.alert('Error', 'No se pudo completar la solicitud. Inténtalo de nuevo más tarde.');
    } finally {
      // Detener el estado de carga, tanto si hubo éxito como si hubo error
      setIsLoading(false);
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
          className="flex-1 justify-center items-center p-10"
        >
          <MotiView
            from={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 500 }}
            className="mb-8"
          >
            <Feather name="lock" size={80} color="rgba(255, 255, 255, 0.5)" />
          </MotiView>

          <MotiText from={{ opacity: 0, translateY: -50 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 900 }} className="text-white text-4xl font-bold mb-5 text-center">Recuperar Contraseña</MotiText>          
          <MotiText from={{ opacity: 0, translateY: -30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 700, delay: 100 }} className="text-white/80 text-base mb-9 text-center">Elige cómo quieres recuperar tu cuenta.</MotiText>
          
          {/* --- NUEVO SELECTOR DE MÉTODO --- */}
          <MotiView 
            from={{ opacity: 0, translateY: 20 }} 
            animate={{ opacity: 1, translateY: 0 }} 
            transition={{ type: 'timing', duration: 500, delay: 200 }}
            className="flex-row w-full justify-around mb-7"
          >
            <TouchableOpacity 
                onPress={() => { setRecoveryMethod('email'); setIdentifier(''); }}
                className={`flex-1 items-center justify-center p-4 rounded-2xl mx-2 border-2 ${
                    recoveryMethod === 'email' ? 'bg-white/20 border-white' : 'bg-black/20 border-transparent'
                }`}
            >
                <Feather name="mail" size={24} color="white" />
                <Text className="text-white font-semibold mt-2">Correo</Text>
            </TouchableOpacity>
            <TouchableOpacity 
                onPress={() => { setRecoveryMethod('phone'); setIdentifier(''); }}
                className={`flex-1 items-center justify-center p-4 rounded-2xl mx-2 border-2 ${
                    recoveryMethod === 'phone' ? 'bg-white/20 border-white' : 'bg-black/20 border-transparent'
                }`}
            >
                <Feather name="phone" size={24} color="white" />
                <Text className="text-white font-semibold mt-2">Teléfono</Text>
            </TouchableOpacity>
          </MotiView>          

          <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 300, delay: 400 }} className="w-full">
            <View className="w-full bg-white/20 p-4 rounded-2xl mb-6 border-2 flex-row items-center" style={{ borderColor: focusedInput === 'identifier' ? '#a855f7' : 'transparent' }}>
              <Feather name={recoveryMethod === 'email' ? "mail" : "phone"} size={20} color="white" style={{ marginRight: 10 }} />
              <TextInput onFocus={() => setFocusedInput('identifier')} onBlur={() => setFocusedInput(null)} className="flex-1 text-white text-lg" placeholder={recoveryMethod === 'email' ? "Tu correo electrónico" : "Tu número de teléfono"} placeholderTextColor="#ccc" value={identifier} onChangeText={setIdentifier} keyboardType={recoveryMethod === 'email' ? "email-address" : "phone-pad"} autoCapitalize="none" />
            </View>
          </MotiView>

          {/* 3. Modificar el botón para que muestre el estado de carga */}
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 500 }}
            className="w-full"
          >
            <TouchableOpacity
              onPress={handlePasswordReset}
              // Deshabilitar el botón mientras carga
              disabled={isLoading}
              // Cambiar el estilo si está cargando
              className={`w-full p-4 rounded-2xl items-center mb-8 ${isLoading ? 'bg-white/50' : 'bg-white'}`}
            >
              {isLoading ? (
                // Muestra un indicador de carga
                <ActivityIndicator size="small" color="#000" />
              ) : (
                // Muestra el texto normal
                <Text className="text-black text-xl font-bold">
                  Enviar enlace
                </Text>
              )}
            </TouchableOpacity>
          </MotiView>

          {/* ... Tu botón de regresar no cambia ... */}
          <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 600 }} className="w-full">
            <TouchableOpacity onPress={() => router.back()} disabled={isLoading} className='w-full bg-white/20 p-4 rounded-full items-center'>
              <Text className='text-white text-xl font-semibold'>← Regresar</Text>
            </TouchableOpacity>
          </MotiView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
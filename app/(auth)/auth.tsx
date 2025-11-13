import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text as DefaultText, TextInput, TouchableOpacity, View, TextProps } from 'react-native';
import {Alert} from 'react-native';
import { signInWithPassword, signInWithGoogle, signUpWithEmail } from '../../src/services/authService';
import useCustomFonts from '../../hooks/useFonts';




const Text = (props: TextProps) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]}/>
  );
// --- COMPONENTE AUXILIAR PARA MOSTRAR CADA REQUISITO ---
// Este componente muestra un ícono de check o 'x' y el texto del requisito.
const PasswordRequirement = ({ met, text }: { met: boolean; text: string }) => (
  <View className="flex-row items-center mb-1">
    <Feather 
      name={met ? "check-circle" : "x-circle"} 
      size={16} 
      // Usamos los colores directamente para que coincida con tu diseño
      color={met ? "#4ade80" /* verde */ : "#f87171" /* rojo */} 
    />
    <Text className={`ml-2 text-sm ${met ? 'text-green-400' : 'text-red-400'}`}>{text}</Text>
  </View>
);


export default function AuthScreen() {
  const router = useRouter();
  // --- ESTADOS DEL COMPONENTE (UI y validación local) ---
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectorWidth, setSelectorWidth] = useState(0);
  const [confirmPassword, setConfirmPassword] = useState(''); // Estado para el número de teléfono
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  // Nuevo estado para la visibilidad de la contraseña
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string | null }>({});

  const validate = () => {
    const newErrors: { [key: string]: string | null } = {};
    let isValid = true;

    // Validación de Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'El correo electrónico es obligatorio.';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Por favor, introduce un correo válido.';
      isValid = false;
    }

    // Validación de Contraseña
    if (!password.trim()) {
      newErrors.password = 'La contraseña es obligatoria.';
      isValid = false;
    }

    // --- VALIDACIONES SOLO PARA EL MODO REGISTRO ('signup') ---
    if (authMode === 'signup') {
      // Validación de Imagen de Perfil
      if (!profileImage) {
        newErrors.profileImage = 'Por favor, selecciona una imagen de perfil.';
        isValid = false;
      }


      // Validación de Complejidad de Contraseña
      if (password.length < 8) newErrors.password = 'La contraseña debe tener al menos 8 caracteres.';
      else if (!/[A-Z]/.test(password)) newErrors.password = 'Debe contener al menos una mayúscula.';
      else if (!/[a-z]/.test(password)) newErrors.password = 'Debe contener al menos una minúscula.';
      else if (!/[0-9]/.test(password)) newErrors.password = 'Debe contener al menos un número.';
      else if (!/[^A-Za-z0-9]/.test(password)) newErrors.password = 'Debe contener un caracter especial.';
      
      if (newErrors.password) {
        isValid = false;
      }

      
      // Validación de Confirmar Contraseña
      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden.';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  // Función de registro 
  const handleSignUp = async () => {
    
    if (validate()) {
      
      try {
        // Llamada al método de registro del backend
        const { data, error } = await signUpWithEmail(email, password);
        
        if (error) {
          Alert.alert('Error en el registro', error.message);
        } else if (data.user && !data.session) {
          // Este es el mensaje clave para el usuario.
          Alert.alert(
            'Registro Exitoso',
            'Te hemos enviado un correo. Por favor, haz clic en el enlace de confirmación para activar tu cuenta y luego inicia sesión.',
            [{ text: 'OK', onPress: () => setAuthMode('login') }]
          );
        } else {
          Alert.alert('Registro', 'Registro completado, pero con respuesta inesperada');
        }
      } catch (catchError) {
        Alert.alert('Error', 'Ocurrió un error inesperado durante el registro');
      }
    } else {
      Alert.alert('Error de validación', 'Por favor, revisa los campos marcados en rojo');
    }
  };

  // Función de inicio de sesión (solo UI/navegación)
  const handleLogin = async () => {
    const { error } = await signInWithPassword(email, password); // Llama al servicio de autencación
    if (error) {
      Alert.alert('Error', 'Credenciales incorrectas'); // Muestra una alerta si hay un error (Credenciales incorrectas o campos incompletos)
    }
  };

  // Función para manejar el inicio de sesión con Google (solo UI/navegación)
  // Funcion para manejar el inicio de sesión con Google
  const handleGoogleSignIn = async () => { 
    await signInWithGoogle(); // Llama al servicio de autenticación
    //La redirección se maneja en App.js 
  };

  const handlePickImage = async () => {
    // Pedir permiso para acceder a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Lo sentimos, necesitamos permisos de la galería para que esto funcione.');
      return;
    }

    // Abrir el selector de imágenes
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forzar un recorte cuadrado
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
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
            contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}
            showsVerticalScrollIndicator={false}
          >
          <MotiText
            style={{fontFamily: 'Alan Sans'}}
            from={{ opacity: 0, translateY: -50 }} 
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 900 }}
            className="text-gray-800 text-4xl font-bold mb-9 text-center"
          >
            {authMode === 'login' ? 'Bienvenido de Vuelta' : 'Crea tu cuenta'}
          </MotiText>

          {/* --- SELECTOR DE IMAGEN DE PERFIL (SOLO EN REGISTRO) --- */}
          {authMode === 'signup' && ( 
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400 }}
              className="mb-7"
            >
              <TouchableOpacity 
                onPress={handlePickImage} 
                className="w-32 h-32 bg-gray-500/20 rounded-full justify-center items-center border-2 border-dashed border-gray-500/50"
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="items-center">
                    <Feather name="camera" size={32} color="#4B5563" />
                    <Text style={{fontFamily: 'Alan Sans',}} className="text-gray-700 text-center mt-2 text-xs">Añadir foto</Text>
                  </View>
                )}
              </TouchableOpacity> 
              {errors.profileImage && (
                <Text style={[styles.errorText,  { alignSelf: 'center', marginTop: 4 }]}>{errors.profileImage}</Text>
              )}
            </MotiView>
          )}

          <MotiView 
            from={{ opacity: 0, translateY: -20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 600, delay: 600 }}
            onLayout={(event) => setSelectorWidth(event.nativeEvent.layout.width)}
            className="w-64 flex-row bg-black/10 p-0 rounded-full mb-7 relative"
          >
            {selectorWidth > 0 && (
              <MotiView
                animate={{ translateX: authMode === 'login' ? 0 : selectorWidth / 2 }}
                transition={{ type: 'timing', duration: 300 }}
                style={{ backgroundColor: '#9D046D' }}
                className="absolute h-full w-1/2 rounded-full"
              />
            )}
            
            <TouchableOpacity onPress={() => setAuthMode('login')} className="flex-1 py-2 items-center rounded-full">
              <Text 
                style={{ color: authMode === 'login' ? 'white' : '#EE0359', fontFamily: 'Alan Sans'}}
                className="font-bold text-base"
              >
                Inicia Sesion
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity onPress={() => setAuthMode('signup')} className="flex-1 py-2 items-center rounded-full">
              <Text 
                style={{ color: authMode === 'signup' ? 'white' : '#EE0359', fontFamily: 'Alan Sans'}}
                className="font-bold text-base "
              >Registrate</Text>
            </TouchableOpacity> 
          </MotiView> 
          
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 300, delay: 100 }}
            className="w-full"
          >
            <BlurView intensity={20} tint="light" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <View 
                className="w-full p-4 rounded-2xl mb-4 border-2 flex-row items-center"
                style={{ 
                  backgroundColor: 'rgba(238, 3, 89, 0.25)', // #EE0359 con transparencia
                  borderColor: focusedInput === 'email' ? '#EE0359' : 'rgba(0,0,0,0.1)' 
                }}
              >
                <Feather name="mail" size={20} color="#9D046D" style={{ marginRight: 10 }} />
                <TextInput
                  style={{fontFamily: 'Alan Sans',}}
                  key="email-input"
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  className="flex-1 text-black text-lg font-semibold"
                  placeholder="Correo Electronico"
                  placeholderTextColor="#9D046D"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </BlurView>
            {authMode === 'signup' && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
            {authMode === 'login' && errors.email && (
              <Text style={styles.errorText}>{errors.email}</Text>
            )}
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateX: 50 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 500 }}
            className="w-full"
          >
            <BlurView intensity={20} tint="light" style={{ borderRadius: 16, overflow: 'hidden' }}>
              <View 
                className="w-full p-4 rounded-2xl mb-4 border-2 flex-row items-center"
                style={{ 
                  backgroundColor: 'rgba(238, 3, 89, 0.25)', // #EE0359 con transparencia
                  borderColor: focusedInput === 'password' ? '#EE0359' : 'rgba(0,0,0,0.1)' 
                }}
              >
                <Feather name="lock" size={20} color="#9D046D" style={{ marginRight: 10 }} />
              <TextInput
              style={{fontFamily: 'Alan Sans',}}
                key="email-input"
                onFocus={() => setFocusedInput('password')}
                onBlur={() => setFocusedInput(null)}
                className="flex-1 text-black text-lg font-semibold"
                placeholder="Contraseña"
                placeholderTextColor="#9D046D"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9D046D" />
              </TouchableOpacity>
            </View>
            </BlurView>
            {authMode === 'login' && errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}
          </MotiView>
          
          {/* --- NUEVA SECCIÓN DE REQUISITOS DE CONTRASEÑA --- */}
          {authMode === 'signup' && (
            <MotiView 
              className="w-full bg-black/5 p-3 rounded-2xl mb-4"
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', delay: 300 }}
            >
              {errors.password && authMode === 'signup' && (
                <Text style={[styles.errorText,{ marginBottom: 4 }]}>{errors.password}</Text>
              )}
              <PasswordRequirement met={password.length >= 8} text="Al menos 8 caracteres" />
              <PasswordRequirement met={/[A-Z]/.test(password)} text= "Al menos una mayúscula" />
              <PasswordRequirement met={/[a-z]/.test(password)} text="Al menos una minúscula" />
              <PasswordRequirement met={/[0-9]/.test(password)} text="Al menos un número" />
              <PasswordRequirement met={/[^A-Za-z0-9]/.test(password)} text="Al menos un caracter especial" />
            </MotiView>
          )}

          {authMode === 'signup' && (
             <MotiView
               from={{ opacity: 1, scale: 0.8 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ type: 'timing', duration: 300, delay: 200 }}
               className="w-full"
             >
               <View 
                  className="w-full p-4 rounded-2xl mb-6 border-2 flex-row items-center" 
                 style={{ borderColor: focusedInput === 'confirmPassword' ? '#9D046D' : 'transparent', backgroundColor: 'rgba(238, 3, 89, 0.25)'}}
               >
                 <Feather name="lock" size={20} color="#9D046D" style={{ marginRight: 10 }} />
                 <TextInput
                 style={{fontFamily: 'Alan Sans',}}
                   key="confirm-password-input"
                   onFocus={() => setFocusedInput('confirmPassword')}
                   onBlur={() => setFocusedInput(null)}
                   className="flex-1 text-black text-lg font-semibold"
                   placeholder="Confirmar contraseña"
                   placeholderTextColor="#9D046D"
                   value={confirmPassword}
                   onChangeText={setConfirmPassword}
                   secureTextEntry={!isPasswordVisible}
                 />
                 <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                   <Feather name={isPasswordVisible ? "eye-off" : "eye"} size={20} color="#9D046D" />
                 </TouchableOpacity>
               </View>
                {errors.confirmPassword && (
                  <Text style={styles.errorText}>{errors.confirmPassword}</Text>
                )}
             </MotiView>
          )}

          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'timing', duration: 400, delay: 600 }}
            className="w-full top-2"
          >
            <TouchableOpacity onPress={authMode === 'login' ? handleLogin : handleSignUp} style={{backgroundColor: '#9D046D'}} className="w-full p-4 rounded-2xl items-center mb-6 shadow-lg shadow-black/20">
              <Text style={{fontFamily: 'Alan Sans'}} className="text-white text-xl font-bold">
                {authMode === 'login' ? 'Inicia Sesion' : 'Registrate'}
              </Text>
            </TouchableOpacity>
          </MotiView>

          <MotiView
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: 'timing', duration: 500, delay: 700 }}
            className="w-full items-center"
          >
            <View className="flex-row items-center w-full mb-6">
              <View className="flex-1 h-px bg-white/30" />
              <Text style={{fontFamily: 'Alan Sans'}} className="text-black mx-4">
                {authMode === 'login' ? 'o inicia sesión con' : 'o regístrate con'} 
              </Text>
              <View className="flex-1 h-px bg-white" />
            </View>
            
            <TouchableOpacity onPress={handleGoogleSignIn} style={{backgroundColor: '#9D046D'}} className="w-full p-3 rounded-2xl flex-row justify-center items-center mb-14">
              <Image
                source={{ uri: 'https://img.icons8.com/color/48/google-logo.png' }} 
                className="w-6 h-6 mr-3"
              />
              <Text style={{fontFamily: 'Alan Sans'}} className="text-white text-lg font-semibold mx-2">Google</Text>
            </TouchableOpacity>

                  {authMode === 'login' && (
                      <Link href="/recuperacioncontrasena" asChild>
                          <TouchableOpacity className="mb-4 p-2"> 
                              <Text 
                                  className=" text-lg font-semibold underline" 
                                  style={{ color: '#9D046D' , fontFamily: 'Alan Sans'}} 
                              >
                                  ¿Olvidaste tu contraseña?
                              </Text>
                          </TouchableOpacity>
                      </Link>
                  )}
          </MotiView>

          <Link href = "/" asChild>
              <TouchableOpacity style={{backgroundColor: '#9D046D'}} className='text-zinc-500 text-lg mb-1 w-10/12 p-4 rounded-full items-center'>
                <Text style={{fontFamily: 'Alan Sans',}} className='text-white text-2xl font-semibold'>Regresar</Text>
              </TouchableOpacity>
              </Link>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: '#f87171', // rojo
    alignSelf: 'flex-start',
    marginLeft: 8,
    marginTop: -12, // Ajuste para que el error esté más cerca del input
  },
});

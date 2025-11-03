// En: app/(app)/RegisterArtesano.js -> Archivo de registro de artesano (Frontend)
// Este archivo es el encargado de mostrar el formulario de registro de artesano en la aplicación.
// Permite registrar un nuevo artesano en la aplicación mediante un formulario de registro.

// Importaciones
import React, { useState, useEffect } from 'react'; // Importa React y los hooks 'useState' y 'useEffect'.

import { 
  View, TextInput, Alert, StyleSheet, TouchableOpacity, Text, 
  ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native'; // Importa varios componentes de UI de React Native.
// duplicate import removed (consolidated above)
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa una librería de íconos.
import { useRouter } from 'expo-router'; // Usamos useRouter para la navegación con Expo Router
import { supabase } from '../../src/supabase/client'; // Importa el cliente de Supabase.
import { completeArtesanoRegistration } from '../../src/services/userService'; // Importa la función de servicio para el registro.
import { LinearGradient } from 'expo-linear-gradient'; // Para el fondo degradado
import { MotiView, MotiText } from 'moti'; // Para animaciones

export default function RegisterArtesano() { // Define y exporta el componente de la pantalla de registro.
  const router = useRouter(); // Hook de navegación de Expo Router

  // --- Estados del componente ---
  const [user, setUser] = useState(null); // Estado para guardar la información del usuario actual.
  const [initialLoading, setInitialLoading] = useState(true); // Estado para la pantalla de carga inicial.
  const [registerLoading, setRegisterLoading] = useState(false); // Estado para el botón de registro mientras se procesa.

  // --- Estados para los campos del formulario ---
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');

  // --- Estados para la UI ---
  const [focusedInput, setFocusedInput] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // Hook 'useEffect' que se ejecuta una sola vez cuando el componente se monta.
  useEffect(() => {
    // Define una función asíncrona para obtener los datos del usuario.
    const fetchUser = async () => {
      // Obtiene la sesión del usuario actual desde Supabase.
      const { data: { user } } = await supabase.auth.getUser();
      // Si existe un usuario, lo guarda en el estado.
      if (user) setUser(user);
      // Termina la carga inicial para mostrar el formulario.
      setInitialLoading(false);
    };
    fetchUser(); // Llama a la función para que se ejecute.
  }, []); // El array vacío asegura que el efecto solo se ejecute una vez.

  // Función para generar un número de folio aleatorio.
  const generarFolio = () => {
    // Crea un string con el prefijo 'FOL-' y una cadena alfanumérica aleatoria.
    const nuevoFolio = 'FOL-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    // Actualiza el estado del folio con el nuevo valor.
    setFolio(nuevoFolio);
  };

  // Función principal que maneja el envío del formulario de registro.
  const handleRegister = async () => {
    // Si ya se está registrando, detiene la función para evitar envíos múltiples.
    if (registerLoading) return;
    // Valida que las dos contraseñas ingresadas coincidan.
    if (password !== confirmPassword) return Alert.alert('Error', 'Las contraseñas no coinciden.');
    // Valida que todos los campos requeridos del formulario estén llenos.
    if (!nombre || !telefono || !password || !categoria || !ubicacion || !curp || !numero_ine || !folio) {
      return Alert.alert('Error', 'Por favor completa todos los campos obligatorios.');
    }

    // Inicia un bloque 'try...catch' para manejar errores durante el registro.
    try {
      setRegisterLoading(true); // Activa el estado de carga del botón.
      // Crea un objeto con todos los datos del formulario.
      const registrationData = {
        password, nombre, telefono, ubicacion, categoria, curp, numero_ine, folio
      };

      // Llama a la función del servicio, le pasa los datos y espera el resultado.
      const result = await completeArtesanoRegistration(registrationData);

      // Si el registro en el servicio fue exitoso.
      if (result.success) {
        // Muestra una alerta de éxito al usuario.
        Alert.alert(
          '¡Registro Exitoso!',
          'Tu cuenta de artesano ha sido creada exitosamente. Ahora crea tu contraseña definitiva.',
          [ // Define los botones de la alerta.
            {
              text: 'Continuar', // Texto del botón.
              // Al presionar, navega a la pantalla 'ChangePassword'.
              onPress: () => {
                router.push('/ChangePassword');
              },
            },
          ]
        );
      } else { // Si el registro falló (result.success es false).
        // Muestra una alerta con el mensaje de error que devolvió el servicio.
        Alert.alert('Error en el Registro', result.error || 'Ocurrió un error inesperado.');
      }
    } catch (error) { // Si ocurre un error de conexión o un problema crítico.
      // Muestra una alerta genérica de error crítico.
      Alert.alert('Error Crítico', 'No se pudo conectar con el servicio. Inténtalo de nuevo.');
    } finally { // Este bloque se ejecuta siempre, sin importar si hubo éxito o error.
      setRegisterLoading(false); // Desactiva el estado de carga del botón.
    }
  };

  // Renderizado condicional: si la carga inicial aún no ha terminado.
  if (initialLoading) {
    // Muestra una pantalla de carga.
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2575fc" />
        <Text style={styles.loadingText}>Cargando información...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#FDFAF1', '#FDFAF1']}
      style={styles.container}
    >
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <MotiText
              from={{ opacity: 0, translateY: -30 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 800 }}
              style={styles.title}
            >
              Completa tu Registro
            </MotiText>
            <MotiText
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ type: 'timing', duration: 800, delay: 200 }}
              style={styles.subtitle}
            >
              Estás a un paso de ser parte de nuestra comunidad de artesanos.
            </MotiText>

            {/* Email (deshabilitado) */}
            <View style={[styles.inputContainer, styles.disabledInput]}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#888" style={styles.icon} />
              <TextInput style={styles.input} value={user?.email} editable={false} />
            </View>

            {/* Nombre Completo */}
            <View style={[styles.inputContainer, focusedInput === 'nombre' && styles.inputFocused]}>
              <MaterialCommunityIcons name="account-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Nombre completo" placeholderTextColor="#9D046D" value={nombre} onChangeText={setNombre} onFocus={() => setFocusedInput('nombre')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Teléfono */}
            <View style={[styles.inputContainer, focusedInput === 'telefono' && styles.inputFocused]}>
              <MaterialCommunityIcons name="phone-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Número de teléfono" placeholderTextColor="#9D046D" value={telefono} onChangeText={setTelefono} keyboardType="phone-pad" onFocus={() => setFocusedInput('telefono')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Contraseña */}
            <View style={[styles.inputContainer, focusedInput === 'password' && styles.inputFocused]}>
              <MaterialCommunityIcons name="lock-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Crea una contraseña" placeholderTextColor="#9D046D" value={password} onChangeText={setPassword} secureTextEntry={!isPasswordVisible} onFocus={() => setFocusedInput('password')} onBlur={() => setFocusedInput(null)} />
              <TouchableOpacity onPress={() => setIsPasswordVisible(!isPasswordVisible)}>
                <MaterialCommunityIcons name={isPasswordVisible ? "eye-off-outline" : "eye-outline"} size={20} color="#9D046D" />
              </TouchableOpacity>
            </View>

            {/* Confirmar Contraseña */}
            <View style={[styles.inputContainer, focusedInput === 'confirmPassword' && styles.inputFocused]}>
              <MaterialCommunityIcons name="lock-check-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Confirma tu contraseña" placeholderTextColor="#9D046D" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!isPasswordVisible} onFocus={() => setFocusedInput('confirmPassword')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Categoría */}
            <View style={[styles.inputContainer, focusedInput === 'categoria' && styles.inputFocused]}>
              <MaterialCommunityIcons name="shape-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Categoría (ej. Textil, Alfarería)" placeholderTextColor="#9D046D" value={categoria} onChangeText={setCategoria} onFocus={() => setFocusedInput('categoria')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Ubicación */}
            <View style={[styles.inputContainer, focusedInput === 'ubicacion' && styles.inputFocused]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Ubicación (ej. Oaxaca, México)" placeholderTextColor="#9D046D" value={ubicacion} onChangeText={setUbicacion} onFocus={() => setFocusedInput('ubicacion')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* CURP */}
            <View style={[styles.inputContainer, focusedInput === 'curp' && styles.inputFocused]}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="CURP" placeholderTextColor="#9D046D" value={curp} onChangeText={setCurp} autoCapitalize="characters" onFocus={() => setFocusedInput('curp')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* INE */}
            <View style={[styles.inputContainer, focusedInput === 'ine' && styles.inputFocused]}>
              <MaterialCommunityIcons name="card-account-details-star-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Número de Identificación (INE)" placeholderTextColor="#9D046D" value={numero_ine} onChangeText={setNumero_Ine} onFocus={() => setFocusedInput('ine')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Folio */}
            <View style={[styles.inputContainer, focusedInput === 'folio' && styles.inputFocused]}>
              <MaterialCommunityIcons name="pound" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Folio" placeholderTextColor="#9D046D" value={folio} onChangeText={setFolio} onFocus={() => setFocusedInput('folio')} onBlur={() => setFocusedInput(null)} />
              <TouchableOpacity onPress={generarFolio} style={styles.generateButton}>
                <MaterialCommunityIcons name="auto-fix" size={24} color="#9D046D" />
              </TouchableOpacity>
            </View>

            <MotiView
              from={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500, delay: 400 }}
              style={{ width: '100%', marginTop: 20 }}
            >
              <TouchableOpacity
                style={[styles.button, registerLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={registerLoading}
              >
                {registerLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Finalizar Registro</Text>
                )}
              </TouchableOpacity>
            </MotiView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FDFAF1',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: 'rgba(238, 3, 89, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  inputFocused: {
    borderColor: '#9D046D',
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  disabledInput: {
    backgroundColor: '#f0f0f0',
    color: '#888',
  },
  generateButton: {
    padding: 5,
  },
  button: {
    width: '100%',
    backgroundColor: '#9D046D',
    padding: 15,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

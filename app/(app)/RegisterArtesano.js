// En: app/(app)/RegisterArtesano.js -> Archivo de registro de artesano (Frontend)
// Este archivo es el encargado de mostrar el formulario de registro de artesano en la aplicación.
// Permite registrar un nuevo artesano en la aplicación mediante un formulario de registro.
// Importaciones
import React, { useState, useEffect } from 'react';

import { 
  View, TextInput, Alert, StyleSheet, TouchableOpacity, Text, 
  ScrollView, ActivityIndicator, SafeAreaView, KeyboardAvoidingView, Platform
} from 'react-native'; // Importa varios componentes de UI de React Native.
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importa una librería de íconos.
import { useRouter } from 'expo-router'; // Usamos useRouter para la navegación con Expo Router
import { supabase } from '../../src/supabase/client'; // Importa el cliente de Supabase.
import { completeArtesanoRegistration } from '../../src/services/userService'; // Importa la función de servicio para el registro.
import { LinearGradient } from 'expo-linear-gradient'; // Para el fondo degradado
import { MotiView, MotiText } from 'moti'; // Para animaciones
import { Modal, FlatList } from 'react-native';

const CATEGORIAS_EJEMPLO = [
  'Textil', 'Alfarería', 'Joyería', 
  'Madera', 'Piel', 'Piedra', 'Vidrio', 
  'Metal', 'Cerámica', 'Cestería', 
  'Fibras', 'Minerales', 'Otro'
];

export default function RegisterArtesano() { // Define y exporta el componente de la pantalla de registro.
  const router = useRouter(); // Hook de navegación de Expo Router

  // --- Estados del componente ---
  const [user, setUser] = useState(null); // Estado para guardar la información del usuario actual.
  const [initialLoading, setInitialLoading] = useState(true); // Estado para la pantalla de carga inicial.
  const [registerLoading, setRegisterLoading] = useState(false); // Estado para el botón de registro mientras se procesa.

  // --- Estados para los campos del formulario ---
  const [nombre, setNombre] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [linkUbicacion, setLinkUbicacion] = useState(''); // Nuevo estado para el enlace de ubicación
  const [categoria, setCategoria] = useState('');
  const [curp, setCurp] = useState('');
  const [telefono, setTelefono] = useState('');
  const [numero_ine, setNumero_Ine] = useState('');
  const [folio, setFolio] = useState('');

  // --- Estados para la UI ---
  const [focusedInput, setFocusedInput] = useState(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

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
    const finalCategory = categoria === 'Otro' ? customCategory : categoria;

    // Valida que todos los campos requeridos del formulario estén llenos.
    if (!nombre || !telefono || !finalCategory || !ubicacion || !linkUbicacion || !curp || !numero_ine || !folio) {
      return Alert.alert('Error', 'Por favor, completa todos los campos obligatorios.');
    }

    // Inicia un bloque 'try...catch' para manejar errores durante el registro.
    try {
      setRegisterLoading(true); // Activa el estado de carga del botón.

      const registrationData = {
        nombre, telefono, ubicacion, link_ubicacion: linkUbicacion, 
        categoria: finalCategory, curp, numero_ine, folio
      };

      // Llama a la función del servicio, le pasa los datos y espera el resultado.
      const result = await completeArtesanoRegistration(registrationData);

      // Verificar que result existe
      if (!result) {
        Alert.alert('Error', 'No se recibió respuesta del servidor. Por favor intenta de nuevo.');
        return;
      }

      // Si el registro en el servicio fue exitoso.
      if (result && result.success) {
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
        const errorMessage = result?.error || 'Ocurrió un error inesperado. Por favor intenta de nuevo.';
        Alert.alert('Error en el Registro', errorMessage);
      }
    } catch (error) { // Si ocurre un error de conexión o un problema crítico.
      // Muestra el mensaje de error específico si está disponible
      const errorMessage = error?.message || error?.toString() || 'No se pudo conectar con el servicio. Inténtalo de nuevo.';
      Alert.alert('Error Crítico', errorMessage);
    } finally { // Este bloque se ejecuta siempre, sin importar si hubo éxito o error.
      setRegisterLoading(false); // Desactiva el estado de carga del botón.
    }
  };

  const handleSelectCategory = (selected) => {
    setCategoria(selected);
    setCategoryModalVisible(false);
    if (selected !== 'Otro') {
      setCustomCategory('');
    }
  };

  const finalCategory = categoria === 'Otro' ? customCategory : categoria;

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

            {/* Categoría */}
            <TouchableOpacity 
              style={[styles.inputContainer, focusedInput === 'categoria' && styles.inputFocused]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <MaterialCommunityIcons name="shape-outline" size={20} color="#9D046D" style={styles.icon} />
              <Text style={[styles.inputText, { color: categoria ? '#333' : '#9D046D' }]}>
                {categoria || 'Categoría (ej. Textil, Alfarería)'}
              </Text>
            </TouchableOpacity>

            {/* Campo para categoría "Otro" */}
            {categoria === 'Otro' && (
            <View style={[styles.inputContainer, focusedInput === 'customCategory' && styles.inputFocused]}>
              <MaterialCommunityIcons name="pencil-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Escribe tu categoría" placeholderTextColor="#9D046D" value={customCategory} onChangeText={setCustomCategory} onFocus={() => setFocusedInput('customCategory')} onBlur={() => setFocusedInput(null)} />
            </View>
            )}

            {/* Ubicación */}
            <View style={[styles.inputContainer, focusedInput === 'ubicacion' && styles.inputFocused]}>
              <MaterialCommunityIcons name="map-marker-outline" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Ubicación (ej. Oaxaca, México)" placeholderTextColor="#9D046D" value={ubicacion} onChangeText={setUbicacion} onFocus={() => setFocusedInput('ubicacion')} onBlur={() => setFocusedInput(null)} />
            </View>

            {/* Ubicación Link */}
            <View style={[styles.inputContainer, focusedInput === 'linkUbicacion' && styles.inputFocused]}>
              <MaterialCommunityIcons name="link" size={20} color="#9D046D" style={styles.icon} />
              <TextInput style={styles.input} placeholder="Ubicación (Enlace de Google Maps)" placeholderTextColor="#9D046D" value={linkUbicacion} onChangeText={setLinkUbicacion} onFocus={() => setFocusedInput('linkUbicacion')} onBlur={() => setFocusedInput(null)} keyboardType="url" autoCapitalize="none" />
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

        <Modal
          animationType="slide"
          transparent={true}
          visible={isCategoryModalVisible}
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Selecciona una Categoría</Text>
              <FlatList
                data={CATEGORIAS_EJEMPLO}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.modalItem} onPress={() => handleSelectCategory(item)}>
                    <Text style={styles.modalItemText}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
              <TouchableOpacity style={styles.modalCloseButton} onPress={() => setCategoryModalVisible(false)}>
                <Text style={styles.modalCloseButtonText}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
  inputText: { // Estilo nuevo para el texto que simula un input
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 15, // Añadimos padding vertical para simular la altura
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalItem: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalItemText: {
    fontSize: 16,
    textAlign: 'center',
  },
  modalCloseButton: {
    marginTop: 20,
    backgroundColor: '#9D046D',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
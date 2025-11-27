// En: app/(app)/MagicLink.js -> Archivo de invitación de enlace mágico (Frontend)
// Este archivo es el encargado de mostrar el formulario de invitación de enlace mágico en la aplicación.
// Permite invitar a un nuevo artesano a la aplicación mediante un correo electrónico.

// Importaciones
import React, { useState } from 'react'; // Importa React y el hook 'useState' para manejar el estado del componente.
import { View, TextInput, Text as DefaultText, TouchableOpacity, Alert, StyleSheet, Text, ActivityIndicator, SafeAreaView } from 'react-native'; // Importa componentes visuales básicos de React Native.
import { sendArtesanoInvite } from '../../src/services/userService'; // Importa la función específica para enviar invitaciones desde un archivo de servicios.
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importamos íconos

// Componente principal
export default function InviteArtesano() { // Define y exporta el componente de la pantalla para invitar artesanos.
  const [email, setEmail] = useState(''); // Crea un estado para almacenar el correo electrónico que el usuario escribe en el campo de texto.
  const [loading, setLoading] = useState(false); // Crea un estado para gestionar la visualización de un indicador de carga mientras se envía la invitación.

  const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );
  // Define la función asíncrona que se llamará al presionar el botón de enviar.
  const handleSendInvite = async () => {
    // Verifica si la variable de estado 'email' está vacía.
    if (!email) {
      // Si está vacía, muestra una alerta pidiendo al usuario que ingrese un correo.
      Alert.alert('Error', 'Por favor, introduce un correo electrónico.');
      // Detiene la ejecución de la función para no continuar.
      return;
    }
    
    // Si hay un correo, establece el estado de carga a 'true' para, por ejemplo, desactivar el botón o mostrar un spinner.
    setLoading(true);

    // Inicia un bloque 'try...catch' para manejar errores que puedan ocurrir al llamar al servicio.
    try {
      // Llama a la función 'sendArtesanoInvite' y espera a que termine. Le pasa el email del estado.
      await sendArtesanoInvite(email);
      // Si la función anterior no arrojó un error, muestra una alerta de éxito.
      Alert.alert('Éxito', `Se ha enviado un enlace de registro a ${email}.`);
      // Limpia el campo de texto reseteando el estado 'email' a una cadena vacía.
      setEmail('');
    } catch (error) { // Si ocurre un error en el bloque 'try', el código dentro de 'catch' se ejecuta.
      // Muestra una alerta de error con el mensaje que devuelve el objeto 'error'.
      Alert.alert('Error', error.message);
    }
    
    // Esta línea se ejecuta tanto si hubo éxito como si hubo error.
    // Regresa el estado de carga a 'false' para indicar que el proceso ha finalizado.
    setLoading(false);
  };

  return (
    // Contenedor principal con fondo gris claro
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Tarjeta blanca que contiene todo */}
        <View style={styles.card}>
          
          <Text style={styles.title}>Invita a un nuevo artesano</Text>

          {/* Campo de Email con nuevo estilo (blanco) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Correo Electrónico</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="email-outline" size={20} color="#8E8E93" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="correo.artesano@ejemplo.com" // Placeholder actualizado
                placeholderTextColor="#BDBDBD" // Color de placeholder más claro
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Nuevo texto descriptivo */}
          <Text style={styles.description}>
            Ayuda a crecer nuestra comunidad de talentos
          </Text>

          {/* Botón con texto actualizado */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSendInvite}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" /> // Spinner para el estado de carga
            ) : (
              <>
                <Text style={styles.buttonText}>
                  Enviar Invitación
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={22} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // NUEVO: SafeArea para evitar notches
  safeArea: {
    flex: 1,
    backgroundColor: '#f0f2f5', // Fondo gris claro de la imagen
  },
  // MODIFICADO: Contenedor principal
  container: { 
    flex: 1, 
    justifyContent: 'center', // Centra la tarjeta verticalmente
    padding: 20, // Espacio alrededor de la tarjeta
  },
  // NUEVO: Tarjeta blanca
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24, // Borde redondeado de la tarjeta
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 5,
  },
  // MODIFICADO: Título
  title: { 
    fontSize: 24, // Tamaño de la imagen
    fontWeight: 'bold', 
    textAlign: 'left', // Alineado a la izquierda
    marginBottom: 25, 
    color: '#333',
    // Se quitó el marginTop: 40
  },
  // MODIFICADO: Grupo de input
  inputGroup: {
    width: '100%',
    marginBottom: 20, // Espacio antes de la descripción
  },
  // MODIFICADO: Etiqueta de input
  inputLabel: {
    fontSize: 14,
    color: '#666', // Color de etiqueta
    marginBottom: 8,
  },
  // MODIFICADO: Contenedor de input
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // Fondo blanco
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1, // Borde como en la imagen
    borderColor: '#E0E0E0', // Color de borde claro
  },
  inputIcon: {
    marginRight: 10,
  },
  // MODIFICADO: Input
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333', // Texto que escribe el usuario (oscuro)
  },
  // NUEVO: Texto descriptivo
  description: {
    fontSize: 14,
    color: '#666',
    textAlign: 'left',
    marginBottom: 30, // Espacio antes del botón
    lineHeight: 21, // Espaciado de línea
  },
  // MODIFICADO: Botón
  button: {
    backgroundColor: '#9D046D', // COLOR DE BOTÓN SIN CAMBIOS
    paddingVertical: 16, // Ligeramente más alto
    borderRadius: 16, 
    alignItems: 'center',
    elevation: 3,
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: 20, 
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
    elevation: 0,
    justifyContent: 'center' 
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
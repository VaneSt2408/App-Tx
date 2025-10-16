// En: src/pages/InviteArtesano.js
import React, { useState } from 'react'; // Importa React y el hook 'useState' para manejar el estado del componente.
import { View, TextInput, Button, Alert, StyleSheet, Text } from 'react-native'; // Importa componentes visuales básicos de React Native.
import { sendArtesanoInvite } from '../services/userService'; // Importa la función específica para enviar invitaciones desde un archivo de servicios.

export default function InviteArtesano() { // Define y exporta el componente de la pantalla para invitar artesanos.
  const [email, setEmail] = useState(''); // Crea un estado para almacenar el correo electrónico que el usuario escribe en el campo de texto.
  const [loading, setLoading] = useState(false); // Crea un estado para gestionar la visualización de un indicador de carga mientras se envía la invitación.

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
    <View style={styles.container}>
      <Text style={styles.title}>Invitar a un Nuevo Artesano</Text>
      <TextInput
        style={styles.input}
        placeholder="Correo del nuevo artesano"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <Button 
        title={loading ? "Enviando..." : "Enviar Enlace de Registro"} 
        onPress={handleSendInvite} 
        disabled={loading} 
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  title: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 20, borderRadius: 8 },
});
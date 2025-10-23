import React, { useState } from 'react';
import { View, TextInput, Button, Text, Alert, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../supabase/client';
import { createClientProfile } from '../services/authService';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values'; // Necesario para generar UUIDs para las imágenes
import { decode } from 'base64-arraybuffer'; // Librería para decodificar la imagen a un formato que Supabase entiende

// --- Componente reutilizable para mostrar y seleccionar el avatar ---
const Avatar = ({ url, onUpload, loading }) => {
    return (
        // Hacemos que toda el área sea presionable para seleccionar una imagen
        <TouchableOpacity onPress={onUpload} style={styles.avatarContainer} disabled={loading}>
            {url ? (
                // Si ya hay una imagen seleccionada, la mostramos
                <Image source={{ uri: url }} style={styles.avatarImage} />
            ) : (
                // Si no, mostramos un placeholder
                <View style={[styles.avatarImage, styles.avatarPlaceholder]}>
                    <Text style={styles.avatarPlaceholderText}>Añadir Foto</Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

export default function CompleteProfilePage({ route }) {
    // Recibimos la función para notificar a App.js que el perfil se completó
    const { onProfileComplete } = route.params;
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState(null); // Estado para guardar la información de la imagen seleccionada

    // --- Función para abrir la galería del teléfono ---
    const pickImage = async () => {
        // Pedimos permiso para acceder a la galería
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permisos necesarios', 'Se necesita acceso a la galería para seleccionar una foto.');
            return;
        }

        // Abrimos el selector de imágenes
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true, // Permite al usuario recortar la imagen
            aspect: [1, 1],      // Fuerza un recorte cuadrado
            quality: 0.5,        // Comprime la imagen para que no sea muy pesada
            base64: true,        // ¡Crucial! Pedimos la imagen en formato base64 para poder subirla
        });

        if (!result.canceled) {
            // Guardamos el objeto completo de la imagen en el estado
            setImage(result.assets[0]);
        }
    };

    // --- Lógica principal para guardar el perfil ---
    const handleCompleteProfile = async () => {
        if (!fullName) {
            Alert.alert('Error', 'Tu nombre completo es requerido.');
            return;
        }

        setLoading(true);

        try {
            // Obtenemos el ID del usuario que ya tiene una sesión activa
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('No se encontró la sesión del usuario.');

            let avatarUrl = null;

            // --- Subida de la imagen (si se seleccionó una) ---
            if (image) {
                const fileExt = image.uri.split('.').pop();
                const fileName = `${Date.now()}.${fileExt}`;
                const filePath = `${user.id}/${fileName}`; // Guardamos la imagen en una carpeta con el ID del usuario
                
                // Subimos la imagen decodificada al bucket 'avatars'
                const { error: uploadError } = await supabase.storage
                    .from('avatars')
                    .upload(filePath, decode(image.base64), {
                        contentType: image.mimeType ?? 'image/jpeg',
                    });

                if (uploadError) throw uploadError;

                // Si la subida fue exitosa, obtenemos la URL pública de la imagen
                const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
                avatarUrl = urlData.publicUrl;
            }

            // --- Guardado del perfil en la tabla 'clientes' ---
            // Llamamos a nuestra función de servicio con todos los datos
            const { error: profileError } = await createClientProfile(user.id, fullName, phone, avatarUrl);
            if (profileError) throw profileError;

            Alert.alert('¡Éxito!', 'Tu perfil ha sido completado.');
            onProfileComplete(); // Notificamos a App.js para que refresque la navegación

        } catch (error) {
            Alert.alert('Error', 'No se pudo guardar tu perfil. Inténtalo de nuevo. ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={["#6a11cb", "#2575fc"]} style={styles.gradient}>
            <View style={styles.card}>
                <Text style={styles.title}>Completa tu Perfil</Text>
                
                <Avatar url={image?.uri} onUpload={pickImage} loading={loading} />

                <TextInput style={styles.input} placeholder="Nombre Completo" value={fullName} onChangeText={setFullName} autoCapitalize="words" placeholderTextColor="#888" />
                <TextInput style={styles.input} placeholder="Teléfono (Opcional)" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor="#888" />
                
                <View style={styles.buttonContainer}>
                    {loading ? <ActivityIndicator size="small" color="#fff" /> : <Button title="Finalizar Registro" color="#2575fc" onPress={handleCompleteProfile} />}
                </View>
            </View>
        </LinearGradient>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({
    gradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    card: { backgroundColor: 'rgba(255,255,255,0.95)', padding: 24, borderRadius: 16, width: '90%', alignItems: 'center' },
    title: { fontSize: 28, fontWeight: 'bold', marginBottom: 20, color: '#2575fc' },
    input: { width: '100%', borderWidth: 1, borderColor: '#ccc', padding: 12, marginBottom: 16, borderRadius: 8, fontSize: 16 },
    buttonContainer: { width: '100%', marginTop: 8, backgroundColor: '#2575fc', borderRadius: 8, overflow: 'hidden' },
    avatarContainer: { marginBottom: 20, alignItems: 'center' },
    avatarImage: { width: 120, height: 120, borderRadius: 60, borderWidth: 2, borderColor: '#2575fc' },
    avatarPlaceholder: { backgroundColor: '#e1e1e1', justifyContent: 'center', alignItems: 'center' },
    avatarPlaceholderText: { color: '#555' },
});

// En: app/(app)/CompleteArtesanoProfile.js -> Archivo para completar el perfil del artesano (Frontend)
// Este archivo es el encargado de mostrar el formulario para que el artesano complete su perfil.

// Importaciones
import React, { useState } from 'react';
import { View, TextInput, Image, StyleSheet, Alert, ActivityIndicator, ScrollView, Text as DefaultText, TouchableOpacity, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { completeArtesanoProfile } from '../../src/services/userService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
);

// Componente principal
export default function CompleteArtesanoProfile() {
    const router = useRouter();
    const [description, setDescription] = useState('');
    const [imageAsset, setImageAsset] = useState(null); // Guardará el objeto de imagen seleccionado
    const [loading, setLoading] = useState(false);

    // Función para seleccionar imagen de la galería
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso necesario', 'Se necesita acceso a la galería para seleccionar tu foto de perfil.');
            return;
        }
        
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1], // Foto de perfil cuadrada
            quality: 0.8,
            base64: true, // ¡Importante para subir!
        });

        if (!result.canceled) {
            setImageAsset(result.assets[0]);
        }
    };

    // Función para manejar la finalización del perfil
    const handleCompleteProfile = async () => {
        if (!description.trim()) {
            Alert.alert('Descripción requerida', 'Por favor, escribe algo sobre ti y tu trabajo.');
            return;
        }
        if (!imageAsset) {
            Alert.alert('Foto de perfil requerida', 'Por favor, selecciona una foto para tu perfil.');
            return;
        }

        setLoading(true);
        try {
            const result = await completeArtesanoProfile({ descripcion: description }, imageAsset);

            if (result.success) {
                Alert.alert('¡Perfil Completo!', 'Tu perfil ha sido actualizado. ¡Bienvenido/a!');
                router.replace('/(app)/ArtesanoSettings'); // Redirigir al panel de control
            } else {
                throw new Error(result.error || 'No se pudo completar el perfil.');
            }

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.title}>Un último paso...</Text>
                <Text style={styles.subtitle}>Completa tu perfil para que la comunidad pueda conocerte mejor.</Text>

                {/* Selector de imagen */}
                <TouchableOpacity style={styles.imagePicker} onPress={pickImage}>
                    {imageAsset ? (
                        <Image source={{ uri: imageAsset.uri }} style={styles.imagePreview} />
                    ) : (
                        <View style={styles.imagePlaceholder}>
                            <MaterialCommunityIcons name="camera-plus-outline" size={48} color="#9D046D" />
                            <Text style={styles.imagePickerText}>Añadir Foto de Perfil</Text>
                        </View>
                    )}
                </TouchableOpacity>

                {/* Input para la descripción */}
                <TextInput
                    style={styles.textInput}
                    placeholder="Cuéntanos sobre ti, tu inspiración y tu técnica artesanal..."
                    placeholderTextColor="rgba(0,0,0,0.3)"
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                {/* Botón de finalizar */}
                <TouchableOpacity
                    style={[styles.publishButton, loading && styles.disabledButton]}
                    onPress={handleCompleteProfile}
                    disabled={loading}
                >
                    {loading ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <Text style={styles.publishButtonText}>Finalizar Perfil</Text>
                    )}
                </TouchableOpacity>

            </ScrollView>
        </SafeAreaView>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FDFAF1',
    },
    scrollContent: {
        padding: 20,
        alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      marginBottom: 10,
      textAlign: 'center',
      color: '#333',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 30,
    },
    imagePicker: {
        width: 150,
        height: 150,
        borderRadius: 75,
        backgroundColor: 'rgba(157, 4, 109, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 30,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#9D046D',
        borderStyle: 'dashed',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    imagePickerText: {
        marginTop: 8,
        color: '#9D046D',
    },
    textInput: {
        width: '100%',
        minHeight: 120,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 12,
        padding: 15,
        marginBottom: 30,
        fontSize: 16,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    publishButton: {
        width: '100%',
        backgroundColor: '#9D046D',
        padding: 15,
        borderRadius: 16,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    publishButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
// En: app/(app)/CreatePostPage.js -> Archivo de creación de publicación (Frontend)
// Este archivo es el encargado de mostrar el formulario de creación de publicación en la aplicación.
// Permite crear una nueva publicación con texto y una imagen.

// Importaciones
import React, { useState } from 'react';
import { View, TextInput, Button, Image, StyleSheet, Alert, ActivityIndicator, ScrollView, Text as DefaultText, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { 
  createPostForCurrentUser, 
  selectMultipleAndCompressImages // 1. Importamos la función de selección
} from '../../src/services/PublicacionService';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
  );

// Componente principal
export default function CreatePostPage() {
    const router = useRouter();
    const [text, setText] = useState('');
    const [selectedImages, setSelectedImages] = useState([]); // 2. Estado para múltiples imágenes
    const [loading, setLoading] = useState(false);
    const MAX_IMAGES = 5; // Límite de imágenes

    // 3. Función para AÑADIR una imagen a la galería
    const handleAddImage = async () => {
        if (selectedImages.length >= MAX_IMAGES) {
            Alert.alert('Límite alcanzado', `Puedes subir un máximo de ${MAX_IMAGES} imágenes.`);
            return;
        }
        // Usamos la función del servicio que ya comprime y recorta
        const newImageAssets = await selectMultipleAndCompressImages();
        if (newImageAssets && newImageAssets.length > 0) {
            setSelectedImages(prevImages => [...prevImages, ...newImageAssets]);
        }
    };

    // 4. Función para QUITAR una imagen de la galería
    const handleRemoveImage = (indexToRemove) => {
        setSelectedImages(prevImages => prevImages.filter((_, index) => index !== indexToRemove));
    };

    // Función para manejar la publicación
    const handlePublish = async () => {
        if (!text.trim() && selectedImages.length === 0) {
            Alert.alert('Publicación vacía', 'Escribe algo o añade al menos una imagen.');
            return;
        }

        setLoading(true);
        try {
            // 5. Enviamos el array completo de imágenes
            await createPostForCurrentUser(text, selectedImages);

            Alert.alert('Éxito', 'Publicación creada correctamente.');
            router.back(); // Regresa a la pantalla anterior

        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo crear la publicación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 50 }}>
            <Text style={styles.title}>Crear Nueva Publicación</Text>

            {/* Input para el texto */}
            <TextInput
                style={styles.textInput}
                placeholder="¿Qué estás pensando?"
                placeholderTextColor="rgba(0,0,0,0.3)"
                multiline
                value={text}
                maxLength={2000}
                onChangeText={setText}
            />
            <Text style={styles.characterCount}>
              {text.length}/2000 caracteres
            </Text>

            {/* 6. Galería de imágenes seleccionadas */}
            <Text style={styles.label}>Imágenes (hasta {MAX_IMAGES})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryContainer}>
                {selectedImages.map((asset, index) => (
                    <View key={index} style={styles.imagePreviewContainer}>
                        <Image source={{ uri: asset.uri }} style={styles.imagePreview} />
                        <TouchableOpacity style={styles.removeImageButton} onPress={() => handleRemoveImage(index)}>
                            <MaterialCommunityIcons name="close-circle" size={24} color="#fff" />
                        </TouchableOpacity>
                    </View>
                ))}
                {/* Botón para añadir más imágenes */}
                {selectedImages.length < MAX_IMAGES && (
                    <TouchableOpacity style={styles.addImageButton} onPress={handleAddImage}>
                        <MaterialCommunityIcons name="camera-plus" size={32} color="#9D046D" />
                        <Text style={styles.addImageText}>Añadir</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {/* Botón de publicar */}
            <View style={styles.publishButtonContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#9D046D" />
                ) : (
                    <Button title="Publicar" onPress={handlePublish} color="#9D046D" />
                )}
            </View>

        </ScrollView>
    );
}

// --- Estilos ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f8f9fa',
    },
    title: {
      fontSize: 22,
      fontWeight: 'bold',
      marginBottom: 20,
      textAlign: 'center',
      color: '#333',
    },
    textInput: {
        minHeight: 100,
        borderWidth: 1,
        borderColor: '#ced4da',
        borderRadius: 8,
        padding: 15,
        marginBottom: 20,
        fontSize: 16,
        textAlignVertical: 'top', // Para que el texto empiece arriba en multiline (Android)
        backgroundColor: '#fff',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    galleryContainer: {
        marginBottom: 20,
    },
    imagePreviewContainer: {
        width: 100,
        height: 100,
        marginRight: 10,
        position: 'relative',
    },
    imagePreview: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
    },
    removeImageButton: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
    },
    addImageButton: {
        width: 100,
        height: 100,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f0f0f0',
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#ddd',
        borderStyle: 'dashed',
    },
    addImageText: {
        fontSize: 12,
        color: '#9D046D',
        marginTop: 4,
    },
    publishButtonContainer: {
        marginTop: 10,
        marginBottom: 30,
    },
    characterCount: {
        fontSize: 12,
        color: '#666',
        textAlign: 'right',
        marginTop: -15, // Ajuste para que quede pegado al input
        marginBottom: 20,
    },
});

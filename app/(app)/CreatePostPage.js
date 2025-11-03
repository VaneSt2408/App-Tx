// En: app/(app)/CreatePostPage.js -> Archivo de creación de publicación (Frontend)
// Este archivo es el encargado de mostrar el formulario de creación de publicación en la aplicación.
// Permite crear una nueva publicación con texto y una imagen.

// Importaciones
import React, { useState } from 'react';
import { View, TextInput, Button, Image, StyleSheet, Alert, ActivityIndicator, ScrollView, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { createPostForCurrentUser } from '../../src/services/PublicacionService';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Para el icono de imagen

// Componente principal
export default function CreatePostPage() {
    const navigation = useNavigation(); // Obtener el navigation
    const [text, setText] = useState(''); // Establecer el estado del texto
    const [image, setImage] = useState(null); // Guardará el objeto de imagen seleccionado
    const [loading, setLoading] = useState(false); // Establecer el estado de carga

    // Función para seleccionar imagen de la galería
    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso necesario', 'Se necesita acceso a la galería.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [4, 3], // Proporción común para posts
            quality: 0.7,
            base64: true, // ¡Importante para subir!
        });

        if (!result.canceled) {
            setImage(result.assets[0]);
        }
    };

    // Función para manejar la publicación
    const handlePublish = async () => {
        setLoading(true);
        try {
            await createPostForCurrentUser(text, image);

            Alert.alert('Éxito', 'Publicación creada correctamente.');
            navigation.goBack(); // Regresa a la pantalla anterior

        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo crear la publicación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <Text style={styles.title}>Crear Nueva Publicación</Text>

            {/* Input para el texto */}
            <TextInput
                style={styles.textInput}
                placeholder="¿Qué estás pensando?"
                placeholderTextColor="#000"
                multiline
                value={text}
                onChangeText={setText}
            />

            {/* Previsualización de la imagen seleccionada */}
            {image && (
                <View style={styles.imagePreviewContainer}>
                    <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                    {/* Botón para quitar la imagen seleccionada */}
                    <TouchableOpacity style={styles.removeImageButton} onPress={() => setImage(null)}>
                         <MaterialCommunityIcons name="close-circle" size={24} color="rgba(0,0,0,0.6)" />
                    </TouchableOpacity>
                </View>
            )}

            {/* Botón para seleccionar imagen */}
            <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <MaterialCommunityIcons name="image-plus" size={24} color="#2575fc" />
                <Text style={styles.imagePickerText}>Añadir Foto</Text>
            </TouchableOpacity>

            {/* Botón de publicar */}
            <View style={styles.publishButtonContainer}>
                {loading ? (
                    <ActivityIndicator size="large" color="#2575fc" />
                ) : (
                    <Button title="Publicar" onPress={handlePublish} color="#2575fc" />
                )}
            </View>

             {/* Botón para regresar (alternativa al header) */}
             {/* <Button title="Cancelar" onPress={() => navigation.goBack()} color="#888" /> */}

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
    imagePickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e9ecef',
        paddingVertical: 12,
        paddingHorizontal: 15,
        borderRadius: 8,
        marginBottom: 20,
        justifyContent: 'center',
    },
    imagePickerText: {
        marginLeft: 10,
        fontSize: 16,
        color: '#2575fc',
        fontWeight: '500',
    },
    imagePreviewContainer: {
        marginBottom: 20,
        alignItems: 'center',
        position: 'relative', // Necesario para posicionar el botón de eliminar
    },
    imagePreview: {
        width: '100%',
        height: 200, // Ajusta según necesites
        borderRadius: 8,
        resizeMode: 'cover', // Para que la imagen cubra el área sin distorsionarse
    },
    removeImageButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderRadius: 12,
        padding: 2,
    },
    publishButtonContainer: {
        marginTop: 10,
        marginBottom: 30, // Espacio al final
    },
});

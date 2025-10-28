// En: src/pages/ArtPage.js
import React, { useEffect, useState } from 'react';
import { 
    View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, 
    TextInput, Image, Button, Alert, ScrollView 
} from 'react-native';
import { signOut } from '../services/authService';
import { supabase } from '../supabase/client';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy'; // Mantienes 'legacy' si te funciona

function ArtPage() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true); // Se pondrá en false al final de la carga
    const [uploading, setUploading] = useState(false);

    // Estados que coinciden con tu tabla 'infousuario'
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [telefono, setTelefono] = useState('');
    const [image, setImage] = useState(null); // 'image' guardará la URI (local o remota)

    // --- MODIFICACIÓN 1: useEffect mejorado para cargar datos existentes ---
    useEffect(() => {
        const fetchUserData = async () => {
            setLoading(true); // Aseguramos que el loading esté activo
            
            // 1. Obtener el usuario de autenticación
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setUser(user);
                
                // 2. Obtener el perfil de la tabla 'infousuario'
                try {
                    const { data: profile, error } = await supabase
                        .from('infousuario')
                        .select('nombre, descripcion, telefono, avatar_url')
                        .eq('user_id', user.id)
                        .single(); // .single() espera solo una fila (o ninguna)

                    if (error && error.code !== 'PGRST116') { 
                        // PGRST116 significa 'No rows found', lo cual no es un error,
                        // simplemente el usuario es nuevo y no tiene perfil.
                        throw error;
                    }

                    // 3. Si encontramos un perfil, actualizamos el estado
                    if (profile) {
                        setNombre(profile.nombre || '');
                        setDescripcion(profile.descripcion || '');
                        setTelefono(profile.telefono || '');
                        setImage(profile.avatar_url || null); // Cargamos la URL de la imagen
                    }

                } catch (error) {
                    Alert.alert('Error al cargar el perfil', error.message);
                }

            } else {
                // No hay usuario, quizás manejar el logout
            }

            setLoading(false); // Terminamos de cargar
        };
        
        fetchUserData();
    }, []); // Se ejecuta solo una vez al montar el componente

    const handleLogout = async () => {
        await signOut();
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitas conceder acceso a tu galería.');
            return;
        }

        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaType.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled) {
            // Guardamos la URI *local* del archivo seleccionado
            setImage(result.assets[0].uri); 
        }
    };

    // --- MODIFICACIÓN 2: saveProfile mejorado para manejar la imagen ---
    const saveProfile = async () => {
        if (!nombre.trim() || !descripcion.trim() || !telefono.trim()) {
            Alert.alert('Campos incompletos', 'Por favor, rellena todos los campos.');
            return;
        }
        if (!image) {
            Alert.alert('Falta la imagen', 'Por favor, selecciona una imagen de perfil.');
            return;
        }
        if (!user) return;

        setUploading(true);

        // Por defecto, asumimos que la URL de la imagen es la que ya está en el estado
        // (ya sea la de Supabase o la recién seleccionada si es local)
        let avatarUrl = image;

        try {
            // Verificamos si la imagen en el estado es una *nueva* imagen local
            // Las URIs locales de ImagePicker suelen empezar con "file://"
            if (image.startsWith('file://')) {
                
                // --- Lógica de subida de imagen (la que ya tenías) ---
                const { uri } = await FileSystem.getInfoAsync(image);
                const filePath = `${user.id}/${new Date().getTime()}.png`;
                const contentType = 'image/png';

                const { error: uploadError } = await supabase.storage
                    .from('profile-pictures') 
                    .upload(filePath, { uri, type: contentType }, { upsert: false });

                if (uploadError) throw uploadError;

                // 2. Obtener la URL pública de la *nueva* imagen
                const { data: { publicUrl } } = supabase.storage
                    .from('profile-pictures')
                    .getPublicUrl(filePath);
                
                // Actualizamos avatarUrl solo si subimos una nueva imagen
                avatarUrl = publicUrl;
            }
            
            // 3. Guardar todo en la base de datos
            // 'avatar_url' será la nueva URL pública o la URL antigua que ya estaba
            const updates = {
                user_id: user.id,
                nombre,
                descripcion,
                telefono,
                avatar_url: avatarUrl, 
            };

            // Usamos 'onConflict' para que 'upsert' sepa qué fila actualizar
            const { error: dbError } = await supabase
                .from('infousuario')
                .upsert(updates, { onConflict: 'user_id' }); 

            if (dbError) throw dbError;

            Alert.alert('¡Éxito!', 'Tu perfil ha sido actualizado.');

        } catch (error) {
            Alert.alert('Error', error.message);
        } finally {
            setUploading(false);
        }
    };

    if (loading) { // Modificado: ahora 'loading' es verdadero hasta que todo carga
        return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#2575fc" /></View>;
    }

    // El resto de tu JSX (renderizado) está perfecto y no necesita cambios,
    // ya que los 'value' de los TextInput y la 'source' de la Image
    // dependen del estado (nombre, descripcion, telefono, image), 
    // que ahora se rellena correctamente en el useEffect.

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.userInfo}>
                <Text style={styles.emailText}>Email: {user.email}</Text>
                <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                    <MaterialCommunityIcons name="logout" size={28} color="#db4437" />
                </TouchableOpacity>
            </View>
            <Text style={styles.title}>Completa tu Perfil</Text>
            
            <Text style={styles.label}>Nombre del Artesano</Text>
            <TextInput
                placeholder="Ej: Juan Pérez"
                style={styles.input}
                value={nombre}
                onChangeText={setNombre}
            />

            <Text style={styles.label}>Descripción</Text>
            <TextInput
                placeholder="Describe tu trabajo..."
                style={[styles.input, { height: 100 }]}
                multiline
                value={descripcion}
                onChangeText={setDescripcion}
            />

            <Text style={styles.label}>Teléfono de contacto</Text>
            <TextInput
                placeholder="Ej: 5512345678"
                style={styles.input}
                keyboardType="phone-pad"
                value={telefono}
                onChangeText={setTelefono}
            />
            
            <Text style={styles.label}>Imagen de Perfil</Text>
            <TouchableOpacity onPress={pickImage} style={styles.imagePicker}>
                {image ? (
                    // {uri: image} funciona tanto para 'http://...' (de Supabase)
                    // como para 'file://...' (de ImagePicker)
                    <Image source={{ uri: image }} style={styles.profileImage} />
                ) : (
                    <View style={styles.placeholder}>
                        <MaterialCommunityIcons name="camera-plus" size={40} color="#ccc" />
                    </View>
                )}
            </TouchableOpacity>
            
            <Button 
                title={uploading ? "Guardando..." : "Guardar Perfil"} 
                onPress={saveProfile} 
                disabled={uploading} 
            />
        </ScrollView>
    );
}

// Tus estilos (sin cambios)
const styles = StyleSheet.create({
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    container: { flexGrow: 1, padding: 20, backgroundColor: '#f5f5f5' },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
    label: { textAlign: 'center', marginBottom: 8, color: '#333' },
    userInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', marginBottom: 20 },
    emailText: { fontSize: 16, color: '#555' },
    logoutButton: { padding: 8 },
    input: {
        height: 45, borderColor: 'gray', borderWidth: 1, borderRadius: 5,
        marginBottom: 20, paddingHorizontal: 10, backgroundColor: '#fff',
    },
    imagePicker: { alignItems: 'center', marginBottom: 20 },
    placeholder: {
        width: 120, height: 120, borderRadius: 60, backgroundColor: '#e1e1e1',
        justifyContent: 'center', alignItems: 'center',
    },
    profileImage: { width: 120, height: 120, borderRadius: 60 },
});

export default ArtPage;
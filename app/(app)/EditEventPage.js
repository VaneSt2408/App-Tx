import React, { useState, useEffect } from 'react';
import { View, Text as DefaultText, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useCustomFonts from '../../hooks/useFonts';
import * as ImagePicker from 'expo-image-picker';
import { updateEventForCurrentUser } from '../../src/services/eventsService';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
  );

const EVENTOS_KEY = '@eventos_admin';

const EditEventPage = () => {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Extraemos la fecha y la hora del parámetro `fecha` si existe.
  const fechaCompleta = params.fecha || '';

  const [titulo, setTitulo] = useState(params.titulo || params.nombre || '');
  const [descripcion, setDescripcion] = useState(params.descripcion || '');
  const [fecha, setFecha] = useState(fechaCompleta.split('T')[0]); // Extrae solo la fecha: YYYY-MM-DD
  const [hora, setHora] = useState(params.hora || ''); // HH:mm
  const [ubicacion, setUbicacion] = useState(params.ubicacion || '');
  const [imageAsset, setImageAsset] = useState({ uri: params.imagen_url || null }); // Usamos un objeto para el asset
  const [isSubmitting, setIsSubmitting] = useState(false);

  // El useEffect ya no es necesario para inicializar los datos.

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
      base64: true, // ¡Importante para subir a Supabase!
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]); // Guardamos el objeto de asset completo
    }
  };

  const handleUpdate = async () => {
    if (!titulo || !fecha || !hora || !ubicacion || !descripcion) {
      Alert.alert('Error', 'Por favor, completa todos los campos obligatorios.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Combinamos fecha y hora como en la página de creación

      // Llamamos al servicio para actualizar el evento en Supabase
      const result = await updateEventForCurrentUser(
        params.id,
        titulo,
        descripcion,
        fecha,
        hora,
        ubicacion,
        imageAsset.uri !== params.imagen_url ? imageAsset : null // Solo pasamos el asset si la imagen cambió
      );

      if (result.success) {
        Alert.alert('Éxito', 'Evento actualizado correctamente.');
        router.back();
      } else {
        Alert.alert('Error', result.error || 'No se pudo actualizar el evento.');
      }
    } catch (error) {
      console.error("Error al actualizar el evento:", error);
      Alert.alert('Error', 'No se pudo actualizar el evento.');
    } finally {
      setIsSubmitting(false);
    }
  };
  

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-100"
    >
      <ScrollView className="flex-1 p-4">
        <Text className="text-2xl font-bold text-gray-900 mb-6">Editar Evento</Text>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Título *</Text>
          <TextInput
            className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Nombre del evento"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Descripción *</Text>
          <TextInput
            className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Descripción del evento"
            multiline
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Fecha *</Text>
          <TextInput
            className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={fecha}
            onChangeText={setFecha}
            placeholder="YYYY-MM-DD"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Hora *</Text>
          <TextInput
            className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={hora}
            onChangeText={setHora}
            placeholder="HH:mm"
          />
        </View>

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-1">Ubicación *</Text>
          <TextInput
            className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={ubicacion}
            onChangeText={setUbicacion}
            placeholder="Lugar del evento"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-1">Imagen del Evento</Text>
          <TouchableOpacity
            className="w-full h-40 bg-white rounded-lg border-2 border-dashed border-gray-400 items-center justify-center"
            onPress={pickImage}
          >
            {imageAsset?.uri ? (
              <Image source={{ uri: imageAsset.uri }} className="w-full h-full rounded-lg" resizeMode="cover" />
            ) : (
              <Text className="text-gray-600">+ Seleccionar Imagen</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`p-4 rounded-full ${isSubmitting ? 'bg-gray-400' : 'bg-[#9D046D]'} items-center`}
          onPress={handleUpdate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text className="text-white font-semibold">Guardando...</Text>
          ) : (
            <Text className="text-white font-semibold">Guardar Cambios</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditEventPage;
// 
import React, { useState } from 'react';
import { View, Text as DefaultText, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useCustomFonts from '../../hooks/useFonts';
import * as ImagePicker from 'expo-image-picker';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
  );

const EVENTOS_KEY = '@eventos_admin';

const EditEventPage = () => {
  const router = useRouter();
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState(''); // YYYY-MM-DD
  const [hora, setHora] = useState(''); // HH:mm
  const [ubicacion, setUbicacion] = useState('');
  const [imageUri, setImageUri] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleCreateEvent = async () => {
    if (!titulo || !fecha || !hora || !ubicacion) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      const storedEvents = await AsyncStorage.getItem(EVENTOS_KEY);
      const currentEvents = storedEvents ? JSON.parse(storedEvents) : [];

      const newEvent = {
        id: Date.now().toString(),
        titulo,
        fecha,
        hora,
        ubicacion,
        imagen_url: imageUri, // Guardamos la URI local
      };

      const updatedEvents = [newEvent, ...currentEvents];
      await AsyncStorage.setItem(EVENTOS_KEY, JSON.stringify(updatedEvents));

      Alert.alert('¡Éxito!', 'El evento se ha creado correctamente.');
      router.back(); // Vuelve a la pantalla de gestión de eventos
    } catch (error) {
      console.error('Error al crear el evento:', error);
      Alert.alert('Error', 'No se pudo crear el evento.');
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
        <Text className="text-2xl font-bold text-gray-900 mb-6">Crear Nuevo Evento</Text>

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
            {imageUri ? (
              <Image source={{ uri: imageUri }} className="w-full h-full rounded-lg" resizeMode="cover" />
            ) : (
              <Text className="text-gray-600">+ Seleccionar Imagen</Text>
            )}
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          className={`p-4 rounded-full ${isSubmitting ? 'bg-gray-400' : 'bg-[#9D046D]'} items-center`}
          onPress={handleCreateEvent}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Text className="text-white font-semibold">Creando...</Text>
          ) : (
            <Text className="text-white font-semibold">Crear Evento</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default EditEventPage;
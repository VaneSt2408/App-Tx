// app/(app)/CreateEventPage.js
import React, { useState } from 'react';
import { View, Text as DefaultText, TextInput, TouchableOpacity, Alert, ScrollView, KeyboardAvoidingView, Platform, Image} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import useCustomFonts from '../../hooks/useFonts';
import * as ImagePicker from 'expo-image-picker';
import { createEventForCurrentUser } from '../../src/services/eventsService';

const Text = (props) => (
    <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
  );

const EVENTOS_KEY = '@eventos_admin';

const CreateEventPage = () => {
  const router = useRouter();
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState(''); // YYYY-MM-DD
  const [hora, setHora] = useState(''); // HH:mm
  const [ubicacion, setUbicacion] = useState('');
  const [imageAsset, setImageAsset] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [descripcion, setDescripcion] = useState('');


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
      base64: true,
    });

    if (!result.canceled) {
      setImageAsset(result.assets[0]);
    }
  };

  const handleCreateEvent = async () => {
    if (!nombre || !fecha || !hora || !ubicacion || !descripcion) {
      Alert.alert('Campos incompletos', 'Por favor, llena todos los campos.');
      return;
    }

    setIsSubmitting(true);

    try {
      

      const result = await createEventForCurrentUser(nombre, descripcion, fecha, hora, ubicacion, imageAsset);

      if (result.success) {
        Alert.alert('¡Éxito!', 'El evento se ha creado correctamente.');
        router.back(); // Vuelve a la pantalla de gestión de eventos
        } else {
        Alert.alert('Error', result.error ||'No se pudo crear el evento.');
      }
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
            value={nombre}
            onChangeText={setNombre}
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
          <Text>Descripción *</Text>
          <TextInput
          className="w-full p-3 bg-white rounded-lg border border-gray-300"
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="Describe el evento"
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
            {imageAsset ? (
              <Image source={{ uri: imageAsset.uri }} className="w-full h-full rounded-lg" resizeMode="cover" />
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

export default CreateEventPage;
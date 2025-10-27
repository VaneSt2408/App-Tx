import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { MotiText, MotiView } from 'moti';
import React, { useState, ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Image, // Se importa el componente Image
} from 'react-native';
// Se importa SafeAreaView desde la librería correcta
import { SafeAreaView } from 'react-native-safe-area-context';
// Se importa el selector de imágenes de Expo
import * as ImagePicker from 'expo-image-picker';


// --- Definición de Tipos y Componente Reutilizable ---

type FormInputProps = {
  name: string;
  icon: ComponentProps<typeof Feather>['name'];
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  onFocus: (name: string) => void;
  onBlur: () => void;
  isFocused: boolean;
  multiline?: boolean;
  numberOfLines?: number;
};

const FormInput: React.FC<FormInputProps> = ({
  name,
  icon,
  placeholder,
  value,
  onChangeText,
  onFocus,
  onBlur,
  isFocused,
  multiline = false,
  numberOfLines = 1,
}) => (
  <View
    className="w-full bg-white/20 p-4 rounded-2xl mb-6 border-2 flex-row items-start"
    style={{ borderColor: isFocused ? '#a855f7' : 'transparent' }}
  >
    <Feather name={icon} size={20} color="white" style={{ marginRight: 10, marginTop: multiline ? 4 : 0 }} />
    <TextInput
      onFocus={() => onFocus(name)}
      onBlur={onBlur}
      className="flex-1 text-white text-lg"
      style={{ height: multiline ? 100 : 'auto', textAlignVertical: 'top' }}
      placeholder={placeholder}
      placeholderTextColor="#ccc"
      value={value}
      onChangeText={onChangeText}
      autoCapitalize="sentences"
      multiline={multiline}
      numberOfLines={numberOfLines}
    />
  </View>
);


export default function RegisterArtisanScreen() {
  const router = useRouter();

  const [workshopName, setWorkshopName] = useState('');
  const [craftDescription, setCraftDescription] = useState('');
  const [address, setAddress] = useState('');
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    // Pedir permiso para acceder a la galería
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Lo sentimos, necesitamos permisos de la galería para que esto funcione.');
      return;
    }

    // Abrir el selector de imágenes
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Forzar un recorte cuadrado para la foto de perfil
      quality: 1,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  const handleCompleteRegistration = async () => {
    if (!profileImage) {
      Alert.alert('Foto de Perfil Requerida', 'Por favor, selecciona una foto de perfil para continuar.');
      return;
    }
    if (!workshopName.trim() || !craftDescription.trim() || !address.trim() ) {
      Alert.alert('Campos Incompletos', 'Por favor, rellena todos los campos para continuar.');
      return;
    }

    setIsLoading(true);
    console.log('Completando registro de artesano:', { profileImage, workshopName, craftDescription, address });

    await new Promise(resolve => setTimeout(resolve, 2000));

    setIsLoading(false);

    Alert.alert(
      '¡Registro Completo!',
      'Tu perfil de artesano ha sido creado exitosamente.',
      [{ text: 'OK', onPress: () => router.replace('/auth') }]
    );
  };

  return (
    <LinearGradient colors={['#020202ff', '#923febff']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1 }}>
      <StatusBar style="light" />
      <SafeAreaView className="flex-1" style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>

            <MotiText from={{ opacity: 0, translateY: -50 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 900 }} className="text-white text-4xl font-bold mb-4 text-center">
              Registro de Artesano
            </MotiText>
            <MotiText from={{ opacity: 0, translateY: -30 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 700, delay: 100 }} className="text-white/80 text-base mb-10 text-center">
              Cuéntanos más sobre tu increíble trabajo.
            </MotiText>

            {/* --- NUEVO: SELECTOR DE IMAGEN DE PERFIL --- */}
            <MotiView
              from={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 400, delay: 150 }}
              className="mb-8"
            >
              <TouchableOpacity 
                onPress={handlePickImage} 
                className="w-32 h-32 bg-white/20 rounded-full justify-center items-center border-2 border-dashed border-white/50"
              >
                {profileImage ? (
                  <Image source={{ uri: profileImage }} className="w-full h-full rounded-full" />
                ) : (
                  <View className="items-center">
                    <Feather name="camera" size={32} color="white" />
                    <Text className="text-white/80 text-center mt-2 text-xs">Añadir foto de perfil</Text>
                  </View>
                )}
              </TouchableOpacity>
            </MotiView>

            <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 300, delay: 200 }} className="w-full">
              <FormInput
                name="workshop"
                icon="briefcase"
                placeholder="Nombre de tu taller o marca"
                value={workshopName}
                onChangeText={setWorkshopName}
                onFocus={setFocusedInput}
                onBlur={() => setFocusedInput(null)}
                isFocused={focusedInput === 'workshop'}
              />
              <FormInput
                name="description"
                icon="edit-3"
                placeholder="Describe tu arte (ej. 'Cerámica pintada a mano...')"
                value={craftDescription}
                onChangeText={setCraftDescription}
                onFocus={setFocusedInput}
                onBlur={() => setFocusedInput(null)}
                multiline
                numberOfLines={4}
                isFocused={focusedInput === 'description'}
              />
              <FormInput
                name="address"
                icon="map-pin"
                placeholder="Ubicación (Ciudad, Estado)"
                value={address}
                onChangeText={setAddress}
                onFocus={setFocusedInput}
                onBlur={() => setFocusedInput(null)}
                isFocused={focusedInput === 'address'}
              />
            </MotiView>

            <MotiView from={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'timing', duration: 400, delay: 400 }} className="w-full">
              <TouchableOpacity
                onPress={handleCompleteRegistration}
                disabled={isLoading}
                className={`w-full p-4 rounded-2xl items-center mb-6 ${isLoading ? 'bg-white/50' : 'bg-white'}`}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text className="text-black text-xl font-bold">Completar Registro</Text>
                )}
              </TouchableOpacity>
            </MotiView>

            <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 500, delay: 500 }} className="w-full">
              <TouchableOpacity onPress={() => router.back()} disabled={isLoading} className='w-full bg-white/20 p-4 rounded-full items-center'>
                <Text className='text-white text-xl font-semibold'>← Regresar</Text>
              </TouchableOpacity>
            </MotiView>

          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}
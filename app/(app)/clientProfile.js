// app/(app)/ClientProfile.js
import React, { useState, useEffect, useRef } from 'react';
import { View, Text as DefaultText, ScrollView, ActivityIndicator, Alert, TouchableOpacity, Image } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useCustomFonts from '../../hooks/useFonts';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../src/supabase/client';
import { 
  getClientProfile, 
  editClientProfile, 
  uploadAvatar, 
  changeClientPassword, 
  validateCurrentPassword, 
  validateNewPassword, 
  deleteClientProfile, 
  deleteGoogleClientProfile 
} from '../../src/services/profileInfo';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import { FontDisplay } from 'expo-font';

// Componente Text personalizado con la fuente AlanSans
const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: 'AlanSans' }, props.style]} />
);

export default function ClientProfile() {
  const { signOut } = useAuth();
  const fontsLoaded = useCustomFonts();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    nombre_completo: '',
    telefono: '',
    avatar_url: null
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [saving, setSaving] = useState(false);

  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [currentPasswordValidated, setCurrentPasswordValidated] = useState(false);
  const [currentPasswordAttempts, setCurrentPasswordAttempts] = useState(0);
  const [passwordBlocked, setPasswordBlocked] = useState(false);
  const [blockTimeRemaining, setBlockTimeRemaining] = useState(0);
  const [passwordValidationErrors, setPasswordValidationErrors] = useState([]);
  const [totalFailedAttempts, setTotalFailedAttempts] = useState(0);

  // Refs para evitar race conditions
  const totalFailedAttemptsRef = useRef(0);
  const currentPasswordAttemptsRef = useRef(0);
  const deletePasswordAttemptsRef = useRef(0);

  // Estados para eliminación de perfil
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [deletePasswordData, setDeletePasswordData] = useState({
    currentPassword: ''
  });
  const [deletePasswordLoading, setDeletePasswordLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordValidated, setDeletePasswordValidated] = useState(false);
  const [deletePasswordAttempts, setDeletePasswordAttempts] = useState(0);
  const [deletePasswordBlocked, setDeletePasswordBlocked] = useState(false);
  const [deleteBlockTimeRemaining, setDeleteBlockTimeRemaining] = useState(0);
  const [totalDeleteAttempts, setTotalDeleteAttempts] = useState(0);

  // Estados para eliminación de perfil Google
  const [showDeleteGoogleProfile, setShowDeleteGoogleProfile] = useState(false);
  const [deleteGoogleLoading, setDeleteGoogleLoading] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);

  const router = useRouter();

  // Funciones de carga y validación
  const loadFailedAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('passwordFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalFailedAttempts(parsedAttempts);
        totalFailedAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
    }
  };

  const saveFailedAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('passwordFailedAttempts', attempts.toString());
      totalFailedAttemptsRef.current = attempts;
      setTotalFailedAttempts(attempts);
    } catch (error) {
    }
  };

  const clearFailedAttempts = async () => {
    try {
      await AsyncStorage.removeItem('passwordFailedAttempts');
      totalFailedAttemptsRef.current = 0;
      setTotalFailedAttempts(0);
    } catch (error) {
    }
  };

  const loadDeleteAttempts = async () => {
    try {
      const attempts = await AsyncStorage.getItem('deleteFailedAttempts');
      if (attempts !== null) {
        const parsedAttempts = parseInt(attempts);
        setTotalDeleteAttempts(parsedAttempts);
        deletePasswordAttemptsRef.current = parsedAttempts;
      }
    } catch (error) {
    }
  };

  const saveDeleteAttempts = async (attempts) => {
    try {
      await AsyncStorage.setItem('deleteFailedAttempts', attempts.toString());
      deletePasswordAttemptsRef.current = attempts;
      setTotalDeleteAttempts(attempts);
    } catch (error) {
    }
  };

  const clearDeleteAttempts = async () => {
    try {
      await AsyncStorage.removeItem('deleteFailedAttempts');
      deletePasswordAttemptsRef.current = 0;
      setTotalDeleteAttempts(0);
    } catch (error) {
    }
  };

  useEffect(() => {
    fetchProfile();
    checkUserProvider();
    loadFailedAttempts();
    loadDeleteAttempts();
  }, []);

  useEffect(() => {
    let interval;
    if (passwordBlocked && blockTimeRemaining > 0) {
      interval = setInterval(() => {
        setBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setPasswordBlocked(false);
            setCurrentPasswordAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [passwordBlocked, blockTimeRemaining]);

  useEffect(() => {
    let interval;
    if (deletePasswordBlocked && deleteBlockTimeRemaining > 0) {
      interval = setInterval(() => {
        setDeleteBlockTimeRemaining(prev => {
          if (prev <= 1) {
            setDeletePasswordBlocked(false);
            setDeletePasswordAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [deletePasswordBlocked, deleteBlockTimeRemaining]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'No se encontró la sesión del usuario');
        return;
      }
      const { data, error } = await getClientProfile(user.id);
      if (error) {
        Alert.alert('Error', 'No se pudo cargar el perfil: ' + error);
        return;
      }
      setProfile(data);
    } catch (error) {
      Alert.alert('Error', 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const checkUserProvider = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && user.app_metadata && user.app_metadata.provider) {
        setIsGoogleUser(user.app_metadata.provider === 'google');
      }
    } catch (error) {
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        {
          text: 'Cancelar',
          style: 'cancel'
        },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await signOut();
          }
        }
      ]
    );
  };

  const navigateToProfile = () => {
    router.push('/clientProfile');
  };

  const navigateToAccountManagement = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToNotifications = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToAppSettings = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToHelpAndSupport = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  const navigateToTermsAndConditions = () => {
    Alert.alert('Próximamente', 'Esta función estará disponible pronto');
  };

  // Primero verifica si las fuentes están cargadas
  if (!fontsLoaded) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2575fc" />
        <Text className="mt-3 text-sm text-gray-600">Cargando...</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#2575fc" />
        <Text className="mt-3 text-sm text-gray-600">Cargando perfil...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-4">
        <MaterialCommunityIcons name="alert-circle" size={48} color="#db4437" />
        <Text className="mt-4 text-lg font-semibold text-red-600 text-center">No se pudo cargar el perfil</Text>
        <TouchableOpacity 
          className="mt-4 bg-blue-500 py-2 px-6 rounded-lg"
          onPress={fetchProfile}
        >
          <Text className="text-white font-bold">Reintentar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white py-4 px-4 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity className="p-2" onPress={() => router.back()}>
          <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={{fontFamily: 'AlanSans', fontSize:20, fontWeight: 'bold'}} className="text-2xl text-gray-700">Mi Cuenta</Text>
        <TouchableOpacity className="p-2">
          <MaterialCommunityIcons name="dots-vertical" size={24} color="#333" />
        </TouchableOpacity>
      </View>

      {/* Sección de Perfil */}
      <View className="bg-white p-4 mb-4">
        <TouchableOpacity className="flex-row items-center" onPress={navigateToProfile}>
          <View className="w-12 h-12 bg-gray-300 rounded-full mr-3 justify-center items-center">
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} className="w-12 h-12 rounded-full" />
            ) : (
              <MaterialCommunityIcons name="account" size={24} color="#666" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold text-gray-900">{profile.nombre_completo}</Text>
            <Text style={{fontFamily: 'AlanSans', fontSize:15}} className=" text-[#9D046D] text-semibold">Ver mi perfil</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#ccc" />
        </TouchableOpacity>
      </View>

      {/* Sección Gestión */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text style={{fontFamily: 'AlanSans', fontSize:20,}} className="text-lg font-bold text-gray-700">Gestión</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToAccountManagement}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="account-circle-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Gestión de la Cuenta</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToNotifications}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="bell-ring-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Notificaciones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={navigateToAppSettings}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="tune" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text className="font-bold text-gray-900">Configuración de la App</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Sección Soporte */}
      <View className="bg-white mb-4">
        <View className="px-4 py-3 border-b border-gray-200">
          <Text className="text-lg font-bold text-gray-700">Soporte</Text>
        </View>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3 border-b border-gray-200"
          onPress={navigateToHelpAndSupport}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="information-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'AlanSans', fontSize:15,}} className="font-bold text-gray-900">Ayuda y Soporte</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity
          className="flex-row items-center px-4 py-3"
          onPress={navigateToTermsAndConditions}
        >
          <View className="w-12 h-12 bg-[#00000012] rounded-full mr-3 justify-center items-center">
            <MaterialCommunityIcons name="file-document-outline" size={26} color="#000" />
          </View>
          <View className="flex-1">
            <Text style={{fontFamily: 'AlanSans', fontSize:15,}} className="font-bold text-gray-900">Términos y Condiciones</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Botón de Cerrar Sesión */}
      <View className="px-4 pb-6">
        <TouchableOpacity
          className="py-3 px-4 bg-[#E8C6E8] rounded-xl flex-row items-center border-[#9D046D] justify-center"
          onPress={handleLogout}
        >
          <MaterialCommunityIcons name="logout" size={20} color="#9D046D" />
          <Text style={{fontFamily: 'AlanSans', fontSize:20,}} className="ml-2 font-bold text-[#9D046D]">Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// 👇 ESTA LÍNEA ES CRUCIAL PARA EVITAR EL ERROR DE EXPO ROUTER 👇
ClientProfile.displayName = 'ClientProfile';
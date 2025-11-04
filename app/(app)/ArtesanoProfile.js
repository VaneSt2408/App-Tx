// En: app/(app)/ArtesanoProfile.js -> Archivo del perfil del artesano (Frontend)
// Este archivo es el encargado de mostrar el perfil del artesano en la aplicación.
// Muestra el perfil del artesano registrado en la base de datos y permite editarlo, cambiar la contraseña, eliminar el perfil y cambiar la foto de perfil.
import React, { useState, useEffect, useRef } from 'react'; // Importar los hooks de react
import {View,Text,StyleSheet,ScrollView,Image,TouchableOpacity,SafeAreaView,ActivityIndicator,Alert,Dimensions,FlatList,Modal,TextInput,PanResponder,Animated} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Importar los componentes de expo-vector-icons
import { useRouter, useLocalSearchParams } from 'expo-router'; // Importar el router de expo-router
import { artesanoService } from '../../src/services/artesanoService'; // Importar el servicio de artesano
import { supabase } from '../../src/supabase/client'; // Importar el cliente de supabase
import { useAuth, signOut } from '../../src/context/AuthContext'; // Importar el contexto de autenticación
import * as ImagePicker from 'expo-image-picker'; // Importar el selector de imágenes
import { updatePerfilArtesanoCompleto, eliminarPerfilArtesano, subirAvatarArtesano } from '../../src/services/ArtesanoProfileService'; // Importar los servicios de perfil
import ChangePasswordModal from '../../components/ChangePasswordModal'; // Importar el modal de cambio de contraseña
import AsyncStorage from '@react-native-async-storage/async-storage'; // Importar AsyncStorage para persistencia
import { validateCurrentPassword } from '../../src/services/profileInfo'; // Importar validación de contraseña

const { width } = Dimensions.get('window'); // Obtener el ancho de la ventana
const imageSize = (width - 60) / 3; // Para grid de 3 columnas

export default function ArtesanoProfile() { // Exportar la función ArtesanoProfile
    const router = useRouter(); // Obtener el router
    const { userId, tab } = useLocalSearchParams(); // Obtener el id del usuario y la tab
    const { session } = useAuth(); // Obtener la sesión

    const [artesano, setArtesano] = useState(null); // Establecer el estado del artesano
    const [publicaciones, setPublicaciones] = useState([]); // Establecer el estado de las publicaciones
    const [productos, setProductos] = useState([]); // Establecer el estado de los productos
    const [loading, setLoading] = useState(true); // Establecer el estado de carga
    const [activeTab, setActiveTab] = useState(tab || 'publicaciones'); // 'publicaciones' o 'productos'

    const [showSettingsMenu, setShowSettingsMenu] = useState(false); // Establecer el estado del menú de ajustes
    const [showEditModal, setShowEditModal] = useState(false); // Establecer el estado del modal de edición
    const [showPasswordModal, setShowPasswordModal] = useState(false); // Establecer el estado del modal de cambio de contraseña
    const [showAvatarMenu, setShowAvatarMenu] = useState(false); // Establecer el estado del modal de cambio de foto de perfil
    const [editData, setEditData] = useState({ nombre: '', telefono: '', ubicacion: '', descripcion: '', avatar_url: null });
    // Establecer el estado de los datos de edición
    const [uploadingAvatar, setUploadingAvatar] = useState(false); // Establecer el estado de subida de foto de perfil
    const [selectedImage, setSelectedImage] = useState(null); // Establecer el estado de la imagen seleccionada

    const isOwnProfile = session?.user?.id === userId; // Verificar si el usuario es el propio

    // Estados para eliminación de perfil con validación de contraseña
    const [showDeleteProfile, setShowDeleteProfile] = useState(false); // Modal de eliminación de perfil
    const [deletePasswordData, setDeletePasswordData] = useState({ currentPassword: '' }); // Datos de contraseña de eliminación
    const [deletePasswordValidated, setDeletePasswordValidated] = useState(false); // Contraseña de eliminación validada
    const [deletePasswordAttempts, setDeletePasswordAttempts] = useState(0); // Intentos de contraseña de eliminación
    const [deletePasswordLoading, setDeletePasswordLoading] = useState(false); // Carga de eliminación
    const [deletePasswordBlocked, setDeletePasswordBlocked] = useState(false); // Bloqueo por intentos fallidos
    const [deleteBlockTimeRemaining, setDeleteBlockTimeRemaining] = useState(0); // Tiempo restante de bloqueo
    const [showDeletePassword, setShowDeletePassword] = useState(false); // Mostrar/ocultar contraseña
    const [totalFailedAttempts, setTotalFailedAttempts] = useState(0); // Intentos fallidos totales (compartido con cambio de contraseña)

    // Refs para evitar race conditions en contadores
    const deletePasswordAttemptsRef = useRef(0); // Ref para intentos de contraseña de eliminación
    const totalFailedAttemptsRef = useRef(0); // Ref para intentos fallidos totales (compartido)

    // Estados para modal de productos (no se utiliza en la versión final proporcionada, pero se mantiene en el código)
    const [selectedProducto, setSelectedProducto] = useState(null);
    const [selectedProductoIndex, setSelectedProductoIndex] = useState(0);
    const [showProductoModal, setShowProductoModal] = useState(false);

    // --- NUEVO: Estados para el visor de imágenes ---
    const [showImageViewer, setShowImageViewer] = useState(false);
    const [activeImageList, setActiveImageList] = useState([]); // La lista de imágenes activa (publicaciones o productos)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0); // El índice de la imagen actual
    const imageViewerAnim = useRef(new Animated.Value(0)).current; // Para la animación de swipe
    const productoSliderAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => { // Efecto para cargar el perfil del artesano
        if (userId) { // Si hay id de usuario
            loadArtesanoCompleto(); // Cargar el perfil del artesano
        }
    }, [userId]); // Dependencias del efecto

    // Efecto para actualizar la pestaña activa si viene en los parámetros
    useEffect(() => {
        if (tab && (tab === 'publicaciones' || tab === 'productos')) {
            setActiveTab(tab);
        }
    }, [tab]);

    // Funciones AsyncStorage para persistencia de intentos fallidos
    const loadFailedAttempts = async () => {
        try {
            const stored = await AsyncStorage.getItem('artesanoFailedAttempts');
            if (stored !== null) {
                const attempts = parseInt(stored, 10);
                totalFailedAttemptsRef.current = attempts;
                setTotalFailedAttempts(attempts);
            }
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Función para guardar los intentos fallidos
    const saveFailedAttempts = async (attempts) => {
        try {
            await AsyncStorage.setItem('artesanoFailedAttempts', attempts.toString());
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Función para limpiar los intentos fallidos
    const clearFailedAttempts = async () => {
        try {
            await AsyncStorage.removeItem('artesanoFailedAttempts');
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Función para guardar los intentos de eliminación (Nota: esta función es redundante con saveFailedAttempts en la implementación final de seguridad)
    const saveDeleteAttempts = async (attempts) => {
        try {
            await AsyncStorage.setItem('artesanoDeleteAttempts', attempts.toString());
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Función para cargar los intentos de eliminación (Nota: esta función es redundante con loadFailedAttempts en la implementación final de seguridad)
    const loadDeleteAttempts = async () => {
        try {
            const stored = await AsyncStorage.getItem('artesanoDeleteAttempts');
            if (stored !== null) {
                const attempts = parseInt(stored, 10);
                deletePasswordAttemptsRef.current = attempts;
                setDeletePasswordAttempts(attempts);
            }
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Función para limpiar los intentos de eliminación
    const clearDeleteAttempts = async () => {
        try {
            await AsyncStorage.removeItem('artesanoDeleteAttempts');
        } catch (error) {
            // Manejo de error de AsyncStorage
        }
    };

    // Timer para bloqueo de eliminación
    useEffect(() => {
        if (deleteBlockTimeRemaining > 0) {
            const timer = setTimeout(() => {
                setDeleteBlockTimeRemaining(prev => {
                    if (prev <= 1) {
                        setDeletePasswordBlocked(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [deleteBlockTimeRemaining]);

    // Cargar intentos fallidos al montar
    useEffect(() => {
        loadFailedAttempts();
    }, []);

    const loadArtesanoCompleto = async () => { // Función para cargar el perfil del artesano
        try {
            setLoading(true); // Establecer el estado de carga
            const data = await artesanoService.getArtesanoCompleto(userId); // Cargar el perfil del artesano
            setArtesano(data.artesano); // Establecer el estado del artesano
            setPublicaciones(data.publicaciones); // Establecer el estado de las publicaciones
            setProductos(data.productos); // Establecer el estado de los productos


            // Cargar datos para edición
            if (isOwnProfile && data.artesano) { // Si el usuario es el propio y hay datos del artesano
                setEditData({
                    nombre: data.artesano.nombre || '',
                    telefono: data.artesano.telefono || '',
                    ubicacion: data.artesano.ubicacion || '',
                    descripcion: data.artesano.descripcion || '',
                    avatar_url: data.artesano.avatar_url || null
                }); // Establecer el estado de los datos de edición
            }
        } catch (error) { // Capturar el error
            Alert.alert('Error', 'No se pudo cargar el perfil del artesano'); // Mostrar el error en la alerta
            router.back(); // Redirigir a la página anterior
        } finally { // Finalmente
            setLoading(false); // Establecer el estado de carga
        }
    };

    // Función para editar el perfil del artesano
    const handleEditProfile = async () => {
        try {
            setUploadingAvatar(true);
            const result = await updatePerfilArtesanoCompleto(userId, editData, selectedImage);
            if (!result.success) {
                throw new Error(result.error);
            }
            // Si se actualizó el avatar, actualizar el estado local
            if (result.avatar_url) {
                setEditData(prev => ({ ...prev, avatar_url: result.avatar_url }));
            }
            Alert.alert('Éxito', 'Perfil actualizado correctamente');
            setShowEditModal(false);
            setSelectedImage(null);
            await loadArtesanoCompleto();
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar el perfil');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // Función para redirigir al login después de cambiar contraseña
    const handlePasswordChangeSuccess = () => { // Función para redirigir al login después de cambiar contraseña
        // Redirigir al login después de cambiar contraseña
        router.replace('/(auth)'); // Redirigir al login
    };

    // Funciones para eliminación de perfil
    const handleDeleteProfile = () => {
        if (deletePasswordBlocked) {
            Alert.alert(
                'Acceso bloqueado',
                `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(deleteBlockTimeRemaining / 60)} minutos.`
            );
            return;
        }
        // Abrir directamente el modal de eliminación con validación de contraseña
        setShowDeleteProfile(true);
        setDeletePasswordData({ currentPassword: '' });
        setDeletePasswordValidated(false);
        setDeletePasswordAttempts(0);
        deletePasswordAttemptsRef.current = 0;
    };

    // Función para cancelar la eliminación de perfil
    const handleCancelDeleteProfile = () => {
        setShowDeleteProfile(false);
        setDeletePasswordData({ currentPassword: '' });
        setDeletePasswordValidated(false);
        setDeletePasswordAttempts(0);
        deletePasswordAttemptsRef.current = 0;
    };

    // Función para manejar el cambio de input en el modal de eliminación de perfil
    const handleDeletePasswordInputChange = (value) => {
        setDeletePasswordData(prev => ({
            ...prev,
            currentPassword: value
        }));
    };

    // Función para verificar la contraseña de eliminación
    const handleVerifyDeletePassword = async () => {
        if (!deletePasswordData.currentPassword.trim()) {
            Alert.alert('Error', 'Por favor ingresa tu contraseña actual');
            return;
        }
        if (deletePasswordData.currentPassword.length < 8) {
            Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres');
            return;
        }
        try {
            const { data, error } = await validateCurrentPassword(deletePasswordData.currentPassword);
            if (data) {
                setDeletePasswordValidated(true);
                setDeletePasswordAttempts(0);
                deletePasswordAttemptsRef.current = 0;
                await clearDeleteAttempts();
                await clearFailedAttempts();
                setTotalFailedAttempts(0);
                Alert.alert('Éxito', 'Contraseña verificada. Procediendo con la eliminación...');
            } else {
                setDeletePasswordValidated(false);

                // Usar refs para evitar race conditions
                // COMPARTIR contador total con cambio de contraseña para mejor seguridad
                deletePasswordAttemptsRef.current = deletePasswordAttemptsRef.current + 1; // Incrementar el contador de intentos de eliminación
                totalFailedAttemptsRef.current = totalFailedAttemptsRef.current + 1; // COMPARTIDO

                // Obtener los nuevos valores
                const newAttempts = deletePasswordAttemptsRef.current;
                const newTotalAttempts = totalFailedAttemptsRef.current; // Usar contador compartido

                // Actualizar estados UI
                setDeletePasswordAttempts(newAttempts);
                await saveDeleteAttempts(newTotalAttempts);
                await saveFailedAttempts(newTotalAttempts); // Guardar en contador compartido
                setTotalFailedAttempts(newTotalAttempts); // Actualizar UI del contador compartido

                if (newAttempts >= 3) {
                    setDeletePasswordBlocked(true);
                    setDeleteBlockTimeRemaining(300); // 5 minutos en segundos
                    // Verificar si es el segundo bloqueo (6 intentos totales COMPARTIDOS entre cambio y eliminación)
                    if (newTotalAttempts >= 6) {
                        // Mostrar alerta ANTES de cerrar sesión
                        Alert.alert(
                            'Sesión será cerrada por seguridad',
                            'Has excedido 6 intentos fallidos. Tu sesión será cerrada por seguridad.',
                            [
                                {
                                    text: 'Entendido',
                                    onPress: async () => {
                                        // Limpiar datos del modal
                                        setShowDeleteProfile(false);
                                        setDeletePasswordValidated(false);
                                        setDeletePasswordData({ currentPassword: '' });
                                        await clearDeleteAttempts();
                                        await clearFailedAttempts(); // Limpiar contador compartido
                                        setTotalFailedAttempts(0);
                                        deletePasswordAttemptsRef.current = 0;
                                        setDeletePasswordAttempts(0);
                                        setDeletePasswordBlocked(false);

                                        // Cerrar sesión
                                        await signOut();

                                        // Redirigir al login
                                        router.replace('/(auth)');
                                    }
                                }
                            ]
                        );
                    } else {
                        // Primer bloqueo (3 intentos), cerrar modal pero mantener sesión
                        setTimeout(() => {
                            setShowDeleteProfile(false);
                            setDeletePasswordValidated(false);
                            setDeletePasswordData({ currentPassword: '' });
                        }, 2000);
                        Alert.alert(
                            'Acceso bloqueado',
                            'Has excedido el número de intentos. El acceso estará bloqueado por 5 minutos.'
                        );
                    }
                } else {
                    Alert.alert(
                        'Contraseña incorrecta',
                        `Intentos restantes: ${3 - newAttempts}`
                    );
                }
            }
        } catch (error) {
            Alert.alert('Error', 'Ocurrió un error al verificar la contraseña');
        }
    };

    // Función para confirmar la eliminación de perfil
    const handleConfirmDeleteProfile = async () => {
        if (!deletePasswordValidated) {
            Alert.alert('Error', 'Debes validar tu contraseña actual primero');
            return;
        }
        Alert.alert(
            'Confirmar Eliminación',
            'Esta acción es IRREVERSIBLE. Se eliminarán TODOS tus datos incluyendo:\n\n• Perfil de artesano\n• Avatar e imágenes\n• Productos y publicaciones\n• Sesión actual (serás deslogueado)\n\nNota: La cuenta de autenticación permanecerá pero sin datos asociados.\n\n¿Estás completamente seguro?',
            [
                {
                    text: 'Cancelar',
                    style: 'cancel'
                },
                {
                    text: 'ELIMINAR DEFINITIVAMENTE',
                    style: 'destructive',
                    onPress: async () => {
                        setDeletePasswordLoading(true);
                        try {
                            const result = await eliminarPerfilArtesano(userId);

                            if (!result.success) {
                                Alert.alert('Error', result.error);
                                return;
                            }
                            Alert.alert(
                                'Perfil Eliminado',
                                'Tu perfil ha sido eliminado completamente. Serás redirigido al login.',
                                [
                                    {
                                        text: 'OK',
                                        onPress: () => {
                                            // Redirigir al login después de eliminar perfil
                                            router.replace('/(auth)');
                                        }
                                    }
                                ]
                            );
                        } catch (error) {
                            Alert.alert('Error', 'Ocurrió un error inesperado');
                        } finally {
                            setDeletePasswordLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Función para seleccionar la imagen de perfil
    const selectAvatarImage = async () => { // Función para seleccionar la imagen de perfil
        try {
            // Si el modal de avatar está abierto, cerrarlo primero (solo si viene del clic en el avatar del perfil)
            if (showAvatarMenu) {
                setShowAvatarMenu(false);
                // Pequeño delay para que el modal se cierre antes de abrir la galería
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync(); // Solicitar permisos para acceder a la galería
            if (status !== 'granted') { // Si no hay permisos
                Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la foto de perfil');
                return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({ // Abrir el selector de imágenes
                mediaTypes: ImagePicker.MediaTypeOptions.Images, // Tipo de media: imágenes
                allowsEditing: true, // Permitir edición
                aspect: [1, 1], // Aspecto cuadrado
                quality: 0.5, // Calidad de la imagen
                base64: true, // Convertir a base64
            });
            if (!result.canceled && result.assets && result.assets[0]) { // Si no se canceló y hay assets y el primer asset
                // Guardar la imagen seleccionada temporalmente (no subirla aún)
                setSelectedImage(result.assets[0]);
                setEditData(prev => ({
                    ...prev,
                    avatar_url: result.assets[0].uri // Mostrar vista previa
                }));
            }
        } catch (error) { // Capturar el error
            Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + error.message);
        }
    };

    // Función para seleccionar imagen (desde perfil o modal de edición)
    const selectAvatarImageFromEdit = async () => { // Función para seleccionar imagen (desde perfil o modal de edición)
        try {
            // Solicitar permisos para acceder a la galería
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permisos necesarios', 'Se requiere acceso a la galería para cambiar la foto de perfil');
                return;
            }
            // Abrir el selector de imágenes
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.5,
                base64: true,
            });
            if (!result.canceled && result.assets && result.assets[0]) {
                // Si estamos en modal de edición, guardar temporalmente
                if (showEditModal) {
                    setSelectedImage(result.assets[0]);
                    setEditData(prev => ({
                        ...prev,
                        avatar_url: result.assets[0].uri
                    }));
                } else {
                    // Si estamos en el perfil, subir inmediatamente
                    await uploadAvatarImage(result.assets[0]);
                }
            }
        } catch (error) {
            Alert.alert('Error', 'No se pudo seleccionar la imagen: ' + error.message);
        }
    };

    // Función para subir la imagen de perfil (desde el perfil principal, no desde modal de edición)
    const uploadAvatarImage = async (imageAsset) => {
        try {
            setUploadingAvatar(true);
            const result = await subirAvatarArtesano(userId, imageAsset);
            if (!result.success) {
                throw new Error(result.error);
            }
            // Actualizar estado local con el nuevo avatar
            setArtesano(prev => ({ ...prev, avatar_url: result.avatar_url }));
            setEditData(prev => ({ ...prev, avatar_url: result.avatar_url }));
            Alert.alert('Éxito', 'Foto de perfil actualizada correctamente');
        } catch (error) {
            Alert.alert('Error', error.message || 'No se pudo actualizar la foto de perfil');
        } finally {
            setUploadingAvatar(false);
        }
    };

    // --- MODIFICADO: Función para abrir el visor de imágenes ---
    const openImageViewer = (imageList, index) => {
        if (imageList && imageList.length > 0) {
            setActiveImageList(imageList);
            setSelectedImageIndex(index);
            setShowImageViewer(true);
        }
    };

    // --- NUEVO: Funciones para navegar en el visor de imágenes ---
    const handleNextImage = () => {
        if (selectedImageIndex < activeImageList.length - 1) {
            setSelectedImageIndex(prev => prev + 1);
            imageViewerAnim.setValue(0);
        }
    };

    const handlePreviousImage = () => {
        if (selectedImageIndex > 0) {
            setSelectedImageIndex(prev => prev - 1);
            imageViewerAnim.setValue(0);
        }
    };

    // --- NUEVO: PanResponder para el swipe de imágenes ---
    const imagePanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
            onPanResponderMove: (evt, gestureState) => {
                imageViewerAnim.setValue(gestureState.dx);
            },
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;
                if (dx < -50 || (dx < -10 && vx < -0.5)) { // Swipe a la izquierda
                    handleNextImage();
                } else if (dx > 50 || (dx > 10 && vx > 0.5)) { // Swipe a la derecha
                    handlePreviousImage();
                } else {
                    Animated.spring(imageViewerAnim, { toValue: 0, useNativeDriver: true }).start();
                }
            },
        })
    ).current;

    // --- Funciones para el Modal de Producto (implementación parcial en el código original) ---
    const handleCloseProductoModal = () => {
        setShowProductoModal(false);
        setSelectedProducto(null);
    };

    const handleOpenProductoModal = (producto, index) => {
        setSelectedProducto(producto);
        setSelectedProductoIndex(index);
        setShowProductoModal(true);
    };

    const handleNextProducto = () => {
        if (selectedProductoIndex < productos.length - 1) {
            const newIndex = selectedProductoIndex + 1;
            setSelectedProducto(productos[newIndex]);
            setSelectedProductoIndex(newIndex);
            productoSliderAnim.setValue(width); // Iniciar fuera de pantalla (derecha)
            Animated.spring(productoSliderAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    };

    const handlePreviousProducto = () => {
        if (selectedProductoIndex > 0) {
            const newIndex = selectedProductoIndex - 1;
            setSelectedProducto(productos[newIndex]);
            setSelectedProductoIndex(newIndex);
            productoSliderAnim.setValue(-width); // Iniciar fuera de pantalla (izquierda)
            Animated.spring(productoSliderAnim, {
                toValue: 0,
                useNativeDriver: true,
            }).start();
        }
    };

    // PanResponder para el slider de productos (swipe en el modal)
    const productoPanResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (evt, gestureState) => Math.abs(gestureState.dx) > 10,
            onPanResponderRelease: (evt, gestureState) => {
                const { dx, vx } = gestureState;
                // Deslizar hacia la izquierda (siguiente)
                if (dx < -50 || vx < -0.5) {
                    handleNextProducto();
                }
                // Deslizar hacia la derecha (anterior)
                else if (dx > 50 || vx > 0.5) {
                    handlePreviousProducto();
                } else {
                    // Resetear animación si no se alcanzó el umbral
                    Animated.spring(productoSliderAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
            onPanResponderMove: (evt, gestureState) => {
                productoSliderAnim.setValue(gestureState.dx);
            },
        })
    ).current;
    
    // --- Funciones de Formato ---
    const formatPrice = (price) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };

    // --- Componentes de Renderizado ---
    const renderHeader = () => (
        <View style={styles.header}>
            <View style={styles.headerTop}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Perfil</Text>
                {isOwnProfile ? (
                    <TouchableOpacity onPress={() => setShowSettingsMenu(true)} style={styles.backButton}>
                        <MaterialCommunityIcons name="cog-outline" size={24} color="#333" />
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </View>
    );

    const renderProfileInfo = () => (
        <View style={styles.profileSection}>
            <View style={styles.profileHeader}>
                <View style={styles.avatarContainer}>
                    {isOwnProfile ? (
                        <TouchableOpacity
                            onPress={selectAvatarImageFromEdit}
                            disabled={uploadingAvatar}
                        >
                            {uploadingAvatar ? (
                                <View style={styles.avatarWrapper}>
                                    <View style={styles.avatarLoadingOverlay}>
                                        <ActivityIndicator size="large" color="#fff" />
                                    </View>
                                    <View style={styles.avatar}>
                                        <MaterialCommunityIcons name="account" size={60} color="#666" />
                                    </View>
                                </View>
                            ) : artesano?.avatar_url || editData.avatar_url ? (
                                <View style={styles.avatarWrapper}>
                                    <Image
                                        source={{ uri: editData.avatar_url || artesano.avatar_url }}
                                        style={styles.avatar}
                                    />
                                    <View style={styles.avatarEditOverlay}>
                                        <MaterialCommunityIcons name="camera" size={20} color="#fff" />
                                    </View>
                                </View>
                            ) : (
                                <View style={styles.defaultAvatar}>
                                    <MaterialCommunityIcons name="account" size={60} color="#666" />
                                    <View style={styles.avatarEditIcon}>
                                        <MaterialCommunityIcons name="camera" size={16} color="#666" />
                                    </View>
                                </View>
                            )}
                        </TouchableOpacity>
                    ) : (
                        <>
                            {artesano?.avatar_url ? (
                                <Image source={{ uri: artesano.avatar_url }} style={styles.avatar} />
                            ) : (
                                <View style={styles.defaultAvatar}>
                                    <MaterialCommunityIcons name="account" size={60} color="#666" />
                                </View>
                            )}
                        </>
                    )}
                </View>
                <View style={styles.statsContainer}>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{publicaciones.length}</Text>
                        <Text style={styles.statLabel}>Publicaciones</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{productos.length}</Text>
                        <Text style={styles.statLabel}>Productos</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={styles.statNumber}>{artesano?.total_likes || 0}</Text>
                        <Text style={styles.statLabel}>Likes</Text>
                    </View>
                </View>
            </View>
            <View style={styles.profileInfo}>
                <Text style={styles.nombre}>{artesano?.nombre || 'No definido'}</Text>
                <Text style={styles.folio}>Folio: {artesano?.folio || 'No definido'}</Text>

                {artesano?.ubicacion && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="map-marker" size={16} color="#666" />
                        <Text style={styles.infoText}>{artesano.ubicacion}</Text>
                    </View>
                )}

                {artesano?.categoria && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="tag" size={16} color="#666" />
                        <Text style={styles.infoText}>{artesano.categoria}</Text>
                    </View>
                )}

                {artesano?.telefono && (
                    <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="phone" size={16} color="#666" />
                        <Text style={styles.infoText}>{artesano.telefono}</Text>
                    </View>
                )}

                {artesano?.descripcion && (
                    <Text style={styles.descripcion}>{artesano.descripcion}</Text>
                )}
            </View>
        </View>
    );

    const renderTabs = () => (
        <View style={styles.tabsContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'publicaciones' && styles.activeTab]}
                onPress={() => setActiveTab('publicaciones')}
            >
                <MaterialCommunityIcons name="image-multiple" size={24} color={activeTab === 'publicaciones' ? '#9D046D' : '#666'} />
            </TouchableOpacity>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'productos' && styles.activeTab]}
                onPress={() => setActiveTab('productos')}
            >
                <MaterialCommunityIcons name="package-variant-closed" size={24} color={activeTab === 'productos' ? '#9D046D' : '#666'} />
            </TouchableOpacity>
        </View>
    );

    const renderPublicacion = ({ item, index }) => (
        // --- MODIFICADO: Ahora es presionable para ver la imagen en grande ---
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => openImageViewer(publicaciones, index)}
            activeOpacity={0.8}
        >
            {item.imagen_url ? (
                <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
            ) : (
                <View style={[styles.gridImage, styles.placeholderImage]}>
                    <MaterialCommunityIcons name="image-off" size={30} color="#ccc" />
                </View>
            )}
        </TouchableOpacity>
    );

    const renderProducto = ({ item, index }) => (
        <TouchableOpacity
            style={styles.gridItem}
            onPress={() => openImageViewer(productos, index)} // MODIFICADO: Abre el visor de imágenes directamente
            activeOpacity={0.7}
        >
            {item.imagen_url ? (
                <Image source={{ uri: item.imagen_url }} style={styles.gridImage} />
            ) : (
                <View style={[styles.gridImage, styles.placeholderImage]}>
                    <MaterialCommunityIcons name="package" size={30} color="#ccc" />
                </View>
            )}
            <View style={styles.overlay}>
                <View style={styles.overlayContent}>
                    <MaterialCommunityIcons name="currency-usd" size={16} color="#fff" />
                    <Text style={styles.overlayText}>{item.precio ? formatPrice(item.precio) : 'N/A'}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderContent = () => {
        if (activeTab === 'publicaciones') {
            if (publicaciones.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="camera-off" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aún no hay publicaciones</Text>
                    </View>
                );
            }
            return (
                <FlatList
                    data={publicaciones}
                    renderItem={renderPublicacion} // FlatList pasa `item` e `index` por defecto
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={3}
                    contentContainerStyle={styles.grid}
                />
            );
        } else if (activeTab === 'productos') {
            if (productos.length === 0) {
                return (
                    <View style={styles.emptyState}>
                        <MaterialCommunityIcons name="basket-off" size={50} color="#ccc" />
                        <Text style={styles.emptyText}>Aún no hay productos a la venta</Text>
                    </View>
                );
            }
            return (
                <FlatList
                    data={productos}
                    renderItem={renderProducto}
                    keyExtractor={(item) => item.id.toString()}
                    numColumns={3}
                    contentContainerStyle={styles.grid}
                />
            );
        }
        return null;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#9D046D" />
                    <Text style={styles.loadingText}>Cargando perfil...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (!artesano) {
        return (
            <SafeAreaView style={styles.container}>
                {renderHeader()}
                <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={50} color="#dc3545" />
                    <Text style={[styles.loadingText, { color: '#dc3545' }]}>
                        Error al cargar el perfil.
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {renderHeader()}
            <View style={styles.contentContainer}>
                <ScrollView>
                    {renderProfileInfo()}
                    {renderTabs()}
                    {renderContent()}
                </ScrollView>
            </View>

            {/* --- NUEVO: Modal Visor de Imágenes --- */}
            <Modal
                visible={showImageViewer}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowImageViewer(false)}
            >
                <View style={styles.imageViewerOverlay} {...imagePanResponder.panHandlers}>
                    <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowImageViewer(false)} />
                    <Animated.View
                        style={[
                            styles.imageViewerContent,
                            {
                                transform: [{ translateX: imageViewerAnim }],
                                opacity: imageViewerAnim.interpolate({
                                    inputRange: [-width, 0, width],
                                    outputRange: [0.5, 1, 0.5],
                                }),
                            },
                        ]}
                    >
                        <Image
                            source={{ uri: activeImageList[selectedImageIndex]?.imagen_url }}
                            style={styles.fullScreenImage}
                            resizeMode="contain"
                        />
                    </Animated.View>

                    {/* Botones de Navegación del Visor */}
                    {selectedImageIndex > 0 && (
                        <TouchableOpacity style={[styles.imageNavButton, styles.imageNavLeft]} onPress={handlePreviousImage}>
                            <MaterialCommunityIcons name="chevron-left" size={36} color="#fff" />
                        </TouchableOpacity>
                    )}
                    {selectedImageIndex < activeImageList.length - 1 && (
                        <TouchableOpacity style={[styles.imageNavButton, styles.imageNavRight]} onPress={handleNextImage}>
                            <MaterialCommunityIcons name="chevron-right" size={36} color="#fff" />
                        </TouchableOpacity>
                    )}

                    {/* Header del Visor */}
                    <TouchableOpacity style={styles.closeImageViewerButton} onPress={() => setShowImageViewer(false)}>
                        <MaterialCommunityIcons name="close" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.imageViewerHeader}>
                        <Text style={styles.imageViewerHeaderText}>{`Foto ${selectedImageIndex + 1} de ${activeImageList.length}`}</Text>
                    </View>
                </View>
            </Modal>

            {/* Modal de Menú de Ajustes */}
            <Modal
                visible={showSettingsMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowSettingsMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowSettingsMenu(false)}
                >
                    <View style={styles.settingsMenu}>
                        <TouchableOpacity
                            style={styles.settingsMenuItem}
                            onPress={() => {
                                setShowSettingsMenu(false);
                                setShowEditModal(true);
                            }}
                        >
                            <MaterialCommunityIcons name="pencil" size={24} color="#333" />
                            <Text style={styles.settingsMenuText}>Editar Perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsMenuItem}
                            onPress={() => {
                                setShowSettingsMenu(false);
                                setShowPasswordModal(true);
                            }}
                        >
                            <MaterialCommunityIcons name="lock-reset" size={24} color="#333" />
                            <Text style={styles.settingsMenuText}>Cambiar Contraseña</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.settingsMenuItem, styles.deleteItem]}
                            onPress={async () => {
                                // Cerrar el menú de ajustes primero
                                setShowSettingsMenu(false);
                                // Pequeño delay para que el menú se cierre antes de mostrar el modal
                                await new Promise(resolve => setTimeout(resolve, 300));
                                // Llamar a la función de eliminación
                                handleDeleteProfile();
                            }}
                        >
                            <MaterialCommunityIcons name="delete" size={24} color="#dc3545" />
                            <Text style={[styles.settingsMenuText, styles.deleteText]}>Eliminar Perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.settingsMenuClose}
                            onPress={() => setShowSettingsMenu(false)}
                        >
                            <Text style={styles.settingsMenuCloseText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de Edición de Perfil */}
            <Modal
                visible={showEditModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowEditModal(false)}
            >
                <View style={styles.editModalContainer}>
                    <View style={styles.editModalContent}>
                        <View style={styles.editModalHeader}>
                            <Text style={styles.editModalTitle}>Editar Perfil</Text>
                            <TouchableOpacity onPress={() => setShowEditModal(false)}>
                                <MaterialCommunityIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={styles.editModalBody}>
                            <View style={styles.avatarEditSection}>
                                <TouchableOpacity style={styles.avatarButton} onPress={selectAvatarImageFromEdit}>
                                    {uploadingAvatar ? (
                                        <View style={styles.avatarPlaceholder}>
                                            <ActivityIndicator size="large" color="#9D046D" />
                                        </View>
                                    ) : editData.avatar_url ? (
                                        <Image source={{ uri: editData.avatar_url }} style={styles.avatarPreview} />
                                    ) : artesano?.avatar_url ? (
                                        <Image source={{ uri: artesano.avatar_url }} style={styles.avatarPreview} />
                                    ) : (
                                        <View style={styles.avatarPlaceholder}>
                                            <MaterialCommunityIcons name="camera" size={30} color="#666" />
                                        </View>
                                    )}
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={styles.changeAvatarButton}
                                    onPress={selectAvatarImageFromEdit}
                                    disabled={uploadingAvatar}
                                >
                                    <MaterialCommunityIcons name="camera-plus" size={20} color="#177eaaff" />
                                    <Text style={styles.changeAvatarButtonText}>
                                        {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Nombre</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.nombre}
                                    onChangeText={(text) => setEditData({ ...editData, nombre: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Correo electrónico</Text>
                                <TextInput
                                    style={[styles.input, styles.inputDisabled]}
                                    value={session?.user?.email || ''}
                                    editable={false}
                                    placeholder="correo@ejemplo.com"
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Teléfono</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.telefono}
                                    onChangeText={(text) => setEditData({ ...editData, telefono: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Ubicación</Text>
                                <TextInput
                                    style={styles.input}
                                    value={editData.ubicacion}
                                    onChangeText={(text) => setEditData({ ...editData, ubicacion: text })}
                                />
                            </View>

                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Descripción</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={editData.descripcion}
                                    onChangeText={(text) => setEditData({ ...editData, descripcion: text })}
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>
                        </ScrollView>
                        <View style={styles.editModalFooter}>
                            <TouchableOpacity style={styles.saveButtonModal} onPress={handleEditProfile}>
                                <Text style={styles.saveButtonText}>Guardar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Cambiar Contraseña */}
            <ChangePasswordModal
                visible={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                onSuccess={handlePasswordChangeSuccess}
            />

            {/* Modal de Menú de Avatar (Aparentemente no se utiliza, ya que la selección es directa) */}
            <Modal
                visible={showAvatarMenu}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowAvatarMenu(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowAvatarMenu(false)}
                >
                    <View style={styles.avatarMenu}>
                        <TouchableOpacity
                            style={styles.avatarMenuItem}
                            onPress={selectAvatarImageFromEdit}
                        >
                            <MaterialCommunityIcons name="camera" size={24} color="#333" />
                            <Text style={styles.avatarMenuText}>Cambiar foto de perfil</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.avatarMenuClose}
                            onPress={() => setShowAvatarMenu(false)}
                        >
                            <Text style={styles.avatarMenuCloseText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de Eliminación de Perfil */}
            {showDeleteProfile && (
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Eliminar Perfil</Text>
                            <TouchableOpacity onPress={handleCancelDeleteProfile}>
                                <MaterialCommunityIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalBody}>
                            <View style={styles.deleteForm}>
                                <Text style={styles.deleteWarning}>¡Advertencia!</Text>

                                <Text style={styles.deleteDescription}>
                                    Para confirmar la eliminación permanente de tu perfil, debes ingresar tu contraseña actual:
                                </Text>

                                <View style={styles.deleteList}>
                                    <Text style={styles.deleteDescription}>El proceso de eliminación incluye:</Text>
                                    <Text style={styles.deleteListText}>• Perfil de artesano y datos personales.</Text>
                                    <Text style={styles.deleteListText}>• Todas las fotos de avatar e imágenes asociadas.</Text>
                                    <Text style={styles.deleteListText}>• Todos tus productos y publicaciones.</Text>
                                    <Text style={styles.deleteListText}>• El cierre de tu sesión actual.</Text>
                                </View>

                                <View style={styles.passwordInputContainer}>
                                    <Text style={styles.passwordLabel}>Contraseña actual:</Text>
                                    <View style={styles.passwordInputWrapper}>
                                        <TextInput
                                            style={styles.passwordInput}
                                            value={deletePasswordData.currentPassword}
                                            onChangeText={handleDeletePasswordInputChange}
                                            secureTextEntry={!showDeletePassword}
                                            placeholder="Ingresa tu contraseña"
                                            editable={!deletePasswordValidated && !deletePasswordBlocked}
                                        />
                                        <TouchableOpacity
                                            style={styles.eyeButton}
                                            onPress={() => setShowDeletePassword(!showDeletePassword)}
                                        >
                                            <MaterialCommunityIcons
                                                name={showDeletePassword ? "eye-off" : "eye"}
                                                size={20}
                                                color="#666"
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Botón de verificación para eliminación */}
                                {!deletePasswordValidated && (
                                    <TouchableOpacity
                                        style={[
                                            styles.verifyButton,
                                            deletePasswordBlocked && styles.verifyButtonDisabled,
                                            deletePasswordBlocked && styles.verifyButtonBlocked
                                        ]}
                                        onPress={handleVerifyDeletePassword}
                                        disabled={deletePasswordLoading || !deletePasswordData.currentPassword.trim() || deletePasswordBlocked}
                                    >
                                        {deletePasswordBlocked ? (
                                            <>
                                                <MaterialCommunityIcons name="lock" size={20} color="#999" />
                                                <Text style={styles.verifyButtonTextDisabled}>Bloqueado</Text>
                                            </>
                                        ) : (
                                            <>
                                                <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                                                <Text style={styles.verifyButtonText}>Verificar contraseña</Text>
                                            </>
                                        )}
                                    </TouchableOpacity>
                                )}

                                {deletePasswordAttempts > 0 && !deletePasswordValidated && (
                                    <Text style={styles.errorText}>
                                        Contraseña incorrecta. Intentos restantes: {3 - deletePasswordAttempts}
                                    </Text>
                                )}

                                {deletePasswordValidated && (
                                    <Text style={[styles.successText, { marginTop: 10 }]}>
                                        Contraseña verificada. Presiona ELIMINAR para finalizar.
                                    </Text>
                                )}
                            </View>
                        </ScrollView>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={styles.cancelButton}
                                onPress={handleCancelDeleteProfile}
                                disabled={deletePasswordLoading}
                            >
                                <Text style={styles.cancelButtonText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.deleteConfirmButton, !deletePasswordValidated && styles.deleteConfirmButtonDisabled]}
                                onPress={handleConfirmDeleteProfile}
                                disabled={!deletePasswordValidated || deletePasswordLoading}
                            >
                                {deletePasswordLoading ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <>
                                        <MaterialCommunityIcons name="delete-forever" size={20} color="#fff" />
                                        <Text style={styles.deleteConfirmButtonText}>ELIMINAR DEFINITIVAMENTE</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            )}

            {/* Modal de detalles de producto (Nota: El código original lo define, pero se prefiere el visor de imágenes) */}
            <Modal
                visible={showProductoModal}
                transparent={true}
                animationType="slide"
                onRequestClose={handleCloseProductoModal}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent} {...productoPanResponder.panHandlers}>
                        <View style={styles.modalHeader}>
                            <View style={styles.headerLeft}>
                                {selectedProductoIndex > 0 && (
                                    <TouchableOpacity style={styles.navButton} onPress={handlePreviousProducto}>
                                        <MaterialCommunityIcons name="chevron-left" size={24} color="#333" />
                                    </TouchableOpacity>
                                )}
                                <Text style={styles.modalTitle}>
                                    Producto {selectedProductoIndex + 1} de {productos.length}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={handleCloseProductoModal}>
                                <MaterialCommunityIcons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        <Animated.View
                            style={[
                                styles.modalBody,
                                {
                                    transform: [{ translateX: productoSliderAnim }],
                                    opacity: productoSliderAnim.interpolate({
                                        inputRange: [-200, 0, 200],
                                        outputRange: [0.5, 1, 0.5],
                                    }),
                                },
                            ]}
                        >
                            <ScrollView>
                                {selectedProducto && (
                                    <>
                                        {/* Imagen */}
                                        {selectedProducto.imagen_url ? (
                                            <Image source={{ uri: selectedProducto.imagen_url }} style={styles.modalImage} />
                                        ) : (
                                            <View style={styles.modalImagePlaceholder}>
                                                <MaterialCommunityIcons name="package" size={50} color="#ccc" />
                                            </View>
                                        )}

                                        <View style={styles.modalInfo}>
                                            <Text style={styles.nombre}>{selectedProducto.nombre}</Text>

                                            <View style={styles.infoRowModal}>
                                                <MaterialCommunityIcons name="currency-usd" size={20} color="#9D046D" />
                                                <Text style={styles.infoLabel}>Precio:</Text>
                                                <Text style={styles.infoValue}>{selectedProducto.precio ? formatPrice(selectedProducto.precio) : 'N/A'}</Text>
                                            </View>

                                            <View style={styles.infoRowModal}>
                                                <MaterialCommunityIcons name="calendar" size={20} color="#9D046D" />
                                                <Text style={styles.infoLabel}>Publicado:</Text>
                                                <Text style={styles.infoValue}>{formatDate(selectedProducto.created_at)}</Text>
                                            </View>

                                            <View style={styles.textSection}>
                                                <Text style={styles.textLabel}>Descripción:</Text>
                                                <Text style={styles.textContent}>{selectedProducto.descripcion || 'Sin descripción.'}</Text>
                                            </View>
                                        </View>
                                    </>
                                )}
                            </ScrollView>
                        </Animated.View>

                        <View style={styles.modalNavigation}>
                            <TouchableOpacity
                                style={[styles.navButton, selectedProductoIndex === 0 && styles.navButtonDisabled]}
                                onPress={handlePreviousProducto}
                                disabled={selectedProductoIndex === 0}
                            >
                                <MaterialCommunityIcons name="chevron-left" size={24} color={selectedProductoIndex === 0 ? '#ccc' : '#333'} />
                                <Text style={[styles.navButtonText, selectedProductoIndex === 0 && styles.navButtonTextDisabled]}>
                                    Anterior
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.navButton, selectedProductoIndex === productos.length - 1 && styles.navButtonDisabled]}
                                onPress={handleNextProducto}
                                disabled={selectedProductoIndex === productos.length - 1}
                            >
                                <Text style={[styles.navButtonText, selectedProductoIndex === productos.length - 1 && styles.navButtonTextDisabled]}>
                                    Siguiente
                                </Text>
                                <MaterialCommunityIcons name="chevron-right" size={24} color={selectedProductoIndex === productos.length - 1 ? '#ccc' : '#333'} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    // --- Estilos de Cabecera (Header) ---
    header: {
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerTop: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 40,
    },
    // --- Estilos de Carga/Error ---
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyErrorText: {
        marginTop: 10,
        fontSize: 16,
        color: '#666',
    },
    // --- Estilos de Contenido (Profile Info) ---
    contentContainer: {
        flex: 1,
    },
    profileSection: {
        padding: 16,
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    avatarContainer: {
        marginRight: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#f0f0f0',
    },
    avatarWrapper: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    avatarLoadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 40,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
    },
    avatarEditOverlay: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 15,
        padding: 4,
        borderWidth: 2,
        borderColor: '#fff',
    },
    avatarEditIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 2,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    defaultAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    statsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    statItem: {
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    statLabel: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    profileInfo: {
        marginTop: 10,
    },
    nombre: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    folio: {
        fontSize: 14,
        color: '#9D046D',
        fontWeight: '600',
        marginBottom: 10,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    infoText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 8,
    },
    descripcion: {
        fontSize: 14,
        color: '#333',
        marginTop: 10,
        lineHeight: 20,
    },
    // --- Estilos de Pestañas (Tabs) ---
    tabsContainer: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
    },
    activeTab: {
        borderBottomWidth: 2,
        borderBottomColor: '#9D046D',
    },
    // --- Estilos de Grid de Contenido (Publicaciones/Productos) ---
    grid: {
        paddingHorizontal: 10,
        paddingVertical: 10,
    },
    gridItem: {
        width: imageSize,
        height: imageSize,
        margin: 5,
        position: 'relative',
        borderRadius: 8,
        overflow: 'hidden',
    },
    gridImage: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    placeholderImage: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    overlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderTopLeftRadius: 8,
    },
    overlayContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    overlayText: {
        color: '#fff',
        fontSize: 12,
        marginLeft: 4,
        fontWeight: 'bold',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginTop: 16,
    },
    // --- Estilos para Modales Generales ---
    modalOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    // --- Estilos para Menú de Ajustes ---
    settingsMenu: {
        backgroundColor: '#fff',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    settingsMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    deleteItem: {
        borderBottomColor: '#ffebee',
    },
    settingsMenuText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 16,
    },
    deleteText: {
        color: '#dc3545',
    },
    settingsMenuClose: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
    },
    settingsMenuCloseText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    // --- Estilos para Modal de Edición ---
    editModalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    editModalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '80%',
    },
    editModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    editModalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    editModalBody: {
        padding: 20,
    },
    inputGroup: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        color: '#333',
        backgroundColor: '#fff',
    },
    inputDisabled: {
        backgroundColor: '#f0f0f0',
        color: '#999',
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
        paddingVertical: 12,
    },
    editModalFooter: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    saveButtonModal: {
        backgroundColor: '#9D046D',
        padding: 15,
        borderRadius: 10,
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    // Estilos para edición de avatar en modal
    avatarEditSection: {
        marginBottom: 20,
        alignItems: 'center',
    },
    avatarButton: {
        marginBottom: 12,
    },
    avatarPreview: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 3,
        borderColor: '#9D046D',
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e0e0e0',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#9D046D',
    },
    changeAvatarButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f0f0f0',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    changeAvatarButtonText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#9D046D',
        fontWeight: '600',
    },
    // --- Estilos para Menú de Avatar (Similar a Settings Menu) ---
    avatarMenu: {
        backgroundColor: '#fff',
        width: '100%',
        position: 'absolute',
        bottom: 0,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: 20,
    },
    avatarMenuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarMenuText: {
        fontSize: 16,
        color: '#333',
        marginLeft: 16,
    },
    avatarMenuClose: {
        paddingVertical: 16,
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        marginTop: 8,
    },
    avatarMenuCloseText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
    },
    // --- Estilos para Modal de Eliminación (Delete Profile) ---
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        width: '90%',
        maxWidth: 400,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 4,
    },
    deleteForm: {
        padding: 10,
    },
    deleteWarning: {
        color: '#dc3545',
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 16,
    },
    deleteDescription: {
        color: '#333',
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    deleteList: {
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
        marginBottom: 20,
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 8,
        borderLeftWidth: 4,
        borderLeftColor: '#dc3545',
    },
    deleteListText: {
        color: '#666',
        fontSize: 14,
        lineHeight: 20,
    },
    passwordInputContainer: {
        marginBottom: 15,
        marginTop: 10,
    },
    passwordLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    passwordInputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        backgroundColor: '#fff',
    },
    passwordInput: {
        flex: 1,
        paddingHorizontal: 12,
        paddingVertical: 12,
        fontSize: 16,
        color: '#333',
    },
    eyeButton: {
        padding: 12,
    },
    verifyButton: {
        backgroundColor: '#9D046D',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 10,
    },
    verifyButtonDisabled: {
        backgroundColor: '#e0e0e0',
        borderWidth: 1,
        borderColor: '#ccc',
    },
    verifyButtonBlocked: {
        backgroundColor: '#ffbaba', // Rojo claro para bloqueo
        borderWidth: 1,
        borderColor: '#dc3545',
    },
    verifyButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    verifyButtonTextDisabled: {
        color: '#999',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    errorText: {
        color: '#dc3545',
        textAlign: 'center',
        marginTop: 5,
        fontSize: 14,
    },
    successText: {
        color: '#28a745',
        textAlign: 'center',
        marginTop: 5,
        fontSize: 14,
        fontWeight: 'bold',
    },
    modalActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: '#ccc',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    cancelButtonText: {
        color: '#333',
        fontSize: 16,
        fontWeight: 'bold',
    },
    deleteConfirmButton: {
        flex: 1,
        backgroundColor: '#dc3545',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        marginLeft: 10,
    },
    deleteConfirmButtonDisabled: {
        backgroundColor: '#ffcdd2',
    },
    deleteConfirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    // --- NUEVO: Estilos para el Visor de Imágenes ---
    imageViewerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    imageViewerContent: {
        width: width,
        height: '70%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullScreenImage: {
        width: '100%',
        height: '100%',
    },
    closeImageViewerButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        padding: 10,
        zIndex: 10,
        backgroundColor: 'rgba(51, 51, 51, 0.5)',
        borderRadius: 20,
    },
    imageViewerHeader: {
        position: 'absolute',
        bottom: 40,
        padding: 10,
        backgroundColor: 'rgba(51, 51, 51, 0.5)',
        borderRadius: 10,
    },
    imageViewerHeaderText: {
        color: '#fff',
        fontSize: 16,
    },
    imageNavButton: {
        position: 'absolute',
        top: '50%',
        marginTop: -30,
        padding: 10,
        backgroundColor: 'rgba(51, 51, 51, 0.5)',
        borderRadius: 30,
        zIndex: 5,
    },
    imageNavLeft: {
        left: 20,
    },
    imageNavRight: {
        right: 20,
    },
    // --- Estilos para Modal de Producto (Detalle) ---
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '85%',
        width: '100%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 10,
    },
    modalBody: {
        maxHeight: 400,
    },
    modalImage: {
        width: '100%',
        height: 250,
        backgroundColor: '#f0f0f0',
    },
    modalImagePlaceholder: {
        width: '100%',
        height: 250,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalInfo: {
        padding: 20,
    },
    infoRowModal: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 15,
    },
    infoLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginLeft: 10,
        marginRight: 10,
    },
    infoValue: {
        fontSize: 16,
        color: '#666',
        flex: 1,
    },
    textSection: {
        marginTop: 10,
    },
    textLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    textContent: {
        fontSize: 15,
        color: '#666',
        lineHeight: 22,
    },
    modalNavigation: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    navButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navButtonDisabled: {
        opacity: 0.5,
    },
    navButtonText: {
        fontSize: 16,
        color: '#333',
        fontWeight: '600',
        marginHorizontal: 5,
    },
    navButtonTextDisabled: {
        color: '#ccc',
    },
});

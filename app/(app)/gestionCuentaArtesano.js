// app/(app)/gestionCuentaArtesano.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text as DefaultText,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";
import useCustomFonts from "../../hooks/useFonts";
import { supabase } from "../../src/supabase/client";
import { artesanoService } from "../../src/services/artesanoService";
import { validateCurrentPassword } from "../../src/services/profileInfo"; // Asumo que esta función es genérica
import { useAuth } from "../../src/context/AuthContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";
import EditArtesanoProfileModal from "../../components/EditArtesanoProfileModal"; // Ruta corregida
import DeleteProfileModal from "../../components/DeleteProfileModal";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Componente Text personalizado
const Text = (props) => {
  const { style, children, ...otherProps } = props;
  return (
    <DefaultText {...otherProps} style={[{ fontFamily: "Alan Sans" }, style]}>
      {children}
    </DefaultText>
  );
};

export default function GestionCuentaArtesano() {
  const { signOut, session } = useAuth();
  const fontsLoaded = useCustomFonts();
  const router = useRouter();

  const [showChangePassword, setShowChangePassword] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [isGoogleUser, setIsGoogleUser] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false); // 2. Estado para el nuevo modal
  const [artesanoProfile, setArtesanoProfile] = useState(null); // 3. Estado para guardar los datos del artesano
  const [loadingProfile, setLoadingProfile] = useState(false);

  // --- Estados para la eliminación de perfil ---
  const [showDeleteProfile, setShowDeleteProfile] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deletePasswordLoading, setDeletePasswordLoading] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deletePasswordValidated, setDeletePasswordValidated] = useState(false);
  const [deletePasswordAttempts, setDeletePasswordAttempts] = useState(0);
  const [deletePasswordBlocked, setDeletePasswordBlocked] = useState(false);
  const [deleteBlockTimeRemaining, setDeleteBlockTimeRemaining] = useState(0);
  const deletePasswordAttemptsRef = useRef(0);

  // --- Fin de estados de eliminación ---
  const userId = session?.user?.id;

  const checkUserProvider = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user && user.app_metadata && user.app_metadata.provider) {
        setIsGoogleUser(user.app_metadata.provider === "google");
      }
    } catch (error) {
      console.error("Error checking user provider:", error);
    }
  };

  useEffect(() => {
    const loadAttempts = async () => {
      if (!userId) return;
      const attempts = await AsyncStorage.getItem(
        `deleteFailedAttempts_${userId}`,
      );
      if (attempts) {
        deletePasswordAttemptsRef.current = parseInt(attempts, 10);
      }
    };
    loadAttempts();
    checkUserProvider();
  }, [userId]);

  // --- useEffect para el temporizador de bloqueo ---
  useEffect(() => {
    let interval;
    if (deletePasswordBlocked && deleteBlockTimeRemaining > 0) {
      interval = setInterval(() => {
        setDeleteBlockTimeRemaining((prev) => {
          if (prev <= 1) {
            setDeletePasswordBlocked(false);
            setDeletePasswordAttempts(0);
            deletePasswordAttemptsRef.current = 0;
            if (userId)
              AsyncStorage.removeItem(`deleteFailedAttempts_${userId}`);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [deletePasswordBlocked, deleteBlockTimeRemaining, userId]);

  const handleOpenDeleteModal = () => {
    if (deletePasswordBlocked) {
      Alert.alert(
        "Acceso bloqueado",
        `Has excedido el número de intentos. Inténtalo de nuevo en ${Math.ceil(deleteBlockTimeRemaining / 60)} minutos.`,
      );
      return;
    }
    setShowDeleteProfile(true);
    setDeletePassword("");
    setDeletePasswordValidated(false);
    setDeletePasswordAttempts(0);
    // No reseteamos el ref aquí para mantener el conteo entre aperturas de modal
  };

  // 4. Función para abrir el modal de edición
  const handleEditProfile = async () => {
    setLoadingProfile(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No se encontró la sesión del usuario.");

      const { artesano, error } = await artesanoService.getArtesanoCompleto(
        user.id,
      );
      if (error) throw new Error(error);

      setArtesanoProfile(artesano);
      setShowEditProfileModal(true);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message || "No se pudo cargar el perfil para editar.",
      );
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleChangePassword = () => {
    if (isGoogleUser) {
      Alert.alert(
        "Información",
        "No puedes cambiar la contraseña de una cuenta de Google desde aquí.",
      );
      return;
    }
    setShowChangePassword(true);
  };

  const handlePasswordChangeSuccess = () => {
    setShowChangePassword(false);
    Alert.alert("Éxito", "Contraseña cambiada. Serás redirigido al login.", [
      { text: "OK", onPress: () => signOut() },
    ]);
  };

  const handleRecoverAccount = () => {
    if (isGoogleUser) {
      Alert.alert(
        "Recuperar Cuenta de Google",
        "Tu cuenta está gestionada por Google. Si no puedes acceder, utiliza las opciones de recuperación de tu cuenta de Google directamente.",
      );
    } else {
      Alert.alert(
        "Recuperar Cuenta",
        "Para recuperar tu cuenta si olvidas la contraseña, cierra la sesión actual y utiliza la opción '¿Olvidaste tu contraseña?' en la pantalla de inicio de sesión.",
      );
    }
  };

  const handleDeleteProfile = () => {
    if (isGoogleUser) {
      Alert.alert(
        "Eliminar Cuenta de Google",
        "Para eliminar una cuenta asociada a Google, por favor contacta a soporte. Esta función se está implementando para mayor seguridad.",
        [{ text: "Entendido" }],
      );
    } else {
      handleOpenDeleteModal();
    }
  };

  // --- Lógica de eliminación de perfil con contraseña ---
  const handleVerifyDeletePassword = async () => {
    if (!deletePassword.trim()) {
      Alert.alert("Error", "Por favor, ingresa tu contraseña actual.");
      return;
    }
    setDeletePasswordLoading(true);
    try {
      const { data, error } = await validateCurrentPassword(deletePassword);
      if (error || !data) {
        deletePasswordAttemptsRef.current += 1;
        const currentAttempts = deletePasswordAttemptsRef.current;
        setDeletePasswordAttempts(currentAttempts);
        if (userId)
          await AsyncStorage.setItem(
            `deleteFailedAttempts_${userId}`,
            currentAttempts.toString(),
          );

        if (currentAttempts >= 3) {
          setDeletePasswordBlocked(true);
          setDeleteBlockTimeRemaining(300); // 5 minutos
          setShowDeleteProfile(false);
          Alert.alert(
            "Acceso Bloqueado",
            "Has excedido el número de intentos. El acceso a esta función se ha bloqueado por 5 minutos.",
          );
        } else {
          Alert.alert(
            "Contraseña Incorrecta",
            `Te quedan ${3 - currentAttempts} intentos.`,
          );
        }
        setDeletePasswordValidated(false);
      } else {
        setDeletePasswordValidated(true);
        setDeletePasswordAttempts(0);
        deletePasswordAttemptsRef.current = 0;
        if (userId)
          await AsyncStorage.removeItem(`deleteFailedAttempts_${userId}`);
        Alert.alert(
          "Éxito",
          "Contraseña verificada. Ahora puedes eliminar tu perfil.",
        );
      }
    } catch (_) {
      Alert.alert("Error", "Ocurrió un error al verificar la contraseña.");
    } finally {
      setDeletePasswordLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletePasswordValidated) {
      Alert.alert("Error", "Debes verificar tu contraseña primero.");
      return;
    }

    Alert.alert(
      "Confirmación Final",
      "Esta acción es irreversible y eliminará todos tus datos, incluyendo productos y publicaciones. ¿Estás seguro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "ELIMINAR DEFINITIVAMENTE",
          style: "destructive",
          onPress: async () => {
            setIsDeletingProfile(true);
            setShowDeleteProfile(false);
            try {
              const { error } = await artesanoService.deleteArtesanoProfile(
                session.user.id,
              );
              if (error) throw new Error(error);

              Alert.alert(
                "Perfil Eliminado",
                "Tu perfil ha sido eliminado exitosamente. Serás desconectado.",
                [{ text: "OK", onPress: () => signOut() }],
              );
            } catch (e) {
              Alert.alert(
                "Error",
                e.message || "No se pudo eliminar el perfil.",
              );
              setIsDeletingProfile(false);
            }
          },
        },
      ],
    );
  };

  const handleCloseDeleteModal = () => {
    setShowDeleteProfile(false);
    setDeletePassword("");
    setDeletePasswordValidated(false);
    setDeletePasswordAttempts(0);
    setDeletePasswordLoading(false);
  };

  const handleTogglePasswordVisibility = () => {
    setShowDeletePassword((prev) => !prev);
  };

  // --- Fin de la lógica de eliminación ---

  if (!fontsLoaded) {
    return (
      <ActivityIndicator
        size="large"
        color="#9D046D"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  if (isDeletingProfile) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color="#9D046D" />
        <Text style={{ marginTop: 20, fontSize: 18, color: "#333" }}>
          Eliminando tu cuenta...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Gestión de la Cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>Perfil</Text>

        {/* Botón Editar Perfil */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleEditProfile}
          disabled={loadingProfile}
        >
          {loadingProfile ? (
            <ActivityIndicator size="small" color="#9D046D" />
          ) : (
            <MaterialCommunityIcons
              name="account-edit-outline"
              size={24}
              color={"#9D046D"}
            />
          )}
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.menuItemText}>Editar Perfil</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={"#333"}
          />
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Seguridad</Text>

        {/* Botón Cambiar Contraseña (solo para usuarios manuales) */}
        {!isGoogleUser && (
          <TouchableOpacity
            style={styles.menuItem}
            onPress={handleChangePassword}
          >
            <MaterialCommunityIcons
              name="lock-reset"
              size={24}
              color={"#9D046D"}
            />
            <View style={{ flex: 1, marginLeft: 15 }}>
              <Text style={styles.menuItemText}>Cambiar Contraseña</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color={"#333"}
            />
          </TouchableOpacity>
        )}

        {/* Botón Recuperar Cuenta */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={handleRecoverAccount}
        >
          <MaterialCommunityIcons
            name="account-question-outline"
            size={24}
            color={"#9D046D"}
          />
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={styles.menuItemText}>Recuperar Cuenta</Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color={"#333"}
          />
        </TouchableOpacity>

        <View style={styles.separator} />

        <Text style={styles.sectionTitle}>Zona de Peligro</Text>

        {/* Botón Eliminar Perfil */}
        <TouchableOpacity style={styles.menuItem} onPress={handleDeleteProfile}>
          <MaterialCommunityIcons
            name="delete-forever-outline"
            size={24}
            color="#db4437"
          />
          <View style={{ flex: 1, marginLeft: 15 }}>
            <Text style={[styles.menuItemText, { color: "#db4437" }]}>
              Eliminar Perfil
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={24}
            color="#db4437"
          />
        </TouchableOpacity>
        <Text style={styles.infoText}>
          Esta acción es irreversible y eliminará todos tus datos de la
          aplicación.
        </Text>
      </ScrollView>

      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
      />

      {/* 5. Renderizar el nuevo modal de edición */}
      {artesanoProfile && (
        <EditArtesanoProfileModal
          visible={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          artesano={artesanoProfile}
          onProfileUpdate={() => {
            setShowEditProfileModal(false);
          }}
        />
      )}

      {/* Modal de eliminación de perfil con validación de contraseña */}
      <DeleteProfileModal
        visible={showDeleteProfile}
        onClose={handleCloseDeleteModal}
        passwordData={deletePassword}
        onPasswordChange={setDeletePassword}
        onVerifyPassword={handleVerifyDeletePassword}
        onConfirmDelete={handleConfirmDelete}
        deletePasswordValidated={deletePasswordValidated}
        deletePasswordAttempts={deletePasswordAttempts}
        deletePasswordLoading={deletePasswordLoading}
        showDeletePassword={showDeletePassword}
        onTogglePasswordVisibility={handleTogglePasswordVisibility}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 15,
    marginTop: 10,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  infoText: {
    fontSize: 13,
    color: "#666",
    marginLeft: 50,
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});

GestionCuentaArtesano.displayName = "GestionCuentaArtesano";

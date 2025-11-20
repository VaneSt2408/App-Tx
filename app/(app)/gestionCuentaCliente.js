// app/(app)/gestionCuentaCliente.js
import React, { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
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
import { useRouter } from "expo-router";
import useCustomFonts from "../../hooks/useFonts";
import { supabase } from "../../src/supabase/client";
import {
  deleteClientProfile,
  deleteGoogleClientProfile,
} from "../../src/services/profileInfo";
import { useAuth } from "../../src/context/AuthContext";
import ChangePasswordModal from "../../components/ChangePasswordModal";

// Componente Text personalizado - CORREGIDO
const Text = (props) => {
  const { style, children, ...otherProps } = props;
  return (
    <DefaultText {...otherProps} style={[{ fontFamily: "AlanSans" }, style]}>
      {children}
    </DefaultText>
  );
};

export default function GestionCuentaCliente() {
  const { signOut, session } = useAuth();
  const fontsLoaded = useCustomFonts();
  const router = useRouter();

  // Estados para cambio de contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);

  // --- CORRECCIÓN 1: Renombrar estado para mayor claridad ---
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);

  const [isGoogleUser, setIsGoogleUser] = useState(false);

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
    checkUserProvider();
  }, []);

  // --- Funciones para cambio de contraseña ---
  const handleChangePassword = () => {
    if (isGoogleUser) {
      Alert.alert(
        "Información",
        "No puedes cambiar la contraseña de una cuenta de Google desde aquí."
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
        "Tu cuenta está gestionada por Google. Si no puedes acceder, utiliza las opciones de recuperación de tu cuenta de Google directamente."
      );
    } else {
      Alert.alert(
        "Recuperar Cuenta",
        "Para recuperar tu cuenta si olvidas la contraseña, cierra la sesión actual y utiliza la opción '¿Olvidaste tu contraseña?' en la pantalla de inicio de sesión."
      );
    }
  };

  // --- Funciones para eliminar perfil ---
  const handleDeleteProfile = () => {
    if (isGoogleUser) {
      Alert.alert(
        "Eliminar Cuenta de Google",
        "Estás a punto de eliminar tu cuenta. Esta acción es irreversible. ¿Estás seguro?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: handleConfirmDeleteGoogleProfile,
          },
        ]
      );
    } else {
      Alert.alert(
        "Eliminar Cuenta",
        "Estás a punto de eliminar tu cuenta. Esta acción es irreversible. ¿Estás seguro?",
        [
          { text: "Cancelar", style: "cancel" },
          {
            text: "Eliminar",
            style: "destructive",
            onPress: handleConfirmDeleteProfile,
          },
        ]
      );
    }
  };

  const handleConfirmDeleteProfile = async () => {
    // --- CORRECCIÓN 1 ---
    setIsDeletingProfile(true);
    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario.");
      }

      const { error } = await deleteClientProfile(userId);
      if (error) {
        throw error;
      }

      Alert.alert(
        "Cuenta Eliminada",
        "Tu cuenta ha sido eliminada exitosamente.",
        [{ text: "OK", onPress: signOut }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      // --- CORRECCIÓN 1 ---
      setIsDeletingProfile(false);
    }
  };

  const handleConfirmDeleteGoogleProfile = async () => {
    // --- CORRECCIÓN 1 ---
    setIsDeletingProfile(true);
    try {
      const userId = session?.user?.id;
      if (!userId) {
        throw new Error("No se pudo obtener el ID del usuario.");
      }

      const { error } = await deleteClientProfile(userId); // Reutilizamos la misma función
      if (error) {
        throw error;
      }

      Alert.alert(
        "Cuenta Eliminada",
        "Tu cuenta de Google ha sido desvinculada y tus datos eliminados.",
        [{ text: "OK", onPress: signOut }]
      );
    } catch (error) {
      Alert.alert("Error", error.message);
    } finally {
      // --- CORRECCIÓN 1 ---
      setIsDeletingProfile(false);
    }
  };

  if (!fontsLoaded) {
    return (
      <ActivityIndicator
        size="large"
        color="#9D046D"
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      />
    );
  }

  // --- CORRECCIÓN 2: Mostrar feedback visual al eliminar ---
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
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestión de la Cuenta</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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

      {/* --- MODAL DE CAMBIO DE CONTRASEÑA --- */}
      <ChangePasswordModal
        visible={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onSuccess={handlePasswordChangeSuccess}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
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
    shadowOpacity: 0.1,
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
    marginLeft: 50, // Ajustado para alinearlo con el texto de los botones
    marginBottom: 20,
  },
  separator: {
    height: 1,
    backgroundColor: "#e0e0e0",
    marginVertical: 20,
  },
});

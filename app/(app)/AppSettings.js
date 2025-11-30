import React, { useState, useEffect } from "react";
import {
  View,
  Text as DefaultText,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  cacheDirectory,
  documentDirectory,
  readDirectoryAsync,
  makeDirectoryAsync,
  deleteAsync,
  getInfoAsync,
} from "expo-file-system/legacy";

const AppSettingsScreen = () => {
  const router = useRouter();
  // En una implementación real, este estado vendría de un contexto o AsyncStorage
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [cacheSize, setCacheSize] = useState("Calculando...");

  const Text = (props) => (
      <DefaultText {...props} style={[{ fontFamily: 'Alan Sans' }, props.style]} />
    );
  // Función para formatear bytes a un formato legible (KB, MB, GB)
  const formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Función para calcular el tamaño del caché
  const calculateCacheSize = async () => {
    try {
      const cacheDirUri = cacheDirectory || `${documentDirectory}cache/`;
      const dirInfo = await getInfoAsync(cacheDirUri);

      if (!dirInfo.exists) {
        setCacheSize("0 Bytes");
        return;
      }

      const files = await readDirectoryAsync(cacheDirUri);
      const fileInfos = await Promise.all(
        files.map((file) => getInfoAsync(`${cacheDirUri}${file}`))
      );
      const totalSize = fileInfos.reduce(
        (acc, fileInfo) =>
          acc + (fileInfo.exists && !fileInfo.isDirectory ? fileInfo.size : 0),
        0
      );

      setCacheSize(formatBytes(totalSize));
    } catch (error) {
      setCacheSize("Error");
    }
  };

  // Calcular el tamaño del caché al cargar la pantalla
  useEffect(() => {
    calculateCacheSize();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode((previousState) => !previousState);
    // Aquí iría la lógica para cambiar el tema de toda la app
    Alert.alert(
      "Próximamente",
      "La función de cambio de tema estará disponible pronto."
    );
  };

  const performClearCache = async () => {
    console.log("--- [Limpiar Caché] Iniciando proceso de limpieza. ---");
    try {
      // Método más robusto: construir una ruta de caché segura
      const cacheDirUri = cacheDirectory || `${documentDirectory}cache/`;
      console.log(`[Limpiar Caché] Directorio de caché a limpiar: ${cacheDirUri}`);

      // 1. Asegurarnos de que el directorio exista
      const dirInfo = await getInfoAsync(cacheDirUri);
      console.log("[Limpiar Caché] Información del directorio:", dirInfo);

      if (!dirInfo.exists) {
        // Si no existe, lo creamos. No hay nada que borrar.
        console.log("[Limpiar Caché] El directorio no existe. Creándolo y finalizando.");
        await makeDirectoryAsync(cacheDirUri, { intermediates: true });
        Alert.alert("Éxito", "El caché ya estaba limpio.");
        return;
      }

      // 2. Leer los archivos dentro del directorio
      const files = await readDirectoryAsync(cacheDirUri);
      console.log(`[Limpiar Caché] Se encontraron ${files.length} archivos en el directorio.`);

      // NUEVO: Filtrar la lista de archivos para excluir las fuentes (.ttf)
      const filesToDelete = files.filter(file => !file.endsWith('.ttf'));
      console.log(`[Limpiar Caché] Excluyendo fuentes. Archivos a borrar: ${filesToDelete.length}`);

      if (filesToDelete.length === 0) {
        console.log("[Limpiar Caché] No hay archivos (que no sean fuentes) para borrar. Proceso finalizado.");
        Alert.alert("Éxito", "El caché ya estaba limpio.");
        return;
      }

      // 3. Borrar cada archivo de la lista filtrada
      console.log("[Limpiar Caché] Procediendo a borrar los archivos filtrados...");
      await Promise.all(
        filesToDelete.map((file) => {
          const filePath = `${cacheDirUri}${file}`;
          console.log(`[Limpiar Caché] Borrando archivo filtrado: ${filePath}`);
          return deleteAsync(filePath, { idempotent: true });
        })
      );

      console.log("--- [Limpiar Caché] Proceso de limpieza completado exitosamente. ---");
      Alert.alert("Éxito", "El caché ha sido limpiado correctamente.");
      calculateCacheSize(); // Recalcular el tamaño después de limpiar
    } catch (error) {
      console.error("--- [Limpiar Caché] ¡ERROR! Ocurrió un error durante la limpieza. ---", error);
      Alert.alert(
        "Error",
        `Ocurrió un error al limpiar el caché: ${error.message}`
      );
    }
  };

  const handleClearCache = () => {
    Alert.alert(
      "Limpiar Caché",
      "¿Estás seguro de que quieres borrar los datos en caché? Esto puede liberar espacio, pero las imágenes y datos temporales se volverán a descargar.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Limpiar", onPress: performClearCache, style: "destructive" },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configuración de la App</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.container}>
        {/* Sección Apariencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Apariencia</Text>
          <View style={styles.settingItem}>
            <MaterialCommunityIcons
              name="theme-light-dark"
              size={24}
              color="#555"
              style={styles.icon}
            />
            <Text style={styles.settingText}>Modo Oscuro</Text>
            <Switch
              trackColor={{ false: "#767577", true: "#C386C3" }}
              thumbColor={isDarkMode ? "#9D046D" : "#f4f3f4"}
              onValueChange={toggleTheme}
              value={isDarkMode}
            />
          </View>
        </View>

        {/* Sección Datos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestión de Datos</Text>
          <TouchableOpacity
            style={styles.settingItem}
            onPress={handleClearCache}
          >
            <MaterialCommunityIcons
              name="broom"
              size={24}
              color="#555"
              style={styles.icon}
            />
            <Text style={styles.settingText}>Limpiar Caché</Text>
            <Text style={styles.cacheSizeText}>{cacheSize}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 15,
    paddingVertical: 12,
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
  container: {
    flex: 1,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
    paddingHorizontal: 20,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f7",
    borderTopWidth: 1,
    borderTopColor: "#f2f2f7",
  },
  icon: {
    marginRight: 15,
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    color: "#333",
  },
  cacheSizeText: {
    fontSize: 14,
    color: "#888",
    marginRight: 8,
  },
});

export default AppSettingsScreen;

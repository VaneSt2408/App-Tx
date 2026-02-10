import React, { useEffect, useState } from "react";
import {
  View,
  Text as DefaultText,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Image,
  TouchableOpacity,
  SafeAreaView,
  RefreshControl,
} from "react-native";
import { estadisticasService } from "../../src/services/estadisticasService";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";

//Componente de texto Alan Sans
const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: "Alan Sans" }, props.style]} />
);

export default function EstadisticasPage() {
  const [artesanosByLikes, setArtesanosByLikes] = useState([]);
  const [artesanosByProduct, setArtesanosByProduct] = useState([]);
  const [artesanosByAntiguedad, setArtesanosByAntiguedad] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [view, setView] = useState("likes");
  const router = useRouter();

  const fetchStats = async () => {
    try {
      setLoading(true);
      const likesData = await estadisticasService.getArtesanosByLikes();
      const productsData =
        await estadisticasService.getProductsCountByArtesano();
      const antiguedadData =
        await estadisticasService.getArtesanosByAntiguedad();

      setArtesanosByLikes((likesData || []).slice(0, 3));
      setArtesanosByProduct((productsData || []).slice(0, 3));
      setArtesanosByAntiguedad((antiguedadData || []).slice(0, 3));

      setError(null);
    } catch (e) {
      console.error(e);
      setError("Error al cargar las estadísticas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStats();
  };
  const handlePressArtesano = (userId) => {
    router.push({
      pathname: "/(app)/ArtesanoProfileVistaVisitante",
      params: { userId },
    }); //Cambiar a la ruta correcta
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return "N/A";
    }
  };

  const getStatInfo = (item) => {
    switch (view) {
      case "likes":
        return { icon: "heart", value: item?.total_likes ?? "0" };
      case "products":
        return { icon: "cart-outline", value: item?.total_productos ?? "0" };
      case "antiguedad":
        return { icon: "calendar-clock", value: formatDate(item?.created_at) };
      default:
        return { icon: "heart", value: item?.total_likes ?? "0" };
    }
  };

  const renderItem = ({ item, index }) => {
    const statInfo = getStatInfo(item);

    return (
      <TouchableOpacity
        onPress={() => handlePressArtesano(item.user_id)}
        style={styles.itemContainer}
      >
        <View style={styles.rankPill}>
          <Text style={styles.rankText}>#{index + 1}</Text>
        </View>

        {item?.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <MaterialCommunityIcons name="account" size={60} color="#999" />
          </View>
        )}

        <Text style={styles.name}>{String(item?.nombre || "Sin nombre")}</Text>

        <View style={styles.statContainer}>
          <MaterialCommunityIcons
            name={statInfo.icon}
            size={22}
            color="#9D046D"
            style={styles.statIcon}
          />
          <Text style={styles.statValue}>
            {String(statInfo.value ?? "N/A")}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#9D046D" />
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.errorText}>{String(error)}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.headerContainer, { justifyContent: "flex-start" }]}>
        <BackButton />
        <Text
          style={[
            styles.title,
            { fontFamily: "Alan Sans" },
            { fontWeight: "bold" },
            { color: "#9D046D" },
            { fontSize: 25 },
          ]}
        >
          Clasificación
        </Text>
      </View>

      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, view === "likes" && styles.activeButton]}
          onPress={() => setView("likes")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              view === "likes" && styles.activeButtonText,
            ]}
          >
            Por Likes
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === "products" && styles.activeButton,
          ]}
          onPress={() => setView("products")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              view === "products" && styles.activeButtonText,
            ]}
          >
            Por Productos
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.toggleButton,
            view === "antiguedad" && styles.activeButton,
          ]}
          onPress={() => setView("antiguedad")}
        >
          <Text
            style={[
              styles.toggleButtonText,
              view === "antiguedad" && styles.activeButtonText,
            ]}
          >
            Por Antigüedad
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={
          view === "likes"
            ? artesanosByLikes
            : view === "products"
              ? artesanosByProduct
              : artesanosByAntiguedad
        }
        renderItem={renderItem}
        keyExtractor={(item, index) =>
          item?.user_id?.toString() ?? index.toString()
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#9D046D"]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

// --- ESTILOS --- (no se tocó nada)
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontSize: 20, fontWeight: "bold", color: "#333" },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f0f2f5",
  },
  errorText: { fontSize: 16, color: "red" },
  toggleContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 14,
    paddingHorizontal: 16,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 6,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  activeButton: { backgroundColor: "#9D046D" },
  toggleButtonText: { color: "#6E6E73", fontWeight: "600", fontSize: 13 },
  activeButtonText: { color: "#FFFFFF" },
  listContainer: { paddingHorizontal: 16, paddingBottom: 16 },
  itemContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 4,
    position: "relative",
  },
  rankPill: {
    position: "absolute",
    top: 16,
    left: 16,
    backgroundColor: "#9D046D",
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 10,
    zIndex: 2,
  },
  rankText: { color: "#FFFFFF", fontSize: 14, fontWeight: "bold" },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 16,
    borderWidth: 3,
    borderColor: "#E0E0E0",
  },
  avatarPlaceholder: {
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 16,
    textAlign: "center",
  },
  statContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  statIcon: { marginRight: 8 },
  statValue: { fontSize: 22, fontWeight: "bold", color: "#333" },
});

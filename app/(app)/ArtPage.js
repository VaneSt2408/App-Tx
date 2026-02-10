// En: app/(app)/ArtPage.js -> Archivo de la página del artesano (Frontend)
// Este archivo es el encargado de mostrar la página del artesano en la aplicación.

// Importaciones
import React from "react";
import {
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Text as DefaultText,
} from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FeedPage from "./FeedPage";
import MarketplacePage from "./MarketplacePage";
import ArtesanoSettings from "./ArtesanoSettings";
import Estadisticas from "./estadisticas";
import useResponsiveTabBar from "../../hooks/useResponsiveTabBar";

const Tab = createBottomTabNavigator();
const ProfileStack = createStackNavigator();

const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: "Alan Sans" }, props.style]} />
);

// Este es el nuevo navegador para la pestaña de Perfil
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen
        name="ArtesanoSettings"
        component={ArtesanoSettings}
      />
    </ProfileStack.Navigator>
  );
}

// Componente principal
function ArtPage() {
  // Hook responsive con breakpoints tipo "media queries"
  const { tabBarStyle, tabBarLabelStyle, tabBarIconStyle, iconSize } =
    useResponsiveTabBar();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* CORRECCIÓN DE BARRA DE ESTADO UNIVERSAL (Para Android/iOS) */}
      <StatusBar
        barStyle={Platform.OS === "ios" ? "dark-content" : "light-content"}
        backgroundColor={Platform.OS === "android" ? "#000000" : "transparent"}
      />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: true,

          tabBarIcon: ({ focused, color }) => {
            let iconName;

            if (route.name === "Feed") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Marketplace") {
              iconName = focused ? "store" : "store-outline";
            } else if (route.name === "Estadisticas") {
              iconName = focused ? "chart-bar" : "chart-bar-stacked";
            } else if (route.name === "Perfil") {
              iconName = focused ? "account-circle" : "account-circle-outline";
            }

            return (
              <MaterialCommunityIcons
                name={iconName}
                size={iconSize}
                color={color}
              />
            );
          },

          tabBarActiveTintColor: "#9D046D",
          tabBarInactiveTintColor: "#666",
          tabBarStyle,
          tabBarLabelStyle,
          tabBarIconStyle,
          headerShown: false,
        })}
      >
        <Tab.Screen
          name="Feed"
          component={FeedPage}
          options={{
            tabBarLabel: "Inicio",
          }}
        />
        <Tab.Screen
          name="Marketplace"
          component={MarketplacePage}
          options={{
            tabBarLabel: "Mercadito",
          }}
        />
        <Tab.Screen
          name="Estadisticas"
          component={Estadisticas}
          options={{
            tabBarLabel: "Estadísticas",
          }}
        />
        <Tab.Screen
          name="Perfil"
          component={ProfileStackNavigator}
          options={{
            tabBarLabel: "Perfil",
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

// Stylesheet estático (sin cambios)
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f5f5f5",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  userInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginBottom: 20,
  },
  emailText: {
    fontSize: 16,
    color: "#555",
  },
  logoutButton: {
    padding: 8,
  },
  uploadButton: {
    backgroundColor: "#9D046D",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  uploadButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
});

export default ArtPage;

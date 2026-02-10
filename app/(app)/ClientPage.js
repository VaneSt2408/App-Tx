// En: app/(app)/ClientPage.js
import React from "react";
import { StyleSheet, SafeAreaView, Text as DefaultText } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FeedPage from "./FeedPage";
import MarketplacePage from "./MarketplacePage";
import ArtesanoList from "./ArtesanoList";
import ClientSettings from "./ClientSettings";
import Estadisticas from "./estadisticas";
import useResponsiveTabBar from "../../hooks/useResponsiveTabBar";

const Tab = createBottomTabNavigator();

const Text = (props) => (
  <DefaultText {...props} style={[{ fontFamily: "Alan Sans" }, props.style]} />
);

function ClientPage() {
  // Hook responsive con breakpoints tipo "media queries"
  const { tabBarStyle, tabBarLabelStyle, tabBarIconStyle, iconSize } =
    useResponsiveTabBar();

  return (
    <SafeAreaView style={styles.container}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarShowLabel: true,

          tabBarIcon: ({ focused, color }) => {
            let iconName;

            if (route.name === "Feed") {
              iconName = focused ? "home" : "home-outline";
            } else if (route.name === "Marketplace") {
              iconName = focused ? "store" : "store-outline";
            } else if (route.name === "Artesanos") {
              iconName = focused ? "account-group" : "account-group-outline";
            } else if (route.name === "Estadisticas") {
              iconName = focused ? "chart-bar" : "chart-bar-stacked";
            } else if (route.name === "Profile") {
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
          options={{ tabBarLabel: "Inicio" }}
        />
        <Tab.Screen
          name="Marketplace"
          component={MarketplacePage}
          options={{ tabBarLabel: "Marketplace" }}
        />
        <Tab.Screen
          name="Artesanos"
          component={ArtesanoList}
          options={{ tabBarLabel: "Artesanos" }}
        />
        <Tab.Screen
          name="Estadisticas"
          component={Estadisticas}
          options={{ tabBarLabel: "Estadísticas" }}
        />
        <Tab.Screen
          name="Profile"
          component={ClientSettings}
          options={{ tabBarLabel: "Perfil" }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default ClientPage;

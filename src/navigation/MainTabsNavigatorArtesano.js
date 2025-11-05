// src/navigation/MainTabsNavigator.js
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet } from 'react-native';


// Importar pantallas
import FeedPage from '../pages/FeedPage';
import ArtPage from '../pages/ArtPage'; 


const Tab = createBottomTabNavigator();

// Componentes placeholder para las pantallas que aún no están implementadas
const PlaceholderScreen = ({ name, icon }) => (
  <View style={styles.placeholderContainer}>
    <MaterialCommunityIcons name={icon} size={64} color="#ccc" />
    <Text style={styles.placeholderTitle}>{name}</Text>
    <Text style={styles.placeholderText}>Próximamente...</Text>
  </View>
);

const MarketplacePlaceholder = () => (
  <PlaceholderScreen name="Marketplace" icon="store" />
);

const ProfilePlaceholder = () => (
  <PlaceholderScreen name="Perfil" icon="account-circle" />
);

const MainTabsNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Feed') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Marketplace') {
            iconName = focused ? 'store' : 'store-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account-circle' : 'account-circle-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2575fc',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e1e8ed',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Feed" 
        component={FeedPage}
        options={{
          tabBarLabel: 'Inicio',
        }}
      />
      <Tab.Screen 
        name="Marketplace" 
        component={MarketplacePlaceholder}
        options={{
          tabBarLabel: 'Marketplace',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ArtPage}
        options={{
          tabBarLabel: 'Perfil',
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f2f5',
    paddingHorizontal: 40,
  },
  placeholderTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginTop: 16,
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
    marginTop: 8,
  },
});

export default MainTabsNavigator;
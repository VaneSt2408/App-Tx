import { Tabs } from 'expo-router';
import React from 'react';
import "../../global.css";

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import useResponsiveTabBar from '../../../hooks/useResponsiveTabBar';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { tabBarStyle, tabBarLabelStyle, tabBarIconStyle, iconSize } = useResponsiveTabBar();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle,
        tabBarLabelStyle: tabBarLabelStyle as any,
        tabBarIconStyle,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={iconSize} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="estadisticas"
        options={{
          title: 'Clasificación',
          tabBarIcon: ({ color }) => <MaterialCommunityIcons name="chart-bar" size={iconSize} color={color} />,
        }}
      />
    </Tabs>
  );
}

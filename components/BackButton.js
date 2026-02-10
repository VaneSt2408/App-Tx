// components/BackButton.js
// Componente de botón de retroceso responsive con breakpoints tipo "media queries".
// Centraliza el tamaño del icono y el padding para que se adapte a todos los dispositivos.

import React from "react";
import { TouchableOpacity, useWindowDimensions, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

export default function BackButton({ onPress, color = "#333", style }) {
  const { width } = useWindowDimensions();
  const router = useRouter();

  // ─── Breakpoints responsive ─────────────────────────────
  let iconSize;
  let padding;

  if (width < 360) {
    // Teléfonos pequeños (SE, Galaxy S Mini)
    iconSize = 20;
    padding = 4;
  } else if (width < 414) {
    // Teléfonos normales (iPhone 8, Pixel, Galaxy S)
    iconSize = 24;
    padding = 6;
  } else if (width < 600) {
    // Teléfonos grandes (iPhone Plus/Max)
    iconSize = 26;
    padding = 8;
  } else if (width < 900) {
    // Tablets
    iconSize = 30;
    padding = 10;
  } else {
    // Tablets grandes
    iconSize = 34;
    padding = 12;
  }

  const handlePress = onPress || (() => router.back());

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[{ padding }, style]}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Volver"
    >
      <Ionicons
        name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
        size={iconSize}
        color={color}
      />
    </TouchableOpacity>
  );
}

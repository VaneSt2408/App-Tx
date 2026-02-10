// hooks/useResponsiveTabBar.js
// Hook centralizado para estilos responsive de la barra de navegación inferior.
// Funciona como "media queries" usando breakpoints por ancho de pantalla.

import { useWindowDimensions, Platform } from "react-native";

// ─── Breakpoints (ancho en DIPs) ───────────────────────────────
// Pequeño   : < 360px   (teléfonos compactos, SE, Galaxy S Mini)
// Normal    : 360-413px (iPhone 8, Pixel, Galaxy S)
// Grande    : 414-599px (iPhone Plus/Max, Galaxy S Ultra)
// Tablet    : 600-899px (tablets pequeñas, iPad Mini)
// TabletXL  : >= 900px  (iPad Pro, tablets grandes)

export default function useResponsiveTabBar() {
  const { width, height } = useWindowDimensions();

  // Detección: ¿es modo landscape?
  const isLandscape = width > height;

  // ─── Valores por breakpoint ─────────────────────────────────
  let tabBarHeight;
  let tabBarPaddingBottom;
  let tabBarPaddingTop;
  let labelFontSize;
  let iconSize;
  let iconMarginBottom;
  let labelBottomOffset; // Para ajustar posición del label

  if (width < 360) {
    // ── Teléfonos pequeños ──
    tabBarHeight = 52;
    tabBarPaddingBottom = Platform.OS === "ios" ? 16 : 4;
    tabBarPaddingTop = 4;
    labelFontSize = 9;
    iconSize = 20;
    iconMarginBottom = 1;
    labelBottomOffset = 2;
  } else if (width < 414) {
    // ── Teléfonos normales ──
    tabBarHeight = 56;
    tabBarPaddingBottom = Platform.OS === "ios" ? 20 : 6;
    tabBarPaddingTop = 6;
    labelFontSize = 10;
    iconSize = 22;
    iconMarginBottom = 2;
    labelBottomOffset = 3;
  } else if (width < 600) {
    // ── Teléfonos grandes / phablets ──
    tabBarHeight = 62;
    tabBarPaddingBottom = Platform.OS === "ios" ? 24 : 8;
    tabBarPaddingTop = 8;
    labelFontSize = 11;
    iconSize = 24;
    iconMarginBottom = 2;
    labelBottomOffset = 4;
  } else if (width < 900) {
    // ── Tablets ──
    tabBarHeight = 70;
    tabBarPaddingBottom = Platform.OS === "ios" ? 28 : 10;
    tabBarPaddingTop = 10;
    labelFontSize = 13;
    iconSize = 28;
    iconMarginBottom = 3;
    labelBottomOffset = 5;
  } else {
    // ── Tablets grandes / pantallas XL ──
    tabBarHeight = 80;
    tabBarPaddingBottom = Platform.OS === "ios" ? 32 : 12;
    tabBarPaddingTop = 12;
    labelFontSize = 15;
    iconSize = 32;
    iconMarginBottom = 4;
    labelBottomOffset = 6;
  }

  // En landscape reducimos la altura un poco para no ocupar tanto espacio
  if (isLandscape) {
    tabBarHeight = Math.round(tabBarHeight * 0.8);
    tabBarPaddingBottom = Math.round(tabBarPaddingBottom * 0.6);
    tabBarPaddingTop = Math.round(tabBarPaddingTop * 0.6);
    iconSize = Math.round(iconSize * 0.85);
  }

  // ─── Estilos listos para usar ───────────────────────────────
  const tabBarStyle = {
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e1e8ed",
    height: tabBarHeight,
    paddingBottom: tabBarPaddingBottom,
    paddingTop: tabBarPaddingTop,
    // Sombra sutil en iOS
    ...(Platform.OS === "ios" && {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
    }),
    // Elevación en Android
    ...(Platform.OS === "android" && {
      elevation: 8,
    }),
  };

  const tabBarLabelStyle = {
    fontSize: labelFontSize,
    fontWeight: /** @type {'500'} */ ("500"),
    textAlign: /** @type {'center'} */ ("center"),
    marginBottom: labelBottomOffset,
  };

  const tabBarIconStyle = {
    marginBottom: iconMarginBottom,
  };

  return {
    // Estilos completos (para aplicar directamente)
    tabBarStyle,
    tabBarLabelStyle,
    tabBarIconStyle,

    // Valores individuales (por si necesitan usarse por separado)
    iconSize,
    labelFontSize,
    tabBarHeight,
    isLandscape,

    // Info del dispositivo
    screenWidth: width,
    screenHeight: height,
  };
}

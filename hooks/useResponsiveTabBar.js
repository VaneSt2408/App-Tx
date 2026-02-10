// hooks/useResponsiveTabBar.js
// Hook centralizado para estilos responsive de la barra de navegación inferior.
// Usa breakpoints por ancho de pantalla (como "media queries" de CSS).
//
// Tiene DOS configuraciones SEPARADAS:
//   1. iOS     → breakpoints calibrados para iPhone SE, iPhone 8, iPhone Plus/Max, iPad
//   2. Android → breakpoints calibrados para Galaxy S Mini, Pixel, Galaxy S Ultra, tablets
// Cada plataforma se ajusta de forma independiente.

import { useWindowDimensions, Platform } from "react-native";

// ─── Breakpoints (ancho en DIPs) ───────────────────────────────
// Pequeño   : < 360px   (SE / Galaxy S Mini)
// Normal    : 360-413px (iPhone 8 / Pixel, Galaxy S)
// Grande    : 414-599px (iPhone Plus/Max / Galaxy S Ultra)
// Tablet    : 600-899px (iPad Mini / tablets pequeñas)
// TabletXL  : >= 900px  (iPad Pro / tablets grandes)

function getIOSValues(width) {
  if (width < 360) {
    return {
      tabBarHeight: 78,
      tabBarPaddingBottom: 20,
      tabBarPaddingTop: 6,
      labelFontSize: 9,
      iconSize: 20,
      iconMarginBottom: 1,
      labelBottomOffset: 2,
    };
  } else if (width < 414) {
    return {
      tabBarHeight: 82,
      tabBarPaddingBottom: 24,
      tabBarPaddingTop: 8,
      labelFontSize: 10,
      iconSize: 22,
      iconMarginBottom: 2,
      labelBottomOffset: 3,
    };
  } else if (width < 600) {
    return {
      tabBarHeight: 88,
      tabBarPaddingBottom: 28,
      tabBarPaddingTop: 10,
      labelFontSize: 11,
      iconSize: 24,
      iconMarginBottom: 2,
      labelBottomOffset: 4,
    };
  } else if (width < 900) {
    return {
      tabBarHeight: 96,
      tabBarPaddingBottom: 28,
      tabBarPaddingTop: 12,
      labelFontSize: 13,
      iconSize: 28,
      iconMarginBottom: 3,
      labelBottomOffset: 5,
    };
  } else {
    return {
      tabBarHeight: 108,
      tabBarPaddingBottom: 32,
      tabBarPaddingTop: 14,
      labelFontSize: 15,
      iconSize: 32,
      iconMarginBottom: 4,
      labelBottomOffset: 6,
    };
  }
}

function getAndroidValues(width) {
  if (width < 360) {
    return {
      tabBarHeight: 56,
      tabBarPaddingBottom: 6,
      tabBarPaddingTop: 6,
      labelFontSize: 9,
      iconSize: 20,
      iconMarginBottom: 1,
      labelBottomOffset: 2,
    };
  } else if (width < 414) {
    return {
      tabBarHeight: 60,
      tabBarPaddingBottom: 8,
      tabBarPaddingTop: 8,
      labelFontSize: 10,
      iconSize: 22,
      iconMarginBottom: 2,
      labelBottomOffset: 3,
    };
  } else if (width < 600) {
    return {
      tabBarHeight: 66,
      tabBarPaddingBottom: 10,
      tabBarPaddingTop: 10,
      labelFontSize: 11,
      iconSize: 24,
      iconMarginBottom: 2,
      labelBottomOffset: 4,
    };
  } else if (width < 900) {
    return {
      tabBarHeight: 74,
      tabBarPaddingBottom: 12,
      tabBarPaddingTop: 12,
      labelFontSize: 13,
      iconSize: 28,
      iconMarginBottom: 3,
      labelBottomOffset: 5,
    };
  } else {
    return {
      tabBarHeight: 84,
      tabBarPaddingBottom: 14,
      tabBarPaddingTop: 14,
      labelFontSize: 15,
      iconSize: 32,
      iconMarginBottom: 4,
      labelBottomOffset: 6,
    };
  }
}

export default function useResponsiveTabBar() {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  // ─── Seleccionar valores según plataforma ──────────────────
  const values =
    Platform.OS === "ios" ? getIOSValues(width) : getAndroidValues(width);

  let {
    tabBarHeight,
    tabBarPaddingBottom,
    tabBarPaddingTop,
    labelFontSize,
    iconSize,
    iconMarginBottom,
    labelBottomOffset,
  } = values;

  // En landscape reducimos para no ocupar tanto espacio
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
    tabBarStyle,
    tabBarLabelStyle,
    tabBarIconStyle,
    iconSize,
    labelFontSize,
    tabBarHeight,
    isLandscape,
    screenWidth: width,
    screenHeight: height,
  };
}

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Linking,
  TouchableOpacity,
  SafeAreaView,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BackButton from "../../components/BackButton";
import { useRouter } from "expo-router";

// Habilitar LayoutAnimation para Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const faqData = {
  "Gestión de la Cuenta": [
    {
      q: "¿Cómo puedo cambiar mi contraseña?",
      a: "Ve a la pestaña de 'Perfil' o 'Mi Cuenta', selecciona 'Gestión de la Cuenta' y luego 'Cambiar contraseña'. Por seguridad, se te pedirá tu contraseña actual.",
    },
    {
      q: "¿Cómo actualizo mi información de perfil?",
      a: "En la pestaña de 'Perfil', busca el ícono de lápiz o el botón 'Editar Perfil'. Desde allí podrás cambiar tu nombre, foto de perfil, teléfono y más.",
    },
    {
      q: "¿Qué hago si olvido mi contraseña?",
      a: "En la pantalla de inicio de sesión, utiliza la opción '¿Olvidaste tu contraseña?'. Recibirás un correo electrónico con las instrucciones para recuperarla.",
    },
    {
      q: "¿Cómo puedo eliminar mi cuenta?",
      a: "Puedes eliminar tu cuenta desde 'Perfil' > 'Gestión de la Cuenta' > 'Eliminar Perfil'. Ten en cuenta que esta acción es irreversible y todos tus datos serán borrados.",
    },
  ],
  "Para Clientes": [
    {
      q: "¿Cómo contacto a un artesano para comprar?",
      a: "Dentro de la página de detalle de un producto, presiona el botón 'Contactar'. Se mostrará el número de teléfono del artesano para que puedas comunicarte directamente.",
    },
    {
      q: "¿Cómo puedo seguir a un artesano?",
      a: "Cuando visites el perfil de un artesano, verás un botón de 'Seguir'. Al presionarlo, sus nuevas publicaciones aparecerán en tu feed de inicio.",
    },
    {
      q: "¿Dónde veo los productos que he guardado?",
      a: "En tu pantalla de 'Perfil', encontrarás una sección llamada 'Productos guardados' donde se listan todos los artículos que has marcado con el ícono de guardar.",
    },
  ],
  "Para Artesanos": [
    {
      q: "¿Diferencia entre 'Producto' y 'Publicación'?",
      a: "Un Producto es un artículo que pones a la venta en el Marketplace, con precio y stock. Una Publicación es una actualización en tu feed (como una foto de tu proceso creativo) para interactuar con tus seguidores.",
    },
    {
      q: "¿Cómo creo un nuevo producto para vender?",
      a: "Ve a la pestaña 'Marketplace' y presiona el ícono de '+'. También puedes gestionarlos desde 'Perfil' > 'Mis Productos'.",
    },
    {
      q: "¿Cómo puedo ver mis estadísticas?",
      a: "La pestaña 'Estadísticas' en la barra de navegación inferior te muestra tu ranking basado en likes, número de productos y antigüedad en la plataforma.",
    },
  ],
};

const FaqItem = ({ question, answer, isExpanded, onPress }) => {
  const styles = faqStyles;

  const answerContent = React.useMemo(() => {
    // Divide la respuesta por los marcadores de negrita
    const parts = answer.split(/(<Text style={styles.bold}>.*?<\/Text>)/g);
    return parts.map((part, index) => {
      if (part.startsWith("<Text style={styles.bold}>")) {
        // Extrae el texto dentro de la etiqueta
        const boldText = part.replace(/<\/?Text.*?>/g, "");
        return (
          <Text key={index} style={styles.bold}>
            {boldText}
          </Text>
        );
      }
      return part;
    });
  }, [answer, styles.bold]);

  return (
    <View style={styles.faqContainer}>
      <TouchableOpacity
        style={styles.faqItem}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Text style={styles.question}>{question}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"}
          size={20}
          color="#9D046D"
        />
      </TouchableOpacity>
      {isExpanded && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answerContent}</Text>
        </View>
      )}
    </View>
  );
};

const AyudaSoporteScreen = () => {
  const router = useRouter();
  const [expandedIndices, setExpandedIndices] = useState([]);

  const toggleExpand = (index) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const newExpandedIndices = [...expandedIndices];
    const currentIndexPosition = newExpandedIndices.indexOf(index);

    if (currentIndexPosition > -1) {
      // Si ya está abierto, lo cerramos (quitándolo del array)
      newExpandedIndices.splice(currentIndexPosition, 1);
    } else {
      // Si está cerrado, lo abrimos (agregándolo al array)
      newExpandedIndices.push(index);
    }
    setExpandedIndices(newExpandedIndices);
  };

  const handleEmailPress = async () => {
    const email = "l21141158@queretaro.tecnm.mx"; // Reemplaza con tu email de soporte
    const subject = "Soporte AppTx";

    // URL específica para la app de Gmail
    const gmailUrl = `googlegmail:///co?to=${email}&subject=${encodeURIComponent(subject)}`;
    // URL genérica 'mailto' como respaldo
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    try {
      const canOpenGmail = await Linking.canOpenURL(gmailUrl);
      if (canOpenGmail) {
        await Linking.openURL(gmailUrl); // Intenta abrir Gmail
      } else {
        await Linking.openURL(mailtoUrl); // Si no puede, usa el método estándar
      }
    } catch (_) {
      // Si todo falla, abre el método estándar
      await Linking.openURL(mailtoUrl);
    }
  };

  return (
    <SafeAreaView style={getStyles.safeArea}>
      {/* Header con botón de volver */}
      <View style={getStyles.header}>
        <BackButton />
        <Text style={getStyles.headerTitle}>Ayuda y Soporte</Text>
        {/* Espaciador para centrar el título */}
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={getStyles.container}
        contentContainerStyle={getStyles.contentContainer}
      >
        <View style={[getStyles.section, { paddingTop: 0 }]}>
          <Text style={getStyles.title}>Centro de Ayuda</Text>
          <Text style={getStyles.paragraph}>
            Aquí encontrarás respuestas a las preguntas más comunes. Si no
            encuentras lo que buscas, no dudes en contactarnos.
          </Text>
        </View>

        {/* Sección General */}
        <View style={getStyles.section}>
          <Text style={getStyles.subtitle}>Gestión de la Cuenta</Text>

          {faqData["Gestión de la Cuenta"].map((item, index) => (
            <FaqItem
              key={`general-${index}`}
              question={item.q}
              answer={item.a}
              isExpanded={expandedIndices.includes(`general-${index}`)}
              onPress={() => toggleExpand(`general-${index}`)}
            />
          ))}
        </View>

        {Object.keys(faqData)
          .filter((key) => key !== "Gestión de la Cuenta")
          .map((sectionTitle) => (
            <View style={getStyles.section} key={sectionTitle}>
              <Text style={getStyles.subtitle}>{sectionTitle}</Text>
              {faqData[sectionTitle].map((item, index) => (
                <FaqItem
                  key={`${sectionTitle}-${index}`}
                  question={item.q}
                  answer={item.a}
                  isExpanded={expandedIndices.includes(
                    `${sectionTitle}-${index}`,
                  )}
                  onPress={() => toggleExpand(`${sectionTitle}-${index}`)}
                />
              ))}
            </View>
          ))}

        {/* Sección de Soporte */}
        <View style={getStyles.section}>
          <Text style={getStyles.subtitle}>Contacto y Soporte Técnico</Text>

          <View style={getStyles.staticFaqItem}>
            <Text style={getStyles.question}>
              ¿Qué hago si encuentro un error en la app?
            </Text>
            <Text style={getStyles.answer}>
              Agradecemos que nos informes. Por favor, contáctanos a través del
              correo de soporte que se encuentra más abajo, detallando el
              problema que encontraste y, si es posible, adjuntando una captura
              de pantalla.
            </Text>
          </View>

          <Text style={getStyles.paragraph}>
            Si no encuentras la respuesta a tu pregunta, nuestro equipo está
            aquí para ayudarte.
          </Text>

          <TouchableOpacity
            style={getStyles.contactButton}
            onPress={handleEmailPress}
          >
            <Ionicons name="mail-outline" size={24} color="#9D046D" />
            <Text style={getStyles.contactText}>Enviar un correo</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = StyleSheet.create({
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
  contentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  section: {
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    top: 15,
    shadowOpacity: 0.25,
    shadowRadius: 2.22,
    elevation: 2,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
    top: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 15,
    color: "#9D046D",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 10,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 22,
    color: "#666",
    marginBottom: 15,
    top: 8,
  },
  staticFaqItem: {
    marginBottom: 20,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
    marginBottom: 5,
  },
  answer: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  contactButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FDB9E8",
    padding: 15,
    borderRadius: 15,
    marginBottom: 10,
    top: 8,
    borderWidth: 2,
    borderColor: "#9D046D",
  },
  contactText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#9D046D",
    fontWeight: "600",
  },
});

const faqStyles = StyleSheet.create({
  faqContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    marginBottom: 10,
    paddingBottom: 10,
  },
  faqItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 5,
  },
  question: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    flex: 1,
    marginRight: 10,
  },
  answerContainer: {
    paddingTop: 10,
  },
  answer: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
  },
  bold: {
    fontWeight: "bold",
    color: "#444",
  },
});

export default AyudaSoporteScreen;

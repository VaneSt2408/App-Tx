import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase/client'; // Asegúrate que la ruta sea correcta
import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native'; // Importa componentes de UI de React Native.


// Creamos el contexto
const AuthContext = createContext<{ 
  session: Session | null; 
  role: string | null; 
  loading: boolean;
  isPasswordRecovery: boolean;
  resetPasswordRecoveryMode: () => void;
}>({
  session: null,
  role: null,
  loading: true,
  isPasswordRecovery: false,
  resetPasswordRecoveryMode: () => {},
});

// Hook para usar el contexto fácilmente en otros componentes
export const useAuth = () => {
  return useContext(AuthContext);
};

// El componente "Proveedor" que contendrá toda la lógica
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null); // Almacena la sesión del usuario (si está logueado o no).
    const [role, setRole] = useState(null); // Almacena el rol del usuario ('admin', 'artesano', etc.).
    const [loading, setLoading] = useState(true); // Controla la visualización de la pantalla de carga inicial.
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false); // Controla si estamos en modo de recuperación de contraseña.
    //hooks/useAuth.js
  
    // --- useEffect para manejar la sesión de autenticación ---
    useEffect(() => {
      //Intenta obtener la sesión activa la primera vez que la app carga.
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session); // Establece la sesión encontrada.
        //Si no hay sesión, significa que el usuario no está logueado, por lo que se deja de cargar.
        if (!session) {
          setLoading(false);
        }
      });
  
      // Crea un "oyente" (listener) que se activa cada vez que hay un cambio en el estado de autenticación.
      // Ejemplos de eventos: SIGNED_IN, SIGNED_OUT, USER_UPDATED.
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        console.log(`📡 Evento de Auth recibido: ${_event}`); // Muestra el evento en consola.
        setSession(session); // Actualiza el estado de la sesión con la nueva información.
      });
  
      // Función de limpieza: se ejecuta cuando el componente se desmonta.
      // Es crucial para evitar fugas de memoria al eliminar la suscripción.
      return () => subscription.unsubscribe();
    }, []); // El array vacío `[]` asegura que este efecto se ejecute solo una vez.
  
    // --- useEffect para obtener el rol del usuario cuando cambia la sesión ---
    useEffect(() => {
      // Si no hay una sesión de usuario, resetea el rol y termina la carga.
      if (!session?.user) {
        setRole(null);
        setLoading(false);
        return; // Detiene la ejecución del efecto.
      }
  
      // Define una función asíncrona para buscar el rol en la base de datos.
      const fetchRole = async () => {
        try {
          console.log("🔍 Buscando perfil para el usuario:", session.user.id);
          // Realiza una consulta a la tabla 'perfiles' para obtener el 'rol' del usuario actual.
          const { data: profile, error, status } = await supabase
            .from('perfiles')
            .select('rol')
            .eq('id', session.user.id) // Filtra por el ID del usuario de la sesión.
            .single(); // Espera un único resultado.
  
          // Si hay un error y no es el código 406 (que significa 'no se encontró fila'), lanza el error.
          if (error && status !== 406) {
            throw error;
          }
  
          // Si se encuentra un perfil con un rol, lo establece en el estado.
          if (profile?.rol) {
            console.log("✅ Rol detectado exitosamente:", profile.rol);
            setRole(profile.rol);
          } else { // Si no se encuentra un perfil o el rol es nulo.
            console.warn("⚠️ No se encontró un perfil para este usuario.");
            setRole(null);
          }
        } catch (err) { // Captura cualquier error durante la obtención del rol.
          if (err instanceof Error) {
            console.error("❌ Error crítico obteniendo el rol:", err.message);
          }
          setRole(null); // Resetea el rol en caso de error.
          Alert.alert("Error de Perfil", "No pudimos verificar tu información.");
        } finally { // Este bloque se ejecuta siempre, con o sin errores.
          setLoading(false); // Finaliza el estado de carga para mostrar la app.
        }
      };
  
      fetchRole(); // Llama a la función para que se ejecute.
    }, [session]); // Este efecto se vuelve a ejecutar cada vez que el estado 'session' cambia.
  
    // --- useEffect para manejar Deep Links (enlaces mágicos) ---
    useEffect(() => {
      //Función que procesa el URL recibido por el deep link.
      const handleDeepLink = async (url: string) => {
        if (!url) return;
        console.log('🔗 URL de Deep Link recibida:', url);
        
        // Verificamos si es un deep link para recuperación de contraseña
        if (url.includes('resetPassword')) {
          console.log('🔑 Deep link de recuperación de contraseña detectado');
          // Establecemos el modo de recuperación de contraseña
          setIsPasswordRecovery(true);
          
          // Los tokens están en el fragmento (#) de la URL
          const fragment = url.split('#')[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');

            // Si se encuentran ambos tokens, se usan para establecer la sesión temporal en Supabase
            if (access_token && refresh_token) {
              console.log('🔐 Estableciendo sesión temporal para recuperación de contraseña');
              console.log('🔑 Access token recibido:', access_token.substring(0, 50) + '...');
              console.log('🔄 Refresh token recibido:', refresh_token.substring(0, 20) + '...');
              
              try {
                const { error } = await supabase.auth.setSession({ 
                  access_token, 
                  refresh_token 
                });
                
                if (error) {
                  console.error('❌ Error estableciendo sesión temporal:', error);
                  console.error('❌ Tipo de error:', error.name);
                  console.error('❌ Mensaje de error:', error.message);
                  
                  // Intentar verificar si el token es válido
                  if (error.message.includes('Invalid JWT structure')) {
                    console.log('🔄 Intentando verificar la sesión actual...');
                    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                    if (sessionError) {
                      console.error('❌ Error verificando sesión:', sessionError);
                    } else {
                      console.log('✅ Sesión verificada correctamente:', sessionData);
                    }
                  }
                } else {
                  console.log('✅ Sesión temporal establecida correctamente');
                  
                  // Verificar que la sesión se estableció correctamente
                  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
                  if (sessionError) {
                    console.error('❌ Error verificando sesión establecida:', sessionError);
                  } else {
                    console.log('✅ Sesión verificada:', sessionData.session?.user?.email);
                  }
                }
              } catch (sessionError) {
                console.error('❌ Error inesperado estableciendo sesión:', sessionError);
              }
            } else {
              console.warn('⚠️ No se encontraron tokens válidos en el deep link');
            }
          } else {
            console.warn('⚠️ No se encontró fragmento en la URL del deep link');
          }
        } else {
          // Para otros tipos de deep links (como magic links de login)
          const fragment = url.split('#')[1];
          if (fragment) {
            const params = new URLSearchParams(fragment);
            const access_token = params.get('access_token');
            const refresh_token = params.get('refresh_token');
      
            // Si se encuentran ambos tokens, se usan para establecer la sesión en Supabase.
            if (access_token && refresh_token) {
              console.log('🔐 Estableciendo sesión para magic link/login');
              try {
                await supabase.auth.setSession({ access_token, refresh_token });
                console.log('✅ Sesión establecida correctamente');
              } catch (error) {
                console.error('❌ Error estableciendo sesión:', error);
              }
            }
          }
        }
      };
      
      // Revisa si la app fue abierta por un deep link.
      Linking.getInitialURL().then(url => { if (url) handleDeepLink(url); });
      // Añade un listener para manejar deep links mientras la app ya está abierta.
      const linkingListener = Linking.addEventListener('url', (e) => handleDeepLink(e.url));
  
      // Función de limpieza para remover el listener.
      return () => linkingListener.remove();
    }, []); // Se ejecuta solo una vez.
    
    // Función para resetear el modo de recuperación de contraseña
    const resetPasswordRecoveryMode = () => {
      setIsPasswordRecovery(false);
    };
    
    // 4. Crea el objeto 'value'
  const value = {
    session,
    role,
    loading,
    isPasswordRecovery,
    resetPasswordRecoveryMode,
  };

  // 5. Devuelve el Provider con el 'value' y los 'children'
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
  };
  
  
import React, { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '../supabase/client'; // Asegúrate que la ruta sea correcta
import * as Linking from 'expo-linking';
import { Session } from '@supabase/supabase-js';
import { Alert } from 'react-native'; // Importa componentes de UI de React Native.


// Creamos el contexto
const AuthContext = createContext<{ 
  session: Session | null; 
  role: string | null; 
  profile: any | null;
  loading: boolean;
  isPasswordRecovery: boolean;
  resetPasswordRecoveryMode: () => void;
  refreshProfile: () => Promise<void>;
  signOut: () => Promise<void>;
}>({
  session: null,
  role: null,
  profile: null,
  loading: true,
  isPasswordRecovery: false,
  resetPasswordRecoveryMode: () => {},
  refreshProfile: async () => {},
  signOut: async () => {},
});

// Hook para usar el contexto fácilmente en otros componentes
export const useAuth = () => {
  return useContext(AuthContext);
};

// El componente "Proveedor" que contendrá toda la lógica
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null); // Almacena la sesión del usuario (si está logueado o no).
    const [role, setRole] = useState(null); // Almacena el rol del usuario ('admin', 'artesano', etc.).
    const [profile, setProfile] = useState(null); // Almacena el perfil completo del usuario.
    const [loading, setLoading] = useState(true); // Controla la visualización de la pantalla de carga inicial.
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false); // Controla si estamos en modo de recuperación de contraseña.
    const [noProfileTimer, setNoProfileTimer] = useState<NodeJS.Timeout | null>(null); // Timer para usuarios sin perfil.
    //hooks/useAuth.js

    // --- Función para verificar el rol y perfil del usuario ---
    const checkUserRole = async (userId: string) => {
        if (!userId) return null;

        try {
            // Paso 1: Buscamos el perfil en la tabla 'clientes'.
            const { data: clientData, error: clientError } = await supabase
                .from('clientes')
                .select('id, nombre_completo, avatar_url')
                .eq('id', userId)
                .single();

            // Si hay un error que no sea "no se encontró la fila", lo registramos.
            if (clientError && clientError.code !== 'PGRST116') {
                console.error("Error buscando en la tabla clientes:", clientError);
                return null; // Devolvemos null para evitar que la app se rompa.
            }

            // Paso 2: Buscamos el perfil en la tabla 'perfiles' para obtener el rol.
            const { data: profileData, error: profileError } = await supabase
                .from('perfiles')
                .select('rol')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Error buscando en la tabla perfiles:", profileError);
            }

            // Paso 3: Combinamos la información.
            // Si encontramos un perfil de cliente, usamos esa información.
            if (clientData) {
                return {
                    ...clientData, // Incluye id, nombre_completo, avatar_url
                    rol: profileData?.rol || 'cliente' // Añade el rol desde 'perfiles'
                };
            }

            // Si no es un cliente, devolvemos lo que encontramos en 'perfiles' (para admin/artesano).
            return profileData;

        } catch (error) {
            console.error("Error general en checkUserRole:", error);
            return null;
        }
    };

    // --- Función para refrescar el perfil ---
    const refreshProfile = async () => {
        if (!session?.user) return;
        
        setLoading(true);
        try {
            const userProfile = await checkUserRole(session.user.id);
            setProfile(userProfile);
            
            if (userProfile?.rol) {
                setRole(userProfile.rol);
                // Limpiar timer si se encuentra perfil
                if (noProfileTimer) {
                    clearTimeout(noProfileTimer);
                    setNoProfileTimer(null);
                }
            } else {
                // Si no hay perfil, iniciar timer de 10 segundos
                handleNoProfile();
            }
        } catch (error) {
            console.error("Error refrescando perfil:", error);
        } finally {
            setLoading(false);
        }
    };

    // --- Función para manejar usuarios sin perfil ---
    const handleNoProfile = () => {
        // Limpiar timer anterior si existe
        if (noProfileTimer) {
            clearTimeout(noProfileTimer);
        }

        // Crear nuevo timer de 10 segundos
        const timer = setTimeout(() => {
            Alert.alert(
                'Perfil no encontrado',
                'No tienes un perfil definido. Regístrate de nuevo.',
                [
                    {
                        text: 'OK',
                        onPress: async () => {
                            // Cerrar sesión y redirigir al login
                            try {
                                await supabase.auth.signOut();
                            } catch (error) {
                                console.error('Error cerrando sesión:', error);
                            }
                        }
                    }
                ]
            );
        }, 5000); // 5 segundos

        setNoProfileTimer(timer);
    };

    // --- Función para cerrar sesión ---
    const signOut = async () => {
        try {
            console.log('Cerrando sesión...');
            const { error } = await supabase.auth.signOut();
            if (error) {
                console.error('Error al cerrar sesión:', error);
                throw error;
            }
            console.log('Sesión cerrada correctamente');
        } catch (error) {
            console.error('Error en signOut:', error);
            throw error;
        }
    };
  
    // --- useEffect para limpiar timer al desmontar ---
    useEffect(() => {
        return () => {
            if (noProfileTimer) {
                clearTimeout(noProfileTimer);
            }
        };
    }, [noProfileTimer]);

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
  
    // --- useEffect para obtener el rol y perfil del usuario cuando cambia la sesión ---
    useEffect(() => {
      // Si no hay una sesión de usuario, resetea el rol y perfil, y termina la carga.
      if (!session?.user) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return; // Detiene la ejecución del efecto.
      }

      // Define una función asíncrona para buscar el perfil completo en la base de datos.
      const fetchProfile = async () => {
        try {
          console.log("🔍 Buscando perfil completo para el usuario:", session.user.id);
          
          // Usamos la función checkUserRole que obtiene tanto el rol como los datos del cliente
          const userProfile = await checkUserRole(session.user.id);
          
          if (userProfile) {
            console.log("✅ Perfil detectado exitosamente:", userProfile);
            setProfile(userProfile);
            setRole(userProfile.rol);
            // Limpiar timer si se encuentra perfil
            if (noProfileTimer) {
              clearTimeout(noProfileTimer);
              setNoProfileTimer(null);
            }
          } else {
            console.warn("⚠️ No se encontró un perfil para este usuario.");
            setProfile(null);
            setRole(null);
            // Iniciar timer de 10 segundos para usuarios sin perfil
            handleNoProfile();
          }
        } catch (err) { // Captura cualquier error durante la obtención del perfil.
          if (err instanceof Error) {
            console.error("❌ Error crítico obteniendo el perfil:", err.message);
          }
          setProfile(null);
          setRole(null); // Resetea el perfil y rol en caso de error.
          Alert.alert("Error de Perfil", "No pudimos verificar tu información.");
        } finally { // Este bloque se ejecuta siempre, con o sin errores.
          setLoading(false); // Finaliza el estado de carga para mostrar la app.
        }
      };

      fetchProfile(); // Llama a la función para que se ejecute.
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
    profile,
    loading,
    isPasswordRecovery,
    resetPasswordRecoveryMode,
    refreshProfile,
    signOut,
  };

  // 5. Devuelve el Provider con el 'value' y los 'children'
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
  };
  
  
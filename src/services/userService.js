//Backend
import { supabase } from '../supabase/client';

//Registrar un artesano
export const registrarNuevoArtesano = async (datosArtesano) => {
  const { data, error } = await supabase.functions.invoke('registrar-artesano', {
    body: datosArtesano
  });
  if (error) {
    throw new Error(`Error al registrar artesano: ${error.message}`);
  }
  return data;
};

//Ver lista de artesanos
export const getArtesanos = async () => {
//Obtener el usuario autenticado
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay usuario autenticado.");

  //Hacer la consulta a la tabla 'artesanos'
  const { data, error } = await supabase
    .from('artesanos') 
    .select()         
    .order('nombre', { ascending: true }); 

  if (error) {
    console.error("Error al obtener artesanos:", error);
    throw error;
  }
  
  return data;
};
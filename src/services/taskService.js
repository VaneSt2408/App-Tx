//Backend

import { supabase } from '../supabase/client';

// Obtener todas las tareas de un usuario
export const getTasks = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("No hay usuario autenticado.");

  const { data, error } = await supabase
    .from('task')
    .select()
    .eq('userid', user.id)
    .order('id', { ascending: true });
 
  if (error) throw error;
  return data;
};

// Crear una nueva tarea
export const createTask = async (taskName) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Debe iniciar sesión para crear tareas.");

  const { data, error } = await supabase
    .from('task')
    .insert([{ name: taskName, userid: user.id, done: false }])
    .select();

  if (error) throw error;
  return data;
};

// Eliminar una tarea por su ID
export const deleteTask = async (id) => {
  const { error } = await supabase
    .from('task')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Cambiar el estado 'done' de una tarea
export const toggleTaskDone = async (id, currentStatus) => {
  const { error } = await supabase
    .from('task')
    .update({ done: !currentStatus })
    .eq('id', id);

  if (error) throw error;
};
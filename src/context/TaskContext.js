//Frontend

import { createContext, useContext, useState, useCallback } from "react";
// Importa los servicios en lugar del cliente de supabase
import * as TaskService from '../services/taskService';

export const TaskContext = createContext();

export const useTasks = () => {
    const context = useContext(TaskContext);
    if (!context) {
        throw new Error('useTasks debe ser usado dentro de un TaskContextProvider');
    }
    return context;
};
export const TaskContextProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);

  const fetchTasks = useCallback(async () => {
    try {
      const data = await TaskService.getTasks();
      setTasks(data);
    } catch (error) {
      console.error("Error al cargar tareas:", error.message);
    }
  }, []);

  const handleCreateTask = async (taskName) => {
    try {
      await TaskService.createTask(taskName);
      await fetchTasks(); // Recarga las tareas después de crear
    } catch (error) {
      console.error("Error al crear tarea:", error.message);
    }
  };

  const handleDeleteTask = async (id) => {
    try {
      await TaskService.deleteTask(id);
      await fetchTasks(); // Recarga las tareas después de eliminar
    } catch (error) {
      console.error('Error inesperado al eliminar tarea:', error);
    }
  };

  const handleToggleTaskDone = async (id, done) => {
    try {
      await TaskService.toggleTaskDone(id, done);
      await fetchTasks(); // Recarga las tareas después de actualizar
    } catch (error) {
      console.error('Error inesperado al actualizar tarea:', error);
    }
  };

  return (
    <TaskContext.Provider value={{
      tasks,
      getTasks: fetchTasks, // Renombramos la función expuesta para claridad
      createTask: handleCreateTask,
      deleteTask: handleDeleteTask,
      toggleTaskDone: handleToggleTaskDone
    }}>
      {children}
    </TaskContext.Provider>
  );
};
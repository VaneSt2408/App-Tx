//Frontend

import React, { useEffect } from "react";
import { useTasks } from "../context/TaskContext";
import { View, Text, FlatList, StyleSheet } from "react-native"; // ✅ CORRECCIÓN: Importar componentes RN
import TaskCard from "./TaskCard";

function TaskList() {

    const { tasks, getTasks, deleteTask, toggleTaskDone } = useTasks();

    useEffect(() => {
        getTasks();
    }, [getTasks]);

    // Handler para eliminar tarea
    const handleDelete = async (id) => {
        try {
            await deleteTask(id);
        } catch (error) {
            console.log('Error al eliminar tarea:', error);
        }
    };

    const handleToggleDone = async (id, done) => {
        try {
            await toggleTaskDone(id, done);
        } catch (error) {
            console.log('Error al actualizar tarea:', error);
        }
    };

    // 🛑 CORRECCIÓN: Usar FlatList para mejor rendimiento con listas
    if (tasks.length === 0) {
        return (
            <View style={styles.noTasksContainer}>
                <Text style={styles.noTasksText}>No hay tareas.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={tasks}
            keyExtractor={(item) => item.id.toString()} // Asegurarse que la key es string
            renderItem={({ item }) => (
                <TaskCard
                    name={item.name}
                    done={item.done}
                    onDelete={() => handleDelete(item.id)}
                    onToggleDone={() => handleToggleDone(item.id, item.done)}
                />
            )}
            style={styles.list}
        />
    )
}

const styles = StyleSheet.create({
    list: {
        flex: 1,
        marginTop: 10,
    },
    noTasksContainer: {
        marginTop: 20,
        alignItems: 'center',
    },
    noTasksText: {
        fontSize: 16,
        color: '#888',
    }
});

export default TaskList
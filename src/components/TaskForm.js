//Frontend

import React from 'react'
import { useState } from 'react'
import { useTasks } from '../context/TaskContext';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native'; // ✅ CORRECCIÓN: Importar componentes RN


function TaskForm(){
    const [taskName, setTaskName] = useState('')
    const { createTask, getTasks } = useTasks();


// 🛑 CORRECCIÓN: La función ya no recibe un evento de formulario HTML
const handlePress = async () => {
    if (taskName.trim() === '') {
        Alert.alert('Advertencia', 'El nombre de la tarea no puede estar vacío.');
        return;
    }
    // Llama a createTask
    await createTask(taskName);
    // Recarga las tareas después de crear una nueva
    await getTasks(); 
    setTaskName('');
};
    return(
        <View style={styles.container}>
            <TextInput
                style={styles.input}
                placeholder="Escribe el nombre de una tarea"
                onChangeText={setTaskName} // Usar onChangeText en RN
                value={taskName}
                placeholderTextColor="#999"
            />
            <Button
                title="Guardar Tarea"
                onPress={handlePress} // Usar onPress
                color="#2575fc"
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    input: {
        flex: 1,
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 10,
        marginRight: 10,
        borderRadius: 6,
        backgroundColor: '#fff',
    }
});

export default TaskForm

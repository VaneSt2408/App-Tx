//Frontend

import React from "react";
import { View, Text, Button, StyleSheet } from "react-native"; // ✅ CORRECCIÓN: Importar componentes RN

function TaskCard({ name, done, onDelete, onToggleDone }) {
    return (
        <View style={[styles.card, done && styles.cardDone]}>
            <Text style={[styles.name, done && styles.nameDone]}>
                {name}
            </Text>
            <Text style={styles.status}>
                Estado: <Text style={done ? styles.statusDone : styles.statusPending}>{done ? 'Completada' : 'Pendiente'}</Text>
            </Text>
            <View style={styles.buttonContainer}>
                <View style={styles.buttonWrapper}>
                    <Button title="Eliminar" onPress={onDelete} color="#db4437" />
                </View>
                <View style={styles.buttonWrapper}>
                    <Button
                        title={done ? 'Desmarcar' : 'Marcar como completa'}
                        onPress={onToggleDone}
                        color={done ? "#ff9800" : "#4caf50"}
                    />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        padding: 15,
        marginVertical: 8,
        backgroundColor: '#fff',
        borderRadius: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    cardDone: {
        backgroundColor: '#e8f5e9', // Fondo más claro para tareas completadas
        borderLeftWidth: 5,
        borderLeftColor: '#4caf50',
    },
    name: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#333',
    },
    nameDone: {
        textDecorationLine: 'line-through',
        color: '#777',
    },
    status: {
        fontSize: 14,
        marginBottom: 10,
        color: '#555',
    },
    statusPending: {
        fontWeight: 'bold',
        color: '#ff9800',
    },
    statusDone: {
        fontWeight: 'bold',
        color: '#4caf50',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    buttonWrapper: {
        flex: 1,
        marginHorizontal: 5,
    }
});

export default TaskCard;
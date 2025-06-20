import React from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useRouter } from 'expo-router';

export default function TextInputModal() {
    const router = useRouter();

    const handleDone = () => {
        router.back();
    };

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={styles.container}
        >
            <View style={styles.modalView}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={handleDone}>
                        <Text style={styles.doneButton}>Done</Text>
                    </TouchableOpacity>
                </View>
                <TextInput
                    style={styles.input}
                    placeholder="Type your text here..."
                    placeholderTextColor="#999"
                    autoFocus={true}
                    multiline
                />
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    modalView: {
        backgroundColor: "white",
        padding: 10,
        borderTopWidth: 2,
        borderTopColor: '#ddd',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingBottom: 5,
    },
    doneButton: {
        color: '#44B88A',
        fontFamily: 'Satoshi-Medium',
        fontSize: 20,
        paddingRight: 5,
    },
    input: {
        minHeight: 40,
        maxHeight: 150,
        fontSize: 16,
    },
}); 
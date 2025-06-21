import React, { useState } from 'react';
import { View, TextInput, StyleSheet, KeyboardAvoidingView, Platform, TouchableOpacity, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';

// Global variable to store the typed text
let lastTypedText = '';

export default function TextInputModal() {
    const router = useRouter();
    const { existingText } = useLocalSearchParams();
    const [typedText, setTypedText] = useState(
        typeof existingText === 'string' ? existingText : ''
    );

    const handleDone = () => {
        // Check if the text is empty or only contains spaces
        const trimmedText = typedText.trim();
        if (trimmedText === '') {
            // If empty, store a special indicator to clear content
            lastTypedText = '__CLEAR_CONTENT__';
        } else {
            // Store the typed text globally
            lastTypedText = typedText;
        }
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
                    value={typedText}
                    onChangeText={setTypedText}
                />
            </View>
        </KeyboardAvoidingView>
    );
}

// Export function to get the last typed text
export const getLastTypedText = () => {
    const text = lastTypedText;
    lastTypedText = ''; // Clear after reading
    return text;
};

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
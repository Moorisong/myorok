import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    TouchableWithoutFeedback,
    Keyboard,
} from 'react-native';
import { COLORS } from '../constants';

interface NumberEditModalProps {
    visible: boolean;
    title: string;
    initialValue: number;
    onSave: (value: number) => void;
    onCancel: () => void;
}

export default function NumberEditModal({
    visible,
    title,
    initialValue,
    onSave,
    onCancel,
}: NumberEditModalProps) {
    const [value, setValue] = useState(initialValue.toString());
    const inputRef = React.useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setValue(initialValue.toString());
            // Force focus with a small delay for modal animation
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [visible, initialValue]);

    const handleSave = () => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
            onSave(num);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <TouchableWithoutFeedback onPress={onCancel}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                        <KeyboardAvoidingView
                            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                            style={styles.keyboardView}
                        >
                            <View style={styles.contentContainer}>
                                <Text style={styles.title}>{title}</Text>

                                <View style={styles.inputContainer}>
                                    <TextInput
                                        ref={inputRef}
                                        style={styles.input}
                                        value={value}
                                        onChangeText={setValue}
                                        keyboardType="number-pad"
                                        selectTextOnFocus
                                    />
                                    <Text style={styles.unitText}>회</Text>
                                </View>

                                <View style={styles.buttonContainer}>
                                    <TouchableOpacity
                                        style={[styles.button, styles.cancelButton]}
                                        onPress={onCancel}
                                    >
                                        <Text style={styles.cancelText}>취소</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.button, styles.saveButton]}
                                        onPress={handleSave}
                                    >
                                        <Text style={styles.saveText}>확인</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </KeyboardAvoidingView>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    keyboardView: {
        width: '100%',
        alignItems: 'center',
    },
    contentContainer: {
        width: '80%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 20,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
        width: '100%',
    },
    input: {
        flex: 1,
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'right',
        marginRight: 8,
    },
    unitText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    saveText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.surface,
    },
});

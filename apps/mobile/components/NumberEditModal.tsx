import React, { useState, useEffect } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
    TouchableWithoutFeedback,
    Keyboard,
    Pressable,
} from 'react-native';
import { COLORS } from '../constants';

interface NumberEditModalProps {
    visible: boolean;
    title: string;
    initialValue: number;
    onSave: (value: number, selectedColors?: string[]) => void;
    onCancel: () => void;
    vomitColors?: string[];
    isVomitMode?: boolean;
}

export default function NumberEditModal({
    visible,
    title,
    initialValue,
    onSave,
    onCancel,
    vomitColors = [],
    isVomitMode = false,
}: NumberEditModalProps) {
    const [value, setValue] = useState(initialValue.toString());
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const inputRef = React.useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setValue(initialValue.toString());
            // 구토 모드일 때만 기존 색상을 초기값으로 설정 (횟수가 줄어들 때)
            if (isVomitMode && vomitColors.length > 0) {
                setSelectedColors(vomitColors);
            } else {
                setSelectedColors([]);
            }
            // Force focus with a small delay for modal animation
            setTimeout(() => {
                inputRef.current?.focus();
            }, 100);
        }
    }, [visible, initialValue, isVomitMode, vomitColors]);

    const handleSave = () => {
        const num = parseInt(value, 10);
        if (!isNaN(num) && num >= 0) {
            if (isVomitMode) {
                // 선택된 색상 개수가 횟수와 맞는지 확인
                const finalColors = selectedColors.slice(0, num);
                onSave(num, finalColors);
            } else {
                onSave(num);
            }
        }
    };

    const toggleColor = (color: string) => {
        setSelectedColors(prev => {
            if (prev.includes(color)) {
                return prev.filter(c => c !== color);
            } else {
                return [...prev, color];
            }
        });
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
                            behavior="height"
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

                                {isVomitMode && parseInt(value, 10) > 0 && (
                                    <View style={styles.colorSection}>
                                        <Text style={styles.colorSectionTitle}>남겨둘 색상 선택 ({selectedColors.length}/{value})</Text>
                                        <View style={styles.colorGrid}>
                                            {vomitColors.map((color, index) => (
                                                <Pressable
                                                    key={index}
                                                    style={[
                                                        styles.colorChip,
                                                        selectedColors.includes(color) && styles.colorChipSelected
                                                    ]}
                                                    onPress={() => toggleColor(color)}
                                                >
                                                    <Text style={[
                                                        styles.colorChipText,
                                                        selectedColors.includes(color) && styles.colorChipTextSelected
                                                    ]}>{color}</Text>
                                                </Pressable>
                                            ))}
                                        </View>
                                        <Text style={styles.colorHint}>
                                            {parseInt(value, 10) > selectedColors.length
                                                ? `${parseInt(value, 10) - selectedColors.length}개 더 선택해주세요`
                                                : '선택 완료'}
                                        </Text>
                                    </View>
                                )}

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
    colorSection: {
        width: '100%',
        marginBottom: 16,
    },
    colorSectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
    },
    colorChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    colorChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    colorChipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    colorChipTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    colorHint: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

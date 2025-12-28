import React from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { COLORS } from '../constants';
import { Supplement } from '../services';

interface SupplementChecklistProps {
    supplements: Supplement[];
    takenStatus: Map<string, boolean>;
    onToggle: (supplementId: string) => void;
    onAdd: (name: string, type: 'medicine' | 'supplement') => void;
    onDelete?: (supplementId: string) => void;
}

export default function SupplementChecklist({
    supplements,
    takenStatus,
    onToggle,
    onAdd,
    onDelete,
}: SupplementChecklistProps) {
    const [showInput, setShowInput] = React.useState(false);
    const [newName, setNewName] = React.useState('');
    const [newType, setNewType] = React.useState<'medicine' | 'supplement'>('medicine');

    const handleAdd = () => {
        if (!newName.trim()) return;
        onAdd(newName, newType);
        setNewName('');
        setShowInput(false);
    };

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>약 / 영양제</Text>
            {supplements.map(supp => (
                <View key={supp.id} style={styles.checkItemContainer}>
                    <Pressable
                        style={styles.checkItem}
                        onPress={() => onToggle(supp.id)}
                    >
                        <View style={[styles.checkbox, takenStatus.get(supp.id) && styles.checkboxChecked]}>
                            {takenStatus.get(supp.id) && <Text style={styles.checkmark}>✓</Text>}
                        </View>
                        <Text style={styles.checkLabel}>{supp.name}</Text>
                    </Pressable>
                    {onDelete && (
                        <Pressable
                            style={styles.deleteButton}
                            onPress={() => {
                                Alert.alert(
                                    '삭제 확인',
                                    `"${supp.name}"을(를) 목록에서 삭제하시겠습니까?\n\n관련된 모든 복용 기록도 함께 삭제됩니다.`,
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '삭제',
                                            style: 'destructive',
                                            onPress: () => onDelete(supp.id)
                                        }
                                    ]
                                );
                            }}
                        >
                            <Feather name="trash-2" size={18} color={COLORS.error} />
                        </Pressable>
                    )}
                </View>
            ))}
            {supplements.length === 0 && !showInput && (
                <Pressable style={styles.emptyButton} onPress={() => setShowInput(true)}>
                    <Text style={styles.emptyButtonText}>+ 약/영양제 목록이 비어있어요. 추가하기</Text>
                </Pressable>
            )}

            {showInput ? (
                <View style={styles.inputContainer}>
                    <View style={styles.typeSelector}>
                        <Pressable
                            style={[styles.typeOption, newType === 'medicine' && styles.typeSelected]}
                            onPress={() => setNewType('medicine')}
                        >
                            <Text style={[styles.typeText, newType === 'medicine' && styles.typeTextSelected]}>약</Text>
                        </Pressable>
                        <Pressable
                            style={[styles.typeOption, newType === 'supplement' && styles.typeSelected]}
                            onPress={() => setNewType('supplement')}
                        >
                            <Text style={[styles.typeText, newType === 'supplement' && styles.typeTextSelected]}>영양제</Text>
                        </Pressable>
                    </View>
                    <View style={styles.inputRow}>
                        <View style={styles.textInputWrapper}>
                            <Text style={styles.inputLabel}>{newType === 'medicine' ? '약 이름' : '영양제 이름'}</Text>
                            <TextInput
                                style={styles.textInput}
                                value={newName}
                                onChangeText={setNewName}
                                placeholder="이름을 입력하세요"
                                autoFocus
                            />
                        </View>
                    </View>
                    <View style={styles.actionButtons}>
                        <Pressable style={styles.cancelButton} onPress={() => setShowInput(false)}>
                            <Text style={styles.cancelText}>취소</Text>
                        </Pressable>
                        <Pressable style={styles.addButton} onPress={handleAdd}>
                            <Text style={styles.addText}>추가</Text>
                        </Pressable>
                    </View>
                </View>
            ) : (
                supplements.length > 0 && (
                    <Pressable style={styles.addButtonLite} onPress={() => setShowInput(true)}>
                        <Text style={styles.addButtonLiteText}>+ 새로운 약/영양제 추가</Text>
                    </Pressable>
                )
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    checkItemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkItem: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    checkLabel: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    emptyButton: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 4,
    },
    emptyButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    inputContainer: {
        marginTop: 12,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        gap: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        backgroundColor: COLORS.surface,
        padding: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    typeOption: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 6,
    },
    typeSelected: {
        backgroundColor: COLORS.primary,
    },
    typeText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    typeTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    inputRow: {
        gap: 8,
    },
    textInputWrapper: {
        gap: 6,
    },
    inputLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginLeft: 2,
    },
    textInput: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        marginTop: 4,
    },
    cancelButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    cancelText: {
        color: COLORS.textSecondary,
        fontSize: 14,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addText: {
        color: COLORS.surface,
        fontWeight: '600',
        fontSize: 14,
    },
    addButtonLite: {
        paddingVertical: 12,
        alignItems: 'center',
        marginTop: 8,
    },
    addButtonLiteText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    deleteButton: {
        padding: 8,
        marginRight: 4,
    },
});

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants';
import Button from './button';

interface MemoEditModalProps {
    visible: boolean;
    title: string;
    name: string;
    memo: string;
    type?: 'dry' | 'wet' | null;
    showTypeSelector?: boolean;
    onCancel: () => void;
    onSave: (name: string, memo: string, type?: 'dry' | 'wet') => void;
}

export default function MemoEditModal({
    visible,
    title,
    name: initialName,
    memo: initialMemo,
    type: initialType,
    showTypeSelector = false,
    onCancel,
    onSave,
}: MemoEditModalProps) {
    const [name, setName] = useState(initialName);
    const [memo, setMemo] = useState(initialMemo);
    const [type, setType] = useState<'dry' | 'wet'>(initialType || 'dry');

    useEffect(() => {
        if (visible) {
            setName(initialName);
            setMemo(initialMemo);
            setType(initialType || 'dry');
        }
    }, [visible, initialName, initialMemo, initialType]);

    const handleSave = () => {
        if (!name.trim()) {
            return;
        }
        onSave(name.trim(), memo.trim(), showTypeSelector ? type : undefined);
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onCancel}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>{title}</Text>
                        <Pressable onPress={onCancel} hitSlop={8}>
                            <Feather name="x" size={24} color={COLORS.textPrimary} />
                        </Pressable>
                    </View>

                    <ScrollView style={styles.content}>
                        <Text style={styles.label}>
                            {showTypeSelector ? '사료 이름' : '약물 이름'} <Text style={styles.required}>*</Text>
                        </Text>
                        <TextInput
                            style={styles.input}
                            value={name}
                            onChangeText={setName}
                            placeholder={showTypeSelector ? '예: 로얄캐닌 유리너리' : '예: 세파클러'}
                            autoFocus
                        />

                        {showTypeSelector && (
                            <>
                                <Text style={styles.label}>
                                    사료 타입 <Text style={styles.required}>*</Text>
                                </Text>
                                <View style={styles.typeRow}>
                                    <Pressable
                                        style={[styles.typeButton, type === 'dry' && styles.typeButtonActive]}
                                        onPress={() => setType('dry')}
                                    >
                                        <Text style={[styles.typeText, type === 'dry' && styles.typeTextActive]}>
                                            건식
                                        </Text>
                                    </Pressable>
                                    <Pressable
                                        style={[styles.typeButton, type === 'wet' && styles.typeButtonActive]}
                                        onPress={() => setType('wet')}
                                    >
                                        <Text style={[styles.typeText, type === 'wet' && styles.typeTextActive]}>
                                            습식
                                        </Text>
                                    </Pressable>
                                </View>
                            </>
                        )}

                        <Text style={styles.label}>메모</Text>
                        <TextInput
                            style={[styles.input, styles.memoInput]}
                            value={memo}
                            onChangeText={setMemo}
                            placeholder={showTypeSelector ? '예: 잘 먹음, 기호성 좋음' : '예: 설사 유발, 사용 금지'}
                            multiline
                            numberOfLines={4}
                            textAlignVertical="top"
                        />
                    </ScrollView>

                    <View style={styles.footer}>
                        <Button
                            title="취소"
                            onPress={onCancel}
                            variant="secondary"
                            style={styles.button}
                        />
                        <Button
                            title="저장"
                            onPress={handleSave}
                            disabled={!name.trim()}
                            style={styles.button}
                        />
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        width: '100%',
        maxWidth: 400,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.textPrimary,
        marginBottom: 8,
        marginTop: 12,
    },
    required: {
        color: COLORS.error,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: COLORS.textPrimary,
        backgroundColor: COLORS.background,
    },
    memoInput: {
        minHeight: 100,
    },
    typeRow: {
        flexDirection: 'row',
        gap: 10,
    },
    typeButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    typeButtonActive: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    typeText: {
        fontSize: 15,
        color: COLORS.textSecondary,
    },
    typeTextActive: {
        color: '#FFF',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    button: {
        flex: 1,
    },
});

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card, MemoEditModal } from '../../../components';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import {
    getFoodPreferenceMemos,
    addFoodPreferenceMemo,
    updateFoodPreferenceMemo,
    deleteFoodPreferenceMemo,
    getMedicationMemos,
    addMedicationMemo,
    updateMedicationMemo,
    deleteMedicationMemo,
} from '../../../services';
import type { FoodPreferenceMemo, MedicationMemo } from '../../../services';

type ModalMode = 'add-food' | 'edit-food' | 'add-medication' | 'edit-medication' | null;

interface EditingItem {
    id?: string;
    name: string;
    memo: string;
    type?: 'dry' | 'wet';
}

export default function ReferenceMemosScreen() {
    const router = useRouter();
    const { selectedPet } = useSelectedPet();

    const [foodMemos, setFoodMemos] = useState<FoodPreferenceMemo[]>([]);
    const [medicationMemos, setMedicationMemos] = useState<MedicationMemo[]>([]);
    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editingItem, setEditingItem] = useState<EditingItem>({ name: '', memo: '' });

    const loadData = useCallback(async () => {
        if (!selectedPet?.id) return;

        const [food, medication] = await Promise.all([
            getFoodPreferenceMemos(selectedPet.id),
            getMedicationMemos(selectedPet.id),
        ]);

        setFoodMemos(food);
        setMedicationMemos(medication);
    }, [selectedPet?.id]);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [loadData])
    );

    const handleAddFood = () => {
        setEditingItem({ name: '', memo: '', type: 'dry' });
        setModalMode('add-food');
    };

    const handleEditFood = (memo: FoodPreferenceMemo) => {
        setEditingItem({
            id: memo.id,
            name: memo.foodName,
            memo: memo.memo || '',
            type: memo.foodType,
        });
        setModalMode('edit-food');
    };

    const handleDeleteFood = (memo: FoodPreferenceMemo) => {
        Alert.alert(
            '메모 삭제',
            `"${memo.foodName}" 메모를 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteFoodPreferenceMemo(memo.id);
                        await loadData();
                    },
                },
            ]
        );
    };

    const handleDeleteCurrentItem = () => {
        if (!modalMode || !editingItem.id) return;

        if (modalMode === 'edit-food') {
            const foodItem = foodMemos.find(m => m.id === editingItem.id);
            if (foodItem) {
                setModalMode(null); // Close modal first
                handleDeleteFood(foodItem);
            }
        } else if (modalMode === 'edit-medication') {
            const medItem = medicationMemos.find(m => m.id === editingItem.id);
            if (medItem) {
                setModalMode(null); // Close modal first
                handleDeleteMedication(medItem);
            }
        }
    };

    const handleAddMedication = () => {
        setEditingItem({ name: '', memo: '' });
        setModalMode('add-medication');
    };

    const handleEditMedication = (memo: MedicationMemo) => {
        setEditingItem({
            id: memo.id,
            name: memo.medicationName,
            memo: memo.memo || '',
        });
        setModalMode('edit-medication');
    };

    const handleDeleteMedication = (memo: MedicationMemo) => {
        Alert.alert(
            '메모 삭제',
            `"${memo.medicationName}" 메모를 삭제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteMedicationMemo(memo.id);
                        await loadData();
                    },
                },
            ]
        );
    };

    const handleSave = async (name: string, memo: string, type?: 'dry' | 'wet') => {
        if (!selectedPet?.id) return;

        if (modalMode === 'add-food' && type) {
            await addFoodPreferenceMemo(selectedPet.id, name, type, memo);
        } else if (modalMode === 'edit-food' && editingItem.id && type) {
            await updateFoodPreferenceMemo(editingItem.id, name, type, memo);
        } else if (modalMode === 'add-medication') {
            await addMedicationMemo(selectedPet.id, name, memo);
        } else if (modalMode === 'edit-medication' && editingItem.id) {
            await updateMedicationMemo(editingItem.id, name, memo);
        }

        setModalMode(null);
        await loadData();
    };

    const getFoodTypeBadge = (type: 'dry' | 'wet') => {
        return type === 'dry' ? '건식' : '습식';
    };

    const getFoodTypeBadgeColor = (type: 'dry' | 'wet') => {
        return type === 'dry' ? '#8B4513' : '#4682B4';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>참고용 메모 보관함</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Beta Notice */}
                <Card style={styles.betaNotice}>
                    <View style={styles.betaHeader}>
                        <Feather name="info" size={20} color={COLORS.primary} />
                        <Text style={styles.betaTitle}>베타 기능</Text>
                    </View>
                    <Text style={styles.betaDescription}>
                        본 기능은 실험적으로 제공되는 참고용 메모 공간입니다.{'\n'}
                        핵심 기록 기능과는 분리되어 있으며, 필요할 때만 사용해주세요.
                    </Text>
                </Card>

                {/* Food Preference Memos Section */}
                <Card style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>사료 기호성 메모</Text>
                            <Text style={styles.sectionDescription}>
                                먹어본 사료에 대한 간단한 참고 기록
                            </Text>
                        </View>
                        <Pressable
                            style={styles.addButton}
                            onPress={handleAddFood}
                            hitSlop={8}
                        >
                            <Feather name="plus" size={22} color={COLORS.primary} />
                        </Pressable>
                    </View>

                    {foodMemos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="coffee" size={32} color={COLORS.textSecondary} />
                            <Text style={styles.emptyText}>아직 메모가 없습니다</Text>
                            <Text style={styles.emptyHint}>+ 버튼을 눌러 추가해보세요</Text>
                        </View>
                    ) : (
                        foodMemos.map((memo, index) => (
                            <Pressable
                                key={memo.id}
                                style={[
                                    styles.memoItem,
                                    index === foodMemos.length - 1 && styles.memoItemLast,
                                ]}
                                onPress={() => handleEditFood(memo)}
                                onLongPress={() => handleDeleteFood(memo)}
                            >
                                <View style={styles.memoContent}>
                                    <View style={styles.memoHeader}>
                                        <View
                                            style={[
                                                styles.typeBadge,
                                                { backgroundColor: getFoodTypeBadgeColor(memo.foodType) + '20' },
                                            ]}
                                        >
                                            <Text
                                                style={[
                                                    styles.typeBadgeText,
                                                    { color: getFoodTypeBadgeColor(memo.foodType) },
                                                ]}
                                            >
                                                {getFoodTypeBadge(memo.foodType)}
                                            </Text>
                                        </View>
                                        <Text style={styles.memoName}>{memo.foodName}</Text>
                                    </View>
                                    {memo.memo && (
                                        <Text style={styles.memoText} numberOfLines={2}>
                                            {memo.memo}
                                        </Text>
                                    )}
                                </View>
                                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                            </Pressable>
                        ))
                    )}
                </Card>

                {/* Medication Memos Section */}
                <Card style={styles.card}>
                    <View style={styles.sectionHeader}>
                        <View>
                            <Text style={styles.sectionTitle}>약물(항생제) 메모</Text>
                            <Text style={styles.sectionDescription}>
                                맞지 않았던 약물 또는 주의가 필요한 약물
                            </Text>
                        </View>
                        <Pressable
                            style={styles.addButton}
                            onPress={handleAddMedication}
                            hitSlop={8}
                        >
                            <Feather name="plus" size={22} color={COLORS.primary} />
                        </Pressable>
                    </View>

                    {medicationMemos.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Feather name="package" size={32} color={COLORS.textSecondary} />
                            <Text style={styles.emptyText}>아직 메모가 없습니다</Text>
                            <Text style={styles.emptyHint}>+ 버튼을 눌러 추가해보세요</Text>
                        </View>
                    ) : (
                        medicationMemos.map((memo, index) => (
                            <Pressable
                                key={memo.id}
                                style={[
                                    styles.memoItem,
                                    index === medicationMemos.length - 1 && styles.memoItemLast,
                                ]}
                                onPress={() => handleEditMedication(memo)}
                                onLongPress={() => handleDeleteMedication(memo)}
                            >
                                <View style={styles.memoContent}>
                                    <Text style={styles.memoName}>{memo.medicationName}</Text>
                                    {memo.memo && (
                                        <Text style={styles.memoText} numberOfLines={2}>
                                            {memo.memo}
                                        </Text>
                                    )}
                                </View>
                                <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                            </Pressable>
                        ))
                    )}
                </Card>

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Memo Edit Modal */}
            <MemoEditModal
                visible={modalMode !== null}
                title={
                    modalMode === 'add-food'
                        ? '사료 메모 추가'
                        : modalMode === 'edit-food'
                            ? '사료 메모 수정'
                            : modalMode === 'add-medication'
                                ? '약물 메모 추가'
                                : '약물 메모 수정'
                }
                name={editingItem.name}
                memo={editingItem.memo}
                type={editingItem.type}
                showTypeSelector={modalMode === 'add-food' || modalMode === 'edit-food'}
                onCancel={() => setModalMode(null)}
                onSave={handleSave}
                onDelete={
                    (modalMode === 'edit-food' || modalMode === 'edit-medication')
                        ? handleDeleteCurrentItem
                        : undefined
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
        padding: 16,
    },
    betaNotice: {
        marginBottom: 16,
        backgroundColor: '#F0F8FF',
        borderWidth: 1,
        borderColor: COLORS.primary + '30',
    },
    betaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    betaTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
    },
    betaDescription: {
        fontSize: 13,
        lineHeight: 20,
        color: COLORS.textSecondary,
    },
    card: {
        marginBottom: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 17,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    sectionDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    addButton: {
        padding: 4,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 32,
    },
    emptyText: {
        fontSize: 15,
        color: COLORS.textSecondary,
        marginTop: 12,
    },
    emptyHint: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    memoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    memoItemLast: {
        borderBottomWidth: 0,
    },
    memoContent: {
        flex: 1,
    },
    memoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 4,
    },
    typeBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    memoName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
        flex: 1,
    },
    memoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 32,
    },
});

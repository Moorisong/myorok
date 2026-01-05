import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS, ALERT_TITLES, SUCCESS_MESSAGES, VALIDATION_MESSAGES, PET_MESSAGES } from '../../../constants';
import { getAllPets, addPet, updatePet, deletePet, restorePet, permanentDeletePet } from '../../../services';
import type { Pet } from '../../../services';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import { useToast } from '../../../components/ToastContext';
import { Card } from '../../../components';

export default function PetsManagementScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { refreshPets: refreshGlobalPets, selectedPetId } = useSelectedPet();
    const [pets, setPets] = useState<Pet[]>([]);
    const [deletedPets, setDeletedPets] = useState<Pet[]>([]);
    const [showDeleted, setShowDeleted] = useState(false);
    const [addModalVisible, setAddModalVisible] = useState(false);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [newPetName, setNewPetName] = useState('');
    const [editingPet, setEditingPet] = useState<Pet | null>(null);
    const [editedName, setEditedName] = useState('');

    const loadPets = async () => {
        const allPets = await getAllPets(true);
        const active = allPets.filter(p => !p.deletedAt);
        const deleted = allPets.filter(p => p.deletedAt);
        setPets(active);
        setDeletedPets(deleted);
    };

    useFocusEffect(
        useCallback(() => {
            loadPets();
        }, [])
    );

    const handleAddPet = async () => {
        if (!newPetName.trim()) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_PET_NAME);
            return;
        }

        const trimmedName = newPetName.trim();
        const isDuplicate = pets.some(pet => pet.name.toLowerCase() === trimmedName.toLowerCase());

        if (isDuplicate) {
            Alert.alert(ALERT_TITLES.ALERT, '이미 같은 이름의 고양이가 있습니다.');
            return;
        }

        try {
            await addPet(trimmedName);
            setNewPetName('');
            setAddModalVisible(false);
            await loadPets();
            await refreshGlobalPets();
            showToast(SUCCESS_MESSAGES.PET_ADDED);
        } catch (error) {
            console.error('Error adding pet:', error);
            Alert.alert(ALERT_TITLES.ERROR, '고양이 추가 중 문제가 발생했습니다.');
        }
    };

    const handleEditPet = async () => {
        if (!editingPet || !editedName.trim()) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_PET_NAME);
            return;
        }

        const trimmedName = editedName.trim();
        const isDuplicate = pets.some(
            pet => pet.id !== editingPet.id && pet.name.toLowerCase() === trimmedName.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert(ALERT_TITLES.ALERT, '이미 같은 이름의 고양이가 있습니다.');
            return;
        }

        try {
            await updatePet(editingPet.id, trimmedName);
            setEditModalVisible(false);
            setEditingPet(null);
            setEditedName('');
            await loadPets();
            await refreshGlobalPets();
            showToast(SUCCESS_MESSAGES.PET_UPDATED);
        } catch (error) {
            console.error('Error updating pet:', error);
            Alert.alert(ALERT_TITLES.ERROR, '고양이 수정 중 문제가 발생했습니다.');
        }
    };

    const handleDeletePet = (pet: Pet) => {
        if (pets.length === 1) {
            Alert.alert(ALERT_TITLES.ALERT, PET_MESSAGES.DELETE_LAST_PET_WARNING);
            return;
        }

        Alert.alert(
            ALERT_TITLES.DELETE_CONFIRM,
            PET_MESSAGES.DELETE_WARNING,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deletePet(pet.id);
                            await loadPets();
                            await refreshGlobalPets();
                            showToast(SUCCESS_MESSAGES.PET_DELETED);
                        } catch (error) {
                            console.error('Error deleting pet:', error);
                            Alert.alert(ALERT_TITLES.ERROR, '삭제 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleRestorePet = (pet: Pet) => {
        const isDuplicate = pets.some(
            activePet => activePet.name.toLowerCase() === pet.name.toLowerCase()
        );

        if (isDuplicate) {
            Alert.alert(
                ALERT_TITLES.ALERT,
                `이미 "${pet.name}"(이)라는 이름의 활성 고양이가 있습니다. 같은 이름으로 복원할 수 없습니다.`
            );
            return;
        }

        Alert.alert(
            ALERT_TITLES.RESTORE,
            PET_MESSAGES.RESTORE_CONFIRM,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '복원',
                    onPress: async () => {
                        try {
                            await restorePet(pet.id);
                            await loadPets();
                            await refreshGlobalPets();
                            showToast(SUCCESS_MESSAGES.PET_RESTORED);
                        } catch (error) {
                            console.error('Error restoring pet:', error);
                            Alert.alert(ALERT_TITLES.ERROR, '복원 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handlePermanentDelete = (pet: Pet) => {
        Alert.alert(
            '완전 삭제',
            `"${pet.name}"의 기록은 남지만, 고양이 계정은 완전히 삭제됩니다. 이 작업은 되돌릴 수 없습니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '완전 삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await permanentDeletePet(pet.id);
                            await loadPets();
                            await refreshGlobalPets();
                            showToast('고양이 계정이 완전히 삭제되었습니다.');
                        } catch (error) {
                            console.error('Error permanently deleting pet:', error);
                            Alert.alert(ALERT_TITLES.ERROR, '완전 삭제 중 문제가 발생했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const openEditModal = (pet: Pet) => {
        setEditingPet(pet);
        setEditedName(pet.name);
        setEditModalVisible(true);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>고양이 관리</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.scrollView}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>고양이 목록</Text>
                    {pets.map((pet, index) => (
                        <PetItem
                            key={pet.id}
                            pet={pet}
                            onEdit={() => openEditModal(pet)}
                            onDelete={() => handleDeletePet(pet)}
                            isLast={index === pets.length - 1}
                        />
                    ))}

                    <Pressable
                        style={({ pressed }) => [
                            styles.addItem,
                            pressed && styles.itemPressed,
                        ]}
                        onPress={() => setAddModalVisible(true)}
                    >
                        <Feather name="plus" size={20} color={COLORS.primary} />
                        <Text style={styles.addItemText}>고양이 추가</Text>
                    </Pressable>
                </Card>

                {deletedPets.length > 0 && (
                    <Card style={styles.card}>
                        <Pressable
                            style={({ pressed }) => [
                                styles.deletedHeader,
                                pressed && styles.itemPressed,
                            ]}
                            onPress={() => setShowDeleted(!showDeleted)}
                        >
                            <Text style={styles.sectionTitle}>
                                삭제된 고양이 ({deletedPets.length})
                            </Text>
                            <Feather
                                name={showDeleted ? 'chevron-up' : 'chevron-down'}
                                size={20}
                                color={COLORS.textSecondary}
                            />
                        </Pressable>

                        {showDeleted && deletedPets.map((pet, index) => (
                            <DeletedPetItem
                                key={pet.id}
                                pet={pet}
                                onRestore={() => handleRestorePet(pet)}
                                onPermanentDelete={() => handlePermanentDelete(pet)}
                                isLast={index === deletedPets.length - 1}
                            />
                        ))}
                    </Card>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>

            {/* Add Pet Modal */}
            <Modal
                visible={addModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setAddModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>고양이 추가</Text>
                        <TextInput
                            style={styles.input}
                            value={newPetName}
                            onChangeText={setNewPetName}
                            placeholder="고양이 이름"
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setAddModalVisible(false);
                                    setNewPetName('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddPet}
                            >
                                <Text style={styles.confirmButtonText}>추가</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Edit Pet Modal */}
            <Modal
                visible={editModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setEditModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>고양이 이름 수정</Text>
                        <TextInput
                            style={styles.input}
                            value={editedName}
                            onChangeText={setEditedName}
                            placeholder="고양이 이름"
                            autoFocus={true}
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setEditingPet(null);
                                    setEditedName('');
                                }}
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleEditPet}
                            >
                                <Text style={styles.confirmButtonText}>저장</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

interface PetItemProps {
    pet: Pet;
    onEdit: () => void;
    onDelete: () => void;
    isLast: boolean;
}

function PetItem({ pet, onEdit, onDelete, isLast }: PetItemProps) {
    return (
        <View style={[styles.itemRow, !isLast && styles.itemBorder]}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.itemActions}>
                <Pressable
                    onPress={onEdit}
                    style={({ pressed }) => [styles.actionButton, pressed && styles.itemPressed]}
                >
                    <Feather name="edit-2" size={18} color={COLORS.textSecondary} />
                </Pressable>
                <Pressable
                    onPress={onDelete}
                    style={({ pressed }) => [styles.actionButton, pressed && styles.itemPressed]}
                >
                    <Feather name="trash-2" size={18} color={COLORS.error} />
                </Pressable>
            </View>
        </View>
    );
}

interface DeletedPetItemProps {
    pet: Pet;
    onRestore: () => void;
    onPermanentDelete: () => void;
    isLast: boolean;
}

function DeletedPetItem({ pet, onRestore, onPermanentDelete, isLast }: DeletedPetItemProps) {
    return (
        <View style={[styles.itemRow, !isLast && styles.itemBorder]}>
            <Text style={styles.deletedPetName}>{pet.name}</Text>
            <View style={styles.itemActions}>
                <Pressable
                    onPress={onRestore}
                    style={({ pressed }) => [styles.textActionButton, pressed && styles.itemPressed]}
                >
                    <Text style={styles.restoreText}>복원</Text>
                </Pressable>
                <Pressable
                    onPress={onPermanentDelete}
                    style={({ pressed }) => [styles.textActionButton, pressed && styles.itemPressed]}
                >
                    <Text style={styles.permanentDeleteText}>완전삭제</Text>
                </Pressable>
            </View>
        </View>
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
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
    },
    itemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    itemPressed: {
        opacity: 0.7,
    },
    petName: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    itemActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    deletedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 4,
    },
    deletedPetName: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    textActionButton: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary,
    },
    permanentDeleteText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.error,
    },
    addItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        marginTop: 4,
    },
    addItemText: {
        fontSize: 16,
        color: COLORS.primary,
        marginLeft: 12,
        fontWeight: '500',
    },
    bottomPadding: {
        height: 32,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        width: '80%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: COLORS.background,
    },
    cancelButtonText: {
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    confirmButton: {
        backgroundColor: COLORS.primary,
    },
    confirmButtonText: {
        color: COLORS.surface,
        fontWeight: '600',
    },
});

import { View, Text, TextInput, Pressable, StyleSheet, Alert, FlatList, Modal } from 'react-native';
import { useState, useCallback } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS, ALERT_TITLES, SUCCESS_MESSAGES, VALIDATION_MESSAGES, PET_MESSAGES } from '../../../constants';
import { getAllPets, addPet, updatePet, deletePet, restorePet, permanentDeletePet } from '../../../services';
import type { Pet } from '../../../services';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import { useToast } from '../../../components/ToastContext';

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

        // Check for duplicate name among active pets
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

        // Check for duplicate name among active pets (excluding itself)
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
        // Check if this is the last pet
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
                            const isSelectedPet = selectedPetId === pet.id;

                            await deletePet(pet.id);
                            await loadPets();

                            // If deleted pet was selected, refresh will auto-switch to first available pet
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
        // Check for duplicate name among active pets
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
                    onPress={() => router.back()}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="뒤로가기"
                >
                    <Feather name="chevron-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>고양이 관리</Text>
                <View style={{ width: 24 }} />
            </View>

            <FlatList
                data={pets}
                keyExtractor={item => item.id}
                ListHeaderComponent={
                    <Text style={styles.sectionTitle}>활성 고양이 ({pets.length})</Text>
                }
                renderItem={({ item }) => (
                    <PetItem
                        pet={item}
                        onEdit={() => openEditModal(item)}
                        onDelete={() => handleDeletePet(item)}
                    />
                )}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>등록된 고양이가 없습니다.</Text>
                }
                ListFooterComponent={
                    deletedPets.length > 0 ? (
                        <View style={styles.deletedSection}>
                            <Pressable
                                style={styles.deletedHeader}
                                onPress={() => setShowDeleted(!showDeleted)}
                                accessible={true}
                                accessibilityRole="button"
                            >
                                <Text style={styles.deletedHeaderText}>
                                    삭제된 고양이 ({deletedPets.length})
                                </Text>
                                <Feather
                                    name={showDeleted ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={COLORS.textSecondary}
                                />
                            </Pressable>
                            {showDeleted &&
                                deletedPets.map(pet => (
                                    <DeletedPetItem
                                        key={pet.id}
                                        pet={pet}
                                        onRestore={() => handleRestorePet(pet)}
                                        onPermanentDelete={() => handlePermanentDelete(pet)}
                                    />
                                ))}
                        </View>
                    ) : null
                }
            />

            <Pressable
                style={styles.addButton}
                onPress={() => setAddModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="고양이 추가"
            >
                <Feather name="plus" size={24} color={COLORS.surface} />
                <Text style={styles.addButtonText}>고양이 추가</Text>
            </Pressable>

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
                            accessible={true}
                            accessibilityLabel="고양이 이름 입력"
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setAddModalVisible(false);
                                    setNewPetName('');
                                }}
                                accessible={true}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddPet}
                                accessible={true}
                                accessibilityRole="button"
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
                            accessible={true}
                            accessibilityLabel="고양이 이름 입력"
                        />
                        <View style={styles.modalButtons}>
                            <Pressable
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => {
                                    setEditModalVisible(false);
                                    setEditingPet(null);
                                    setEditedName('');
                                }}
                                accessible={true}
                                accessibilityRole="button"
                            >
                                <Text style={styles.cancelButtonText}>취소</Text>
                            </Pressable>
                            <Pressable
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleEditPet}
                                accessible={true}
                                accessibilityRole="button"
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
}

function PetItem({ pet, onEdit, onDelete }: PetItemProps) {
    return (
        <View style={styles.petItem}>
            <Text style={styles.petName}>{pet.name}</Text>
            <View style={styles.petActions}>
                <Pressable
                    onPress={onEdit}
                    style={styles.actionButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="이름 수정"
                >
                    <Feather name="edit-2" size={20} color={COLORS.textSecondary} />
                </Pressable>
                <Pressable
                    onPress={onDelete}
                    style={styles.actionButton}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="삭제"
                >
                    <Feather name="trash-2" size={20} color={COLORS.error} />
                </Pressable>
            </View>
        </View>
    );
}

interface DeletedPetItemProps {
    pet: Pet;
    onRestore: () => void;
    onPermanentDelete: () => void;
}

function DeletedPetItem({ pet, onRestore, onPermanentDelete }: DeletedPetItemProps) {
    return (
        <View style={styles.deletedPetItem}>
            <Text style={styles.deletedPetName}>{pet.name}</Text>
            <View style={styles.deletedPetActions}>
                <Pressable
                    onPress={onRestore}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="복원"
                    style={styles.deletedActionButton}
                >
                    <Text style={styles.restoreText}>복원</Text>
                </Pressable>
                <Pressable
                    onPress={onPermanentDelete}
                    accessible={true}
                    accessibilityRole="button"
                    accessibilityLabel="완전삭제"
                    style={styles.deletedActionButton}
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
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 8,
    },
    petItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    petName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    petActions: {
        flexDirection: 'row',
        gap: 16,
    },
    actionButton: {
        padding: 4,
    },
    emptyText: {
        textAlign: 'center',
        color: COLORS.textSecondary,
        paddingVertical: 32,
    },
    deletedSection: {
        marginTop: 16,
    },
    deletedHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.surface,
    },
    deletedHeaderText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    deletedPetItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        paddingLeft: 32,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
        opacity: 0.6,
    },
    deletedPetName: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.primary,
    },
    deletedPetActions: {
        flexDirection: 'row',
        gap: 12,
    },
    deletedActionButton: {
        padding: 4,
    },
    permanentDeleteText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.error,
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        padding: 16,
        margin: 16,
        borderRadius: 12,
        gap: 8,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.surface,
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

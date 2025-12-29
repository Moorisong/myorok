import { View, Text, Pressable, StyleSheet, Modal, FlatList } from 'react-native';
import { useState } from 'react';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { useSelectedPet } from '../hooks/use-selected-pet';
import type { Pet } from '../services';

export default function PetSelector() {
    const { selectedPet, allPets, changePet } = useSelectedPet();
    const [modalVisible, setModalVisible] = useState(false);

    const handleSelectPet = (petId: string) => {
        changePet(petId);
        setModalVisible(false);
    };

    // Don't show if no pets exist
    if (allPets.length === 0) {
        return null;
    }

    // Single pet: show styled name card
    if (allPets.length === 1) {
        const petName = selectedPet?.name || allPets[0].name;
        return (
            <View style={styles.singlePetContainer}>
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>🐱</Text>
                </View>
                <Text style={styles.singlePetName}>{petName}</Text>
            </View>
        );
    }

    // Multiple pets: show styled selector
    const displayName = selectedPet?.name || allPets[0].name;

    return (
        <>
            <Pressable
                style={({ pressed }) => [
                    styles.selectorContainer,
                    pressed && styles.selectorPressed
                ]}
                onPress={() => setModalVisible(true)}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="고양이 선택"
            >
                <View style={styles.avatarCircle}>
                    <Text style={styles.avatarEmoji}>🐱</Text>
                </View>
                <Text style={styles.selectedPetName}>{displayName}</Text>
                <View style={styles.chevronCircle}>
                    <Feather name="chevron-down" size={16} color={COLORS.primary} />
                </View>
            </Pressable>

            <Modal
                visible={modalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setModalVisible(false)}
                >
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>고양이 선택</Text>
                            <Pressable
                                style={styles.closeButton}
                                onPress={() => setModalVisible(false)}
                                accessible={true}
                                accessibilityRole="button"
                                accessibilityLabel="닫기"
                            >
                                <Feather name="x" size={20} color={COLORS.textSecondary} />
                            </Pressable>
                        </View>

                        <FlatList
                            data={allPets}
                            keyExtractor={item => item.id}
                            contentContainerStyle={styles.listContainer}
                            renderItem={({ item }) => (
                                <PetListItem
                                    pet={item}
                                    isSelected={selectedPet ? item.id === selectedPet.id : item.id === allPets[0].id}
                                    onPress={() => handleSelectPet(item.id)}
                                />
                            )}
                        />
                    </View>
                </Pressable>
            </Modal>
        </>
    );
}

interface PetListItemProps {
    pet: Pet;
    isSelected: boolean;
    onPress: () => void;
}

function PetListItem({ pet, isSelected, onPress }: PetListItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.petItem,
                isSelected && styles.petItemSelected,
                pressed && styles.petItemPressed
            ]}
            onPress={onPress}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={`${pet.name} 선택`}
        >
            <View style={styles.petItemLeft}>
                <View style={[styles.petAvatarCircle, isSelected && styles.petAvatarSelected]}>
                    <Text style={styles.petAvatarEmoji}>🐱</Text>
                </View>
                <Text style={[styles.petName, isSelected && styles.petNameSelected]}>
                    {pet.name}
                </Text>
            </View>
            {isSelected && (
                <View style={styles.checkCircle}>
                    <Feather name="check" size={14} color="#fff" />
                </View>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    // Single Pet Display
    singlePetContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    singlePetName: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 8,
    },

    // Selector Button
    selectorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 6,
        paddingRight: 10,
        paddingVertical: 6,
        backgroundColor: COLORS.surface,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    selectorPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.98 }],
    },
    avatarCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarEmoji: {
        fontSize: 18,
    },
    selectedPetName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginLeft: 8,
        marginRight: 4,
    },
    chevronCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${COLORS.primary}15`,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        width: '85%',
        maxHeight: '60%',
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    modalTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    modalIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContainer: {
        padding: 12,
    },

    // Pet List Item
    petItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 14,
        marginBottom: 8,
        borderRadius: 14,
        backgroundColor: COLORS.background,
    },
    petItemSelected: {
        backgroundColor: `${COLORS.primary}12`,
        borderWidth: 1.5,
        borderColor: COLORS.primary,
    },
    petItemPressed: {
        opacity: 0.7,
    },
    petItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    petAvatarCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FEF3C7',
        justifyContent: 'center',
        alignItems: 'center',
    },
    petAvatarSelected: {
        backgroundColor: '#FDE68A',
    },
    petAvatarEmoji: {
        fontSize: 22,
    },
    petName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        marginLeft: 12,
    },
    petNameSelected: {
        fontWeight: '700',
        color: COLORS.primary,
    },
    checkCircle: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
});

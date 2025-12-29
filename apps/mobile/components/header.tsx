import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '../constants';
import { useSelectedPet } from '../hooks/use-selected-pet';

interface HeaderProps {
    title: string;
    showBack?: boolean;
    showPetName?: boolean;
}

export default function Header({ title, showBack = false, showPetName = false }: HeaderProps) {
    const router = useRouter();
    const { selectedPet } = useSelectedPet();

    return (
        <View style={styles.header}>
            {showBack ? (
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
            ) : (
                <View style={styles.placeholder} />
            )}
            <Text style={styles.title}>{title}</Text>
            {showPetName && selectedPet ? (
                <View style={styles.petIndicator}>
                    <Text style={styles.petEmoji}>🐱</Text>
                    <Text style={styles.petName} numberOfLines={1}>{selectedPet.name}</Text>
                </View>
            ) : (
                <View style={styles.placeholder} />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 24,
        color: COLORS.textPrimary,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 40,
    },
    petIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        maxWidth: 100,
    },
    petEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});

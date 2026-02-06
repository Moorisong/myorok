import React, { useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';

interface CounterButtonProps {
    emoji: React.ReactNode;
    label: string;
    count: number;
    onPressAdd: () => void;
    onPressSubtract?: () => void;
    onPressCount: () => void;
    warning?: boolean;
}

export default function CounterButton({
    emoji,
    label,
    count,
    onPressAdd,
    onPressSubtract,
    onPressCount,
    warning = false,
}: CounterButtonProps) {
    const scaleAnim = useRef(new Animated.Value(1)).current;

    const animateButton = () => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
            }),
        ]).start();
    };

    const handleAdd = () => {
        animateButton();
        onPressAdd();
    };

    const handleSubtract = () => {
        if (onPressSubtract) onPressSubtract();
    };

    return (
        <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                style={[styles.card, warning && styles.cardWarning]}
                onPress={onPressCount}
            >
                <View style={[styles.emojiContainer, warning && styles.emojiContainerWarning]}>
                    {typeof emoji === 'string' ? (
                        <Text style={styles.emoji}>{emoji}</Text>
                    ) : (
                        emoji
                    )}
                </View>

                <View style={styles.contentContainer}>
                    <Text style={styles.label}>{label}</Text>
                    <Text style={styles.count}>{count}회</Text>
                </View>

                <View style={styles.actions}>
                    {onPressSubtract && (
                        <Pressable
                            style={styles.actionButtonSecondary}
                            onPress={handleSubtract}
                            hitSlop={10}
                        >
                            <Feather name="minus" size={16} color={COLORS.textSecondary} />
                        </Pressable>
                    )}

                    <Pressable
                        style={[styles.actionButtonPrimary, warning && styles.actionButtonWarning]}
                        onPress={handleAdd}
                    >
                        <Feather name="plus" size={20} color="#FFF" />
                    </Pressable>
                </View>
            </Pressable>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '48%',
        marginBottom: 8,
    },
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 20,
        padding: 12, // Reduced padding
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
    },
    cardWarning: {
        backgroundColor: '#FFFBF5',
        borderColor: 'rgba(212, 145, 92, 0.2)',
    },
    emojiContainer: {
        width: 44, // Reduced size
        height: 44, // Reduced size
        borderRadius: 22,
        backgroundColor: COLORS.lightBg,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8, // Reduced margin
    },
    emojiContainerWarning: {
        backgroundColor: '#FFF0E0',
    },
    emoji: {
        fontSize: 22, // Reduced font size
    },
    contentContainer: {
        alignItems: 'center',
        marginBottom: 12, // Reduced margin
    },
    label: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
        fontWeight: '500',
    },
    count: {
        fontSize: 18, // Reduced font size
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16, // Increased gap
    },
    actionButtonPrimary: {
        width: 36, // Reduced size
        height: 36, // Reduced size
        borderRadius: 18,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 3,
    },
    actionButtonWarning: {
        backgroundColor: COLORS.warning,
        shadowColor: COLORS.warning,
    },
    actionButtonSecondary: {
        width: 30, // Reduced size
        height: 30, // Reduced size
        borderRadius: 15,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
});


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
    const addScaleAnim = useRef(new Animated.Value(1)).current;
    const subtractScaleAnim = useRef(new Animated.Value(1)).current;

    const animateButton = (scaleAnim: Animated.Value) => {
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.15,
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

    const handleAddPress = () => {
        animateButton(addScaleAnim);
        onPressAdd();
    };

    const handleSubtractPress = () => {
        animateButton(subtractScaleAnim);
        onPressSubtract?.();
    };

    return (
        <View style={[styles.counterBtn, warning && styles.counterBtnWarning]}>
            {/* Edit Area (Top) */}
            <Pressable
                style={({ pressed }) => [
                    styles.counterContent,
                    pressed && { backgroundColor: 'rgba(0,0,0,0.02)' },
                ]}
                onPress={onPressCount}
            >
                {/* <View style={styles.editIconContainer}>
                    <Feather name="edit-2" size={12} color={COLORS.textSecondary} style={{ opacity: 0.5 }} />
                </View> */}
                <View style={{ height: 40, justifyContent: 'center', marginBottom: 4 }}>
                    {typeof emoji === 'string' ? (
                        <Text style={styles.counterEmoji}>{emoji}</Text>
                    ) : (
                        emoji
                    )}
                </View>
                <Text style={styles.counterLabel}>{label}</Text>
                <Text style={styles.counterCount}>{count}회</Text>
            </Pressable>

            {/* Button Row (Bottom) */}
            <View style={styles.buttonRow}>
                {onPressSubtract && (
                    <Animated.View style={{ flex: 1, transform: [{ scale: subtractScaleAnim }] }}>
                        <Pressable
                            style={styles.subtractButton}
                            onPress={handleSubtractPress}
                        >
                            <Feather name="minus" size={14} color={COLORS.textSecondary} style={{ marginRight: 2 }} />
                            <Text style={[styles.counterPlusText, { color: COLORS.textSecondary }]}>1</Text>
                        </Pressable>
                    </Animated.View>
                )}
                <Animated.View
                    style={[
                        onPressSubtract && { flex: 1 },
                        { transform: [{ scale: addScaleAnim }] }
                    ]}
                >
                    <Pressable
                        style={[
                            styles.plusButton,
                            { backgroundColor: COLORS.primary },
                        ]}
                        onPress={handleAddPress}
                    >
                        <Feather
                            name="plus"
                            size={14}
                            color="#FFFFFF"
                            style={{ marginRight: 2 }}
                        />
                        <Text style={[
                            styles.counterPlusText,
                            { color: '#FFFFFF' }
                        ]}>1</Text>
                    </Pressable>
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    counterBtn: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        // Shadow removed
        borderWidth: 1,
        borderColor: COLORS.lightGray,
        marginBottom: 10,
    },
    counterContent: {
        padding: 12,
        paddingTop: 16,
        alignItems: 'center',
        width: '100%',
        backgroundColor: COLORS.lightBg,
    },
    editIconContainer: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    buttonRow: {
        flexDirection: 'row',
        width: '100%',
    },
    subtractButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        alignItems: 'center',
        backgroundColor: COLORS.background,
        width: '100%',
    },
    plusButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 12,
        alignItems: 'center',
        width: '100%',
    },
    counterBtnWarning: {
        backgroundColor: COLORS.warningBg,
    },
    counterEmoji: {
        fontSize: 20,
        marginBottom: 4,
    },
    counterLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    counterCount: {
        fontSize: 18,
        fontWeight: '800',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    counterPlusText: {
        fontSize: 13,
        fontWeight: '700',
    },
});

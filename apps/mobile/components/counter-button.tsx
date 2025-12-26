import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';

interface CounterButtonProps {
    emoji: React.ReactNode;
    label: string;
    count: number;
    onPressAdd: () => void;
    onPressCount: () => void;
    warning?: boolean;
}

export default function CounterButton({
    emoji,
    label,
    count,
    onPressAdd,
    onPressCount,
    warning = false,
}: CounterButtonProps) {
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
                <View style={styles.editIconContainer}>
                    <Feather name="edit-2" size={12} color={COLORS.textSecondary} style={{ opacity: 0.5 }} />
                </View>
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

            {/* +1 Button (Bottom) */}
            <Pressable
                style={({ pressed }) => [
                    styles.plusButton,
                    { backgroundColor: warning ? COLORS.error : COLORS.primary },
                    pressed && { opacity: 0.8 },
                ]}
                onPress={onPressAdd}
            >
                <Feather name="plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.counterPlusWhite}>1</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    counterBtn: {
        width: '48%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 10,
    },
    counterContent: {
        padding: 12,
        paddingTop: 16,
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#FAFAFA',
    },
    editIconContainer: {
        position: 'absolute',
        top: 6,
        right: 6,
    },
    plusButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10,
        alignItems: 'center',
        width: '100%',
    },
    counterBtnWarning: {
        backgroundColor: '#FFF8E1',
    },
    counterEmoji: {
        fontSize: 24,
        marginBottom: 2,
    },
    counterLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 0,
    },
    counterCount: {
        fontSize: 20,
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    counterPlusWhite: {
        fontSize: 14,
        color: '#FFFFFF',
        fontWeight: '800',
    },
});

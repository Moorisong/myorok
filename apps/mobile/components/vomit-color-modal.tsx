import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { VOMIT_COLORS, DANGER_VOMIT_COLOR, type VomitColor } from '../constants/vomit-colors';

interface VomitColorModalProps {
    visible: boolean;
    onClose: () => void;
    onSelect: (color: VomitColor) => void;
}

export default function VomitColorModal({
    visible,
    onClose,
    onSelect,
}: VomitColorModalProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={styles.backdrop} onPress={onClose} />
                <View style={styles.container}>
                    <View style={styles.header}>
                        <Text style={styles.title}>구토 색상 선택</Text>
                        <Pressable onPress={onClose} hitSlop={8}>
                            <Feather name="x" size={24} color={COLORS.textPrimary} />
                        </Pressable>
                    </View>

                    <View style={styles.content}>
                        <Text style={styles.description}>
                            구토 색상을 선택하면 카운트가 올라갑니다
                        </Text>

                        <View style={styles.colorGrid}>
                            {VOMIT_COLORS.map((color) => (
                                <Pressable
                                    key={color}
                                    style={styles.colorOption}
                                    onPress={() => onSelect(color)}
                                >
                                    <View style={[
                                        styles.colorDot,
                                        { backgroundColor: getVomitColorCode(color) }
                                    ]} />
                                    <Text style={styles.colorOptionText}>
                                        {color}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

// Helper to Map text color to hex for visual dot
function getVomitColorCode(color: VomitColor): string {
    switch (color) {
        case '투명': return '#E0E0E0';
        case '흰색': return '#FFFFFF';
        case '사료토': return '#8B4513';
        case '노란색': return '#FFD700';
        case '갈색': return '#5D4037';
        case '혈색': return '#FF0000';
        default: return '#E0E0E0';
    }
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        width: '100%',
        maxWidth: 300,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 24,
    },
    description: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 16,
        textAlign: 'center',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        justifyContent: 'center',
    },
    colorOption: {
        width: '30%',
        aspectRatio: 1,
        backgroundColor: COLORS.lightBg,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingBottom: 10, // Added to lift text up
    },
    // dangerOption removed
    colorDot: {
        width: 20,
        height: 20,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    colorOptionText: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    // dangerText removed
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { FluidRecord } from '../services';

interface FluidInputSectionProps {
    todayFluids: FluidRecord[];
    onAddFluid: (type: 'subcutaneous' | 'iv', volume: number) => void;
    onDeleteFluid: (id: string) => void;
}

export default function FluidInputSection({
    todayFluids,
    onAddFluid,
    onDeleteFluid,
}: FluidInputSectionProps) {
    const [showFluidInput, setShowFluidInput] = useState(false);
    const [fluidVolume, setFluidVolume] = useState('');
    const [fluidType, setFluidType] = useState<'subcutaneous' | 'iv'>('subcutaneous');

    const totalFluidVolume = todayFluids.reduce((sum, f) => sum + (f.volume || 0), 0);

    const handleAdd = () => {
        const volume = parseInt(fluidVolume, 10);
        if (volume && volume > 0) {
            onAddFluid(fluidType, volume);
            setFluidVolume('');
            setShowFluidInput(false);
        }
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>수액</Text>
                {totalFluidVolume > 0 && (
                    <Text style={styles.totalBadge}>오늘 {totalFluidVolume}ml</Text>
                )}
            </View>

            {todayFluids.length > 0 && (
                <View style={styles.fluidList}>
                    {todayFluids.map((record) => (
                        <View key={record.id} style={styles.fluidItem}>
                            <View style={styles.fluidItemContent}>
                                <Feather name="activity" size={14} color={COLORS.primary} style={styles.fluidIcon} />
                                <Text style={styles.fluidText}>
                                    {record.fluidType === 'subcutaneous' ? '피하수액' : '정맥수액'} {record.volume}ml
                                </Text>
                            </View>
                            <Pressable
                                style={styles.deleteButton}
                                onPress={() => onDeleteFluid(record.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            >
                                <Feather name="minus-circle" size={18} color={COLORS.textSecondary} style={styles.deleteIcon} />
                            </Pressable>
                        </View>
                    ))}
                </View>
            )}

            {showFluidInput ? (
                <View style={styles.fluidInputRow}>
                    <TextInput
                        style={styles.fluidInput}
                        placeholder="ml"
                        keyboardType="numeric"
                        value={fluidVolume}
                        onChangeText={setFluidVolume}
                    />
                    <Pressable style={styles.fluidAddBtn} onPress={handleAdd}>
                        <Text style={styles.fluidAddBtnText}>추가</Text>
                    </Pressable>
                    <Pressable style={styles.fluidCancelBtn} onPress={() => setShowFluidInput(false)}>
                        <Text style={styles.fluidCancelBtnText}>취소</Text>
                    </Pressable>
                </View>
            ) : (
                <Pressable style={styles.addRecordBtn} onPress={() => setShowFluidInput(true)}>
                    <Text style={styles.addRecordBtnText}>+ 수액 기록 추가</Text>
                </Pressable>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    totalBadge: {
        fontSize: 13,
        color: COLORS.primary,
        fontWeight: '600',
    },
    fluidList: {
        marginBottom: 12,
    },
    fluidItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    fluidItemContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    fluidIcon: {
        marginRight: 6,
    },
    fluidText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    deleteButton: {
        padding: 4,
    },
    deleteIcon: {
        opacity: 0.5,
    },
    fluidInputRow: {
        flexDirection: 'row',
        gap: 8,
    },
    fluidInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
    },
    fluidAddBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 16,
        borderRadius: 8,
        justifyContent: 'center',
    },
    fluidAddBtnText: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    fluidCancelBtn: {
        paddingHorizontal: 12,
        justifyContent: 'center',
    },
    fluidCancelBtnText: {
        color: COLORS.textSecondary,
    },
    addRecordBtn: {
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    addRecordBtnText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
});

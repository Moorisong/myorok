import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { FluidRecord } from '../services';

interface FluidInputSectionProps {
    todayFluids: FluidRecord[];
    onAddFluid: (type: string, volume: number) => void;
    onDeleteFluid: (id: string) => void;
    title?: string;
    isForceMode?: boolean;
}

export default function FluidInputSection({
    todayFluids,
    onAddFluid,
    onDeleteFluid,
    title = '수액',
    isForceMode = false,
}: FluidInputSectionProps) {
    const [showFluidInput, setShowFluidInput] = useState(false);
    const [fluidVolume, setFluidVolume] = useState('');
    const [fluidType, setFluidType] = useState<string>(isForceMode ? 'force' : 'subcutaneous');

    const totalFluidVolume = todayFluids.reduce((sum, f) => sum + (f.volume || 0), 0);

    const handleAdd = () => {
        const volume = parseInt(fluidVolume, 10);
        if (volume && volume > 0) {
            onAddFluid(isForceMode ? 'force' : fluidType, volume);
            setFluidVolume('');
            setShowFluidInput(false);
        }
    };

    return (
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{title}</Text>
                {totalFluidVolume > 0 && (
                    <Text style={styles.totalBadge}>오늘 {totalFluidVolume}ml</Text>
                )}
            </View>

            {todayFluids.length > 0 && (
                <View style={styles.fluidList}>
                    {todayFluids.map((record, index) => (
                        <View
                            key={record.id}
                            style={[
                                styles.fluidItem,
                                index === todayFluids.length - 1 && styles.fluidItemLast
                            ]}
                        >
                            <View style={styles.fluidItemContent}>
                                <Feather name="activity" size={14} color={COLORS.primary} style={styles.fluidIcon} />
                                <Text style={styles.fluidText}>
                                    {record.fluidType === 'force'
                                        ? '강제 급수'
                                        : (record.fluidType === 'subcutaneous' ? '피하수액' : '정맥수액')} {record.volume}ml
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
                    {/* 일반 수액 모드일 때만 라디오 버튼 등 타입 선택 UI가 필요할 수 있으나, 
                        현재 디자인에서는 타입 선택이 없고 subcutaneous가 기본값인지 확인 필요.
                        기존 코드에 타입 선택 UI가 없었으므로 여기도 생략. 
                        만약 타입 선택이 필요하다면 여기에 추가.
                    */}
                    {!isForceMode && (
                        <View style={styles.typeSelector}>
                            {/* 타입 선택 UI가 필요하다면 구현. 현재는 생략 (기본 subcutaneous) */}
                        </View>
                    )}

                    <TextInput
                        style={styles.fluidInput}
                        placeholder="ml"
                        keyboardType="numeric"
                        value={fluidVolume}
                        onChangeText={setFluidVolume}
                        autoFocus
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
                    <Text style={styles.addRecordBtnText}>+ {title} 기록 추가</Text>
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
    fluidItemLast: {
        borderBottomWidth: 0,
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
        alignItems: 'center',
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
        paddingVertical: 12,
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
    typeSelector: {
        // 타입 선택 UI 스타일
    }
});

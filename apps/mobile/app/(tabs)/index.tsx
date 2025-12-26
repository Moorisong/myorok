import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';

import { COLORS } from '../../constants';
import {
    getTodayRecord,
    updateDailyRecord,
    getSupplements,
    getTodaySupplementStatus,
    toggleSupplementTaken,
    getTodayFluidRecords,
    addFluidRecord,
    Supplement,
    FluidRecord,
} from '../../services';

type VomitColor = '투명' | '흰색' | '사료토' | '노란색' | '갈색' | '혈색';

const VOMIT_COLORS: VomitColor[] = ['투명', '흰색', '사료토', '노란색', '갈색', '혈색'];

export default function TodayScreen() {
    // Daily counts
    const [peeCount, setPeeCount] = useState(0);
    const [poopCount, setPoopCount] = useState(0);
    const [diarrheaCount, setDiarrheaCount] = useState(0);
    const [vomitCount, setVomitCount] = useState(0);
    const [vomitColors, setVomitColors] = useState<VomitColor[]>([]);
    const [memo, setMemo] = useState('');
    const [showVomitColors, setShowVomitColors] = useState(false);

    // Supplements
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [takenStatus, setTakenStatus] = useState<Map<string, boolean>>(new Map());

    // Fluids
    const [todayFluids, setTodayFluids] = useState<FluidRecord[]>([]);
    const [showFluidInput, setShowFluidInput] = useState(false);
    const [fluidVolume, setFluidVolume] = useState('');

    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
        }, [])
    );

    const loadAllData = async () => {
        try {
            // Load daily record
            const todayRecord = await getTodayRecord();
            setPeeCount(todayRecord.peeCount);
            setPoopCount(todayRecord.poopCount);
            setDiarrheaCount(todayRecord.diarrheaCount);
            setVomitCount(todayRecord.vomitCount);
            setMemo(todayRecord.memo || '');
            if (todayRecord.vomitTypes) {
                try { setVomitColors(JSON.parse(todayRecord.vomitTypes)); } catch { setVomitColors([]); }
            }

            // Load supplements
            const [suppList, status] = await Promise.all([
                getSupplements(),
                getTodaySupplementStatus(),
            ]);
            setSupplements(suppList);
            setTakenStatus(status);

            // Load fluids
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Count handlers
    const handlePeeAdd = async () => {
        const newCount = peeCount + 1;
        setPeeCount(newCount);
        await updateDailyRecord({ peeCount: newCount });
    };

    const handlePoopAdd = async () => {
        const newCount = poopCount + 1;
        setPoopCount(newCount);
        await updateDailyRecord({ poopCount: newCount });
    };

    const handleDiarrheaAdd = async () => {
        const newCount = diarrheaCount + 1;
        setDiarrheaCount(newCount);
        await updateDailyRecord({ diarrheaCount: newCount });
    };

    const handleVomitAdd = () => {
        setShowVomitColors(true);
    };

    const handleVomitColorSelect = async (color: VomitColor) => {
        const newColors = [...vomitColors, color];
        const newCount = vomitCount + 1;
        setVomitColors(newColors);
        setVomitCount(newCount);
        setShowVomitColors(false);
        await updateDailyRecord({
            vomitCount: newCount,
            vomitTypes: JSON.stringify(newColors),
        });
    };

    // Supplement handler
    const handleSupplementToggle = async (supplementId: string) => {
        try {
            const newState = await toggleSupplementTaken(supplementId);
            setTakenStatus(prev => {
                const newMap = new Map(prev);
                newMap.set(supplementId, newState);
                return newMap;
            });
        } catch (error) {
            Alert.alert('오류', '상태 변경 중 문제가 발생했습니다.');
        }
    };

    // Fluid handler  
    const handleFluidAdd = async () => {
        if (!fluidVolume.trim()) {
            Alert.alert('알림', '수액량을 입력해주세요.');
            return;
        }
        try {
            await addFluidRecord('subcutaneous', parseInt(fluidVolume, 10));
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
            setFluidVolume('');
            setShowFluidInput(false);
        } catch (error) {
            Alert.alert('오류', '수액 기록 중 문제가 발생했습니다.');
        }
    };

    const totalFluidVolume = todayFluids.reduce((sum, f) => sum + (f.volume || 0), 0);

    // Memo save
    const handleMemoSave = async () => {
        try {
            await updateDailyRecord({ memo: memo || null });
            Alert.alert('저장 완료', '메모가 저장되었습니다.');
        } catch (error) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    const today = new Date();
    const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>로딩 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={styles.dateText}>{dateString}</Text>
                    <Text style={styles.dayText}>{dayNames[today.getDay()]}요일</Text>
                </View>

                {/* 배변/배뇨 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>배변 / 배뇨</Text>

                    <View style={styles.counterGrid}>
                        <CounterButton emoji="💧" label="소변" count={peeCount} onPress={handlePeeAdd} />
                        <CounterButton emoji="💩" label="배변" count={poopCount} onPress={handlePoopAdd} />
                        <CounterButton emoji="🚨" label="묽은 변" count={diarrheaCount} onPress={handleDiarrheaAdd} warning />
                        <CounterButton emoji="🤮" label="구토" count={vomitCount} onPress={handleVomitAdd} warning />
                    </View>

                    {showVomitColors && (
                        <View style={styles.colorSelector}>
                            <Text style={styles.colorTitle}>구토 색상 선택</Text>
                            <View style={styles.colorOptions}>
                                {VOMIT_COLORS.map(color => (
                                    <Pressable
                                        key={color}
                                        style={[styles.colorOption, color === '혈색' && styles.dangerOption]}
                                        onPress={() => handleVomitColorSelect(color)}
                                    >
                                        <Text style={[styles.colorText, color === '혈색' && styles.dangerText]}>{color}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {vomitColors.length > 0 && (
                        <Text style={styles.vomitHistory}>기록된 색상: {vomitColors.join(', ')}</Text>
                    )}
                </View>

                {/* 수액 섹션 */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>💧 수액</Text>
                        {totalFluidVolume > 0 && (
                            <Text style={styles.totalBadge}>오늘 {totalFluidVolume}ml</Text>
                        )}
                    </View>

                    {showFluidInput ? (
                        <View style={styles.fluidInputRow}>
                            <TextInput
                                style={styles.fluidInput}
                                placeholder="ml"
                                keyboardType="numeric"
                                value={fluidVolume}
                                onChangeText={setFluidVolume}
                            />
                            <Pressable style={styles.fluidAddBtn} onPress={handleFluidAdd}>
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

                {/* 약/영양제 섹션 */}
                {supplements.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>💊 약 / 영양제</Text>
                        {supplements.map(supp => (
                            <Pressable
                                key={supp.id}
                                style={styles.checkItem}
                                onPress={() => handleSupplementToggle(supp.id)}
                            >
                                <View style={[styles.checkbox, takenStatus.get(supp.id) && styles.checkboxChecked]}>
                                    {takenStatus.get(supp.id) && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={styles.checkLabel}>{supp.name}</Text>
                            </Pressable>
                        ))}
                    </View>
                )}

                {/* 메모 섹션 */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>📝 특이사항</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="오늘의 특이사항을 기록하세요"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                    />
                    <Pressable style={styles.memoSaveBtn} onPress={handleMemoSave}>
                        <Text style={styles.memoSaveBtnText}>메모 저장</Text>
                    </Pressable>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

// Counter Button Component
function CounterButton({ emoji, label, count, onPress, warning = false }: {
    emoji: string;
    label: string;
    count: number;
    onPress: () => void;
    warning?: boolean;
}) {
    return (
        <Pressable
            style={[styles.counterBtn, warning && styles.counterBtnWarning]}
            onPress={onPress}
        >
            <Text style={styles.counterEmoji}>{emoji}</Text>
            <Text style={styles.counterLabel}>{label}</Text>
            <Text style={styles.counterCount}>{count}회</Text>
            <Text style={styles.counterPlus}>+1</Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 8,
    },
    dateText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: 8,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
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
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    totalBadge: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    counterGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    counterBtn: {
        width: '48%',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    counterBtnWarning: {
        backgroundColor: '#FFF8E1',
    },
    counterEmoji: {
        fontSize: 28,
    },
    counterLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    counterCount: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginTop: 4,
    },
    counterPlus: {
        fontSize: 12,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 4,
    },
    colorSelector: {
        marginTop: 12,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 12,
    },
    colorTitle: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    colorOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorOption: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dangerOption: {
        borderColor: COLORS.error,
        backgroundColor: '#FFF5F5',
    },
    colorText: {
        fontSize: 13,
        color: COLORS.textPrimary,
    },
    dangerText: {
        color: COLORS.error,
    },
    vomitHistory: {
        marginTop: 10,
        fontSize: 13,
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
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    checkLabel: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    memoInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 14,
        fontSize: 15,
        color: COLORS.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    memoSaveBtn: {
        marginTop: 10,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    memoSaveBtnText: {
        color: COLORS.surface,
        fontSize: 15,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 32,
    },
});

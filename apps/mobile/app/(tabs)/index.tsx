import React, { useState, useCallback, useRef, useEffect } from 'react';
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
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { COLORS } from '../../constants';
import { Toast, NumberEditModal } from '../../components';
import {
    getTodayRecord,
    updateDailyRecord,
    getSupplements,
    getTodaySupplementStatus,
    toggleSupplementTaken,
    getTodayFluidRecords,
    addFluidRecord,
    deleteFluidRecord,
    getDatabase,
    Supplement,
    FluidRecord,
} from '../../services';

type VomitColor = '투명' | '흰색' | '사료토' | '노란색' | '갈색' | '혈색';
type ActionType = 'pee' | 'poop' | 'diarrhea' | 'vomit' | 'fluid';

interface LastAction {
    type: ActionType;
    fluidRecordId?: number; // 수액 기록 ID (Undo 시 삭제용)
}

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

    // UI States
    const [loading, setLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [lastAction, setLastAction] = useState<LastAction | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Edit Modal States
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<ActionType | null>(null);

    useFocusEffect(
        useCallback(() => {
            loadAllData();
            return () => {
                if (timerRef.current) clearTimeout(timerRef.current);
                setToastVisible(false);
            };
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

    // Toast Helper
    const showToast = (message: string, action: LastAction) => {
        if (timerRef.current) clearTimeout(timerRef.current);
        setToastMessage(message);
        setLastAction(action);
        setToastVisible(true);
        timerRef.current = setTimeout(() => setToastVisible(false), 3000);
    };

    // Undo Handler
    const handleUndo = async () => {
        setToastVisible(false);
        if (!lastAction) return;

        try {
            switch (lastAction.type) {
                case 'pee':
                    const newPee = Math.max(0, peeCount - 1);
                    setPeeCount(newPee);
                    await updateDailyRecord({ peeCount: newPee });
                    break;
                case 'poop':
                    const newPoop = Math.max(0, poopCount - 1);
                    setPoopCount(newPoop);
                    await updateDailyRecord({ poopCount: newPoop });
                    break;
                case 'diarrhea':
                    const newDiarrhea = Math.max(0, diarrheaCount - 1);
                    setDiarrheaCount(newDiarrhea);
                    await updateDailyRecord({ diarrheaCount: newDiarrhea });
                    break;
                case 'vomit':
                    const newVomit = Math.max(0, vomitCount - 1);
                    setVomitCount(newVomit);
                    // Remove last color if exists
                    const newColors = [...vomitColors];
                    if (newColors.length > 0) newColors.pop(); // Simple logic: remove last added
                    setVomitColors(newColors);
                    await updateDailyRecord({
                        vomitCount: newVomit,
                        vomitTypes: JSON.stringify(newColors)
                    });
                    break;
                case 'fluid':
                    if (lastAction.fluidRecordId) {
                        const db = await getDatabase();
                        await db.runAsync('DELETE FROM fluid_records WHERE id = ?', [lastAction.fluidRecordId]);
                        const fluids = await getTodayFluidRecords();
                        setTodayFluids(fluids);
                    }
                    break;
            }
        } catch (error) {
            Alert.alert('오류', '실행 취소 중 문제가 발생했습니다.');
        }
    };

    // Count handlers
    const handlePeeAdd = async () => {
        const newCount = peeCount + 1;
        setPeeCount(newCount);
        await updateDailyRecord({ peeCount: newCount });
        showToast('소변 기록 완료. 실행 취소?', { type: 'pee' });
    };

    const handlePoopAdd = async () => {
        const newCount = poopCount + 1;
        setPoopCount(newCount);
        await updateDailyRecord({ poopCount: newCount });
        showToast('배변 기록 완료. 실행 취소?', { type: 'poop' });
    };

    const handleDiarrheaAdd = async () => {
        const newCount = diarrheaCount + 1;
        setDiarrheaCount(newCount);
        await updateDailyRecord({ diarrheaCount: newCount });
        showToast('묽은 변 기록 완료. 실행 취소?', { type: 'diarrhea' });
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
        showToast('구토 기록 완료. 실행 취소?', { type: 'vomit' });
    };

    // Edit Handlers
    const openEditModal = (target: ActionType) => {
        setEditTarget(target);
        setEditModalVisible(true);
    };

    const handleEditSave = async (newValue: number) => {
        setEditModalVisible(false);
        if (!editTarget) return;

        try {
            switch (editTarget) {
                case 'pee':
                    setPeeCount(newValue);
                    await updateDailyRecord({ peeCount: newValue });
                    break;
                case 'poop':
                    setPoopCount(newValue);
                    await updateDailyRecord({ poopCount: newValue });
                    break;
                case 'diarrhea':
                    setDiarrheaCount(newValue);
                    await updateDailyRecord({ diarrheaCount: newValue });
                    break;
                case 'vomit':
                    setVomitCount(newValue);
                    if (newValue === 0) {
                        setVomitColors([]);
                        await updateDailyRecord({
                            vomitCount: 0,
                            vomitTypes: JSON.stringify([])
                        });
                    } else {
                        await updateDailyRecord({ vomitCount: newValue });
                    }
                    break;
            }
        } catch (error) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    const handleFluidDelete = async (id: string) => {
        try {
            await deleteFluidRecord(id);
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
            showToast('수액 기록이 삭제되었습니다.', { type: 'fluid', fluidRecordId: undefined });
            setToastVisible(false); // Hide existing toast if any
        } catch (error) {
            Alert.alert('오류', '삭제 중 문제가 발생했습니다.');
        }
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
            const volume = parseInt(fluidVolume, 10);
            if (isNaN(volume)) {
                Alert.alert('알림', '올바른 숫자를 입력해주세요.');
                return;
            }
            const record = await addFluidRecord('subcutaneous', volume);
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
            setFluidVolume('');
            setShowFluidInput(false);
            showToast('수액 기록 완료. 실행 취소?', { type: 'fluid', fluidRecordId: record.id });
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

    const getEditInitialValue = () => {
        switch (editTarget) {
            case 'pee': return peeCount;
            case 'poop': return poopCount;
            case 'diarrhea': return diarrheaCount;
            case 'vomit': return vomitCount;
            default: return 0;
        }
    };

    const getEditTitle = () => {
        switch (editTarget) {
            case 'pee': return '소변 횟수 수정';
            case 'poop': return '배변 횟수 수정';
            case 'diarrhea': return '묽은 변 횟수 수정';
            case 'vomit': return '구토 횟수 수정';
            default: return '';
        }
    };

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
                        <CounterButton
                            emoji="💧"
                            label="소변"
                            count={peeCount}
                            onPressAdd={handlePeeAdd}
                            onPressCount={() => openEditModal('pee')}
                        />
                        <CounterButton
                            emoji="💩"
                            label="배변"
                            count={poopCount}
                            onPressAdd={handlePoopAdd}
                            onPressCount={() => openEditModal('poop')}
                        />
                        <CounterButton
                            emoji="🚨"
                            label="묽은 변"
                            count={diarrheaCount}
                            onPressAdd={handleDiarrheaAdd}
                            onPressCount={() => openEditModal('diarrhea')}
                            warning
                        />
                        <CounterButton
                            emoji="🤮"
                            label="구토"
                            count={vomitCount}
                            onPressAdd={handleVomitAdd}
                            onPressCount={() => openEditModal('vomit')}
                            warning
                        />
                    </View>

                    {showVomitColors && (
                        <View style={styles.colorSelector}>
                            <Text style={styles.colorTitle}>구토 색상 선택</Text>
                            <View style={styles.colorOptions}>
                                {VOMIT_COLORS.map(color => (
                                    <Pressable
                                        key={color}
                                        style={styles.colorOption}
                                        onPress={() => handleVomitColorSelect(color)}
                                    >
                                        <Text style={styles.colorText}>{color}</Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {vomitColors.length > 0 && (
                        <Text style={styles.vomitHistory}>기록된 구토 색상: {vomitColors.join(', ')}</Text>
                    )}
                </View>

                {/* 수액 섹션 */}
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
                                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                                        <Feather name="activity" size={14} color={COLORS.primary} style={{ marginRight: 6 }} />
                                        <Text style={styles.fluidText}>
                                            {record.fluidType === 'subcutaneous' ? '피하수액' : '정맥수액'} {record.volume}ml
                                        </Text>
                                    </View>
                                    <Pressable
                                        style={styles.deleteButton}
                                        onPress={() => handleFluidDelete(record.id)}
                                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                                    >
                                        <Feather name="minus-circle" size={18} color={COLORS.textSecondary} style={{ opacity: 0.5 }} />
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
                        <Text style={styles.sectionTitle}>약 / 영양제</Text>
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
                    <Text style={styles.sectionTitle}>특이사항</Text>
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

            {/* Toast Alert */}
            <Toast
                visible={toastVisible}
                message={toastMessage}
                onUndo={handleUndo}
            />

            {/* Number Edit Modal */}
            <NumberEditModal
                visible={editModalVisible}
                title={getEditTitle()}
                initialValue={getEditInitialValue()}
                onSave={handleEditSave}
                onCancel={() => setEditModalVisible(false)}
            />
        </SafeAreaView>
    );
}

// Counter Button Component
function CounterButton({ emoji, label, count, onPressAdd, onPressCount, warning = false }: {
    emoji: React.ReactNode;
    label: string;
    count: number;
    onPressAdd: () => void;
    onPressCount: () => void;
    warning?: boolean;
}) {
    return (
        <View style={[styles.counterBtn, warning && styles.counterBtnWarning]}>
            {/* Edit Area (Top) */}
            <Pressable
                style={({ pressed }) => [
                    styles.counterContent,
                    pressed && { backgroundColor: 'rgba(0,0,0,0.02)' }
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
                    pressed && { opacity: 0.8 }
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
        paddingHorizontal: 24,
        paddingTop: 24,
        paddingBottom: 14,
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
        marginBottom: 12,
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
        backgroundColor: COLORS.surface,
        borderRadius: 16, // 모서리 더 둥글게
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        marginBottom: 10,
    },
    counterContent: {
        padding: 12, // 16 -> 12
        paddingTop: 16, // 24 -> 16
        alignItems: 'center',
        width: '100%',
        backgroundColor: '#FAFAFA',
    },
    editIconContainer: {
        position: 'absolute',
        top: 6, // 8 -> 6
        right: 6, // 8 -> 6
    },
    plusButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 10, // 14 -> 10
        alignItems: 'center',
        width: '100%',
    },
    counterBtnWarning: {
        backgroundColor: '#FFF8E1',
    },
    counterEmoji: {
        fontSize: 24, // 32 -> 24
        marginBottom: 2, // 4 -> 2
    },
    counterLabel: {
        fontSize: 12, // 14 -> 12
        color: COLORS.textSecondary,
        marginBottom: 0, // 2 -> 0
    },
    counterCount: {
        fontSize: 20, // 24 -> 20
        fontWeight: '800',
        color: COLORS.textPrimary,
    },
    counterPlusWhite: {
        fontSize: 14, // 16 -> 14
        color: '#FFFFFF',
        fontWeight: '800',
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
    fluidList: {
        marginBottom: 12,
    },
    fluidItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    fluidText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    deleteButton: {
        padding: 4,
        marginLeft: 8,
    },
    bottomPadding: {
        height: 80, // Toast 공간 확보를 위해 늘림
    },
});

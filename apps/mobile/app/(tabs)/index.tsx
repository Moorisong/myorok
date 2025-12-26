import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';

import { COLORS } from '../../constants';
import { Toast, NumberEditModal, CounterButton, SupplementChecklist, FluidInputSection } from '../../components';
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
    addSupplement,
    Supplement,
    FluidRecord,
} from '../../services';

type VomitColor = '투명' | '흰색' | '사료토' | '노란색' | '갈색' | '혈색';
type ActionType = 'pee' | 'poop' | 'diarrhea' | 'vomit' | 'fluid' | 'water' | 'force';

interface LastAction {
    type: ActionType;
    fluidRecordId?: string;
    value?: number;
}

const VOMIT_COLORS: VomitColor[] = ['투명', '흰색', '사료토', '노란색', '갈색', '혈색'];

export default function TodayScreen() {
    // Daily counts
    const [peeCount, setPeeCount] = useState(0);
    const [poopCount, setPoopCount] = useState(0);
    const [diarrheaCount, setDiarrheaCount] = useState(0);
    const [vomitCount, setVomitCount] = useState(0);
    const [vomitColors, setVomitColors] = useState<VomitColor[]>([]);
    const [waterIntake, setWaterIntake] = useState(0);
    const [memo, setMemo] = useState('');
    const [showVomitColors, setShowVomitColors] = useState(false);

    // Supplements
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [takenStatus, setTakenStatus] = useState<Map<string, boolean>>(new Map());

    // Fluids
    const [todayFluids, setTodayFluids] = useState<FluidRecord[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [toastVisible, setToastVisible] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [lastAction, setLastAction] = useState<LastAction | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Edit Modal States
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [editTarget, setEditTarget] = useState<ActionType | null>(null);
    const [isAddMode, setIsAddMode] = useState(false);

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
            setWaterIntake(todayRecord.waterIntake || 0);

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
            // Error handled silently
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

                case 'force':
                    if (lastAction.fluidRecordId) {
                        const db = await getDatabase();
                        await db.runAsync('DELETE FROM fluid_records WHERE id = ?', [lastAction.fluidRecordId]);
                        const fluids = await getTodayFluidRecords();
                        setTodayFluids(fluids);
                    }
                    break;
                case 'fluid':
                    if (lastAction.fluidRecordId) {
                        const db = await getDatabase();
                        await db.runAsync('DELETE FROM fluid_records WHERE id = ?', [lastAction.fluidRecordId]);
                        const fluids = await getTodayFluidRecords();
                        setTodayFluids(fluids);
                    }
                    break;
                case 'water':
                    if (lastAction.value) {
                        const newWater = Math.max(0, waterIntake - lastAction.value);
                        setWaterIntake(newWater);
                        await updateDailyRecord({ waterIntake: newWater });
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
    };

    // Edit Handlers
    const openEditModal = (target: ActionType, isAdd: boolean = false) => {
        setEditTarget(target);
        setIsAddMode(isAdd);
        setEditModalVisible(true);
    };

    const handleWaterAdd = () => {
        openEditModal('water', true);
    };

    const handleWaterEdit = () => {
        openEditModal('water', false);
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
                case 'water':
                    let finalWater = newValue;
                    if (isAddMode) {
                        finalWater = waterIntake + newValue;
                    }
                    setWaterIntake(finalWater);
                    await updateDailyRecord({ waterIntake: finalWater });
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

    const handleSupplementAdd = async (name: string, type: 'medicine' | 'supplement') => {
        try {
            await addSupplement(name, type);
            // Refresh list
            const suppList = await getSupplements();
            setSupplements(suppList);

            // Status update for today (new item will be not taken)
            const status = await getTodaySupplementStatus();
            setTakenStatus(status);
        } catch (error) {
            Alert.alert('오류', '추가 중 문제가 발생했습니다.');
        }
    };

    // Fluid handler  
    const handleFluidAdd = async (type: string, volume: number) => {
        try {
            const record = await addFluidRecord(type, volume);
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
        } catch (error) {
            Alert.alert('오류', '기록 중 문제가 발생했습니다.');
        }
    };




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
            case 'water': return isAddMode ? 0 : waterIntake;
            default: return 0;
        }
    };

    const getEditTitle = () => {
        switch (editTarget) {
            case 'pee': return '소변 횟수 수정';
            case 'poop': return '배변 횟수 수정';
            case 'diarrhea': return '묽은 변 횟수 수정';
            case 'vomit': return '구토 횟수 수정';
            case 'water': return isAddMode ? '강수량 추가 (ml)' : '강수량 수정 (ml)';
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
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={0}
            >
                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
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

                    {/* 강수량 섹션 */}

                    {/* 강수량 섹션 (구현 변경: 수액과 동일 UI 사용) */}
                    <FluidInputSection
                        title="강수 (강제 급수)"
                        todayFluids={todayFluids.filter(f => f.fluidType === 'force')}
                        onAddFluid={handleFluidAdd}
                        onDeleteFluid={handleFluidDelete}
                        isForceMode={true}
                    />

                    {/* 수액 섹션 */}
                    <FluidInputSection
                        todayFluids={todayFluids.filter(f => f.fluidType !== 'force')}
                        onAddFluid={handleFluidAdd}
                        onDeleteFluid={handleFluidDelete}
                    />

                    {/* 약/영양제 섹션 */}
                    <SupplementChecklist
                        supplements={supplements}
                        takenStatus={takenStatus}
                        onToggle={handleSupplementToggle}
                        onAdd={handleSupplementAdd}
                    />


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
            </KeyboardAvoidingView>

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
    waterControls: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 6,
    },
    waterValueBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        flex: 1,
    },
    waterValueText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    waterAddBtn: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        margin: 4,
    },
    waterAddBtnText: {
        color: COLORS.surface,
        fontWeight: '600',
        marginLeft: 4,
        fontSize: 14,
    },
    bottomPadding: {
        height: 80, // Toast 공간 확보를 위해 늘림
    },
});

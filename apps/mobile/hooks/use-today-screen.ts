import { useState, useCallback, useRef } from 'react';
import { useFocusEffect } from 'expo-router';
import type { VomitColor } from '../constants';
import {
    ALERT_TITLES,
    ERROR_MESSAGES,
    SUCCESS_MESSAGES,
    TOAST_MESSAGES,
    CONFIG,
} from '../constants';
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
    deleteSupplement,
    type Supplement,
    type FluidRecord,
} from '../services';
import { useToast as useGlobalToast } from '../components/ToastContext';
import { useSelectedPet } from './use-selected-pet';

type ActionType = 'pee' | 'poop' | 'diarrhea' | 'vomit' | 'fluid' | 'water' | 'force';

interface LastAction {
    type: ActionType;
    fluidRecordId?: string;
    value?: number;
}

export function useTodayScreen() {
    const { selectedPetId } = useSelectedPet();
    const { showToast: showGlobalToast } = useGlobalToast();

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
        }, [selectedPetId])
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
        timerRef.current = setTimeout(() => setToastVisible(false), CONFIG.TOAST_DURATION);
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
                case 'water':
                    if (lastAction.value) {
                        const newWater = Math.max(0, waterIntake - lastAction.value);
                        setWaterIntake(newWater);
                        await updateDailyRecord({ waterIntake: newWater });
                    }
                    break;
            }
        } catch (error) {
            showGlobalToast(ERROR_MESSAGES.UNDO_FAILED, { variant: 'error' });
        }
    };

    // Count handlers
    const handlePeeAdd = async () => {
        const newCount = peeCount + 1;
        setPeeCount(newCount);
        await updateDailyRecord({ peeCount: newCount });
        showToast(TOAST_MESSAGES.PEE_RECORDED, { type: 'pee' });
    };

    const handlePoopAdd = async () => {
        const newCount = poopCount + 1;
        setPoopCount(newCount);
        await updateDailyRecord({ poopCount: newCount });
        showToast(TOAST_MESSAGES.POOP_RECORDED, { type: 'poop' });
    };

    const handleDiarrheaAdd = async () => {
        const newCount = diarrheaCount + 1;
        setDiarrheaCount(newCount);
        await updateDailyRecord({ diarrheaCount: newCount });
        showToast(TOAST_MESSAGES.DIARRHEA_RECORDED, { type: 'diarrhea' });
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

    const handleEditSave = async (newValue: number, selectedColors?: string[]) => {
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
                        // 선택된 색상이 있으면 사용, 없으면 기존 색상 유지 (또는 비우기)
                        const finalColors = (selectedColors as VomitColor[] | undefined) || vomitColors.slice(0, newValue);
                        setVomitColors(finalColors as VomitColor[]);
                        await updateDailyRecord({
                            vomitCount: newValue,
                            vomitTypes: JSON.stringify(finalColors)
                        });
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
            showGlobalToast(ERROR_MESSAGES.SAVE_FAILED, { variant: 'error' });
        }
    };

    const handleFluidDelete = async (id: string) => {
        try {
            await deleteFluidRecord(id);
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
            setToastVisible(false); // Hide existing toast if any
        } catch (error) {
            showGlobalToast(ERROR_MESSAGES.DELETE_FAILED, { variant: 'error' });
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
            showGlobalToast(ERROR_MESSAGES.STATUS_CHANGE_FAILED, { variant: 'error' });
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
            showGlobalToast(ERROR_MESSAGES.ADD_FAILED, { variant: 'error' });
        }
    };

    const handleSupplementDelete = async (supplementId: string, deleteRecords: boolean) => {
        try {
            await deleteSupplement(supplementId);
            // Refresh list
            const suppList = await getSupplements();
            setSupplements(suppList);

            // Remove from takenStatus only if we deleted the records
            if (deleteRecords) {
                setTakenStatus(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(supplementId);
                    return newMap;
                });
            }
        } catch (error) {
            showGlobalToast(ERROR_MESSAGES.DELETE_FAILED, { variant: 'error' });
        }
    };

    // Fluid handler  
    const handleFluidAdd = async (type: string, volume: number) => {
        try {
            await addFluidRecord(type, volume);
            const fluids = await getTodayFluidRecords();
            setTodayFluids(fluids);
        } catch (error) {
            showGlobalToast(ERROR_MESSAGES.RECORD_FAILED, { variant: 'error' });
        }
    };

    // Memo save
    const handleMemoSave = async () => {
        try {
            await updateDailyRecord({ memo: memo || null });
            showGlobalToast(SUCCESS_MESSAGES.SAVED);
        } catch (error) {
            showGlobalToast(ERROR_MESSAGES.SAVE_FAILED, { variant: 'error' });
        }
    };

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

    return {
        // States
        peeCount,
        poopCount,
        diarrheaCount,
        vomitCount,
        vomitColors,
        waterIntake,
        memo,
        showVomitColors,
        supplements,
        takenStatus,
        todayFluids,
        loading,
        toastVisible,
        toastMessage,
        editModalVisible,
        editTarget,
        isAddMode,

        // Handlers
        handlePeeAdd,
        handlePoopAdd,
        handleDiarrheaAdd,
        handleVomitAdd,
        handleVomitColorSelect,
        handleWaterAdd,
        handleWaterEdit,
        handleEditSave,
        handleFluidDelete,
        handleSupplementToggle,
        handleSupplementAdd,
        handleSupplementDelete,
        handleFluidAdd,
        handleMemoSave,
        handleUndo,
        openEditModal,

        // Helpers
        getEditInitialValue,
        getEditTitle,

        // Setters
        setMemo,
        setEditModalVisible,
        setShowVomitColors,
    };
}

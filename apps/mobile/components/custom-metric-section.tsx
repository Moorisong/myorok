import { useState, useEffect } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Card from './card';
import { COLORS, ALERT_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '../constants';
import {
    CustomMetric,
    addCustomMetric,
    addMetricRecord,
    getCustomMetrics,
    deleteCustomMetric,
    getMetricRecordByDate,
    updateMetricRecord
} from '../services/customMetrics';
import { getTodayDateString } from '../services/database';
import { useToast } from './ToastContext';

export default function CustomMetricInputSection() {
    const { showToast } = useToast();
    const [metrics, setMetrics] = useState<CustomMetric[]>([]);
    const [selectedMetricId, setSelectedMetricId] = useState<string | null>(null);
    const [isCreatingNew, setIsCreatingNew] = useState(false);

    // Inputs
    const [value, setValue] = useState('');
    const [newMetricName, setNewMetricName] = useState('');
    const [newMetricUnit, setNewMetricUnit] = useState('');

    useEffect(() => {
        loadMetrics();
    }, []);

    const loadMetrics = async () => {
        try {
            const loaded = await getCustomMetrics();
            setMetrics(loaded);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAddRecord = async () => {
        if (!selectedMetricId && !isCreatingNew) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.SELECT_METRIC);
            return;
        }

        if (isCreatingNew) {
            if (!newMetricName.trim()) {
                Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_METRIC_NAME);
                return;
            }
        }

        if (!value.trim()) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_VALUE);
            return;
        }

        const numValue = parseFloat(value);
        if (isNaN(numValue)) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.INVALID_NUMBER);
            return;
        }

        try {
            let targetMetricId = selectedMetricId;

            // Create new metric if needed
            if (isCreatingNew) {
                const newMetric = await addCustomMetric(newMetricName, newMetricUnit);
                targetMetricId = newMetric.id;
                await loadMetrics(); // reload list
            }

            if (targetMetricId) {
                const todayDate = getTodayDateString();
                const existingRecord = await getMetricRecordByDate(targetMetricId, todayDate);

                if (existingRecord) {
                    Alert.alert(
                        ALERT_TITLES.ALERT,
                        '이미 오늘 기록된 값이 있습니다. 덮어쓰시겠습니까?',
                        [
                            { text: '취소', style: 'cancel' },
                            {
                                text: '덮어쓰기',
                                onPress: async () => {
                                    try {
                                        Keyboard.dismiss();
                                        await updateMetricRecord(existingRecord.id, numValue);
                                        showToast('수정되었습니다.');
                                        // Reset form
                                        setValue('');
                                        setNewMetricName('');
                                        setNewMetricUnit('');
                                        setIsCreatingNew(false);
                                        setSelectedMetricId(null);
                                    } catch (e) {
                                        Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.SAVE_FAILED);
                                    }
                                }
                            }
                        ]
                    );
                    return;
                }

                await addMetricRecord(targetMetricId, numValue);
                Alert.alert(ALERT_TITLES.COMPLETE, SUCCESS_MESSAGES.METRIC_SAVED);

                // Reset form
                setValue('');
                setNewMetricName('');
                setNewMetricUnit('');
                setIsCreatingNew(false);
                setSelectedMetricId(null);
            }
        } catch (e) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.SAVE_FAILED);
            console.error(e);
        }
    };

    const toggleCreateNew = () => {
        setIsCreatingNew(!isCreatingNew);
        setSelectedMetricId(null);
    };

    return (
        <Card style={styles.container}>
            <Text style={styles.title}>커스텀 수치 기록</Text>

            <View style={styles.selectorContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                    <Pressable
                        style={[styles.chip, isCreatingNew && styles.chipSelected]}
                        onPress={toggleCreateNew}
                    >
                        <Text style={[styles.chipText, isCreatingNew && styles.chipTextSelected]}>+ 직접 추가</Text>
                    </Pressable>

                    {metrics.map((m) => {
                        const isSelected = selectedMetricId === m.id;

                        const handleDelete = (e: any) => {
                            e.stopPropagation();
                            Alert.alert(
                                '수치 삭제',
                                `'${m.name}' 항목을 삭제하시겠습니까?\n포함된 모든 기록도 함께 삭제됩니다.`,
                                [
                                    { text: '취소', style: 'cancel' },
                                    {
                                        text: '삭제',
                                        style: 'destructive',
                                        onPress: async () => {
                                            try {
                                                await deleteCustomMetric(m.id);
                                                if (selectedMetricId === m.id) {
                                                    setSelectedMetricId(null);
                                                }
                                                loadMetrics();
                                            } catch (e) {
                                                Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.DELETE_FAILED);
                                            }
                                        }
                                    }
                                ]
                            );
                        };

                        return (
                            <Pressable
                                key={m.id}
                                style={[
                                    styles.chip,
                                    isSelected && styles.chipSelected
                                ]}
                                onPress={() => {
                                    setSelectedMetricId(m.id);
                                    setIsCreatingNew(false);
                                }}
                            >
                                <Text style={[
                                    styles.chipText,
                                    isSelected && styles.chipTextSelected
                                ]}>
                                    {m.name}{m.unit ? ` (${m.unit})` : ''}
                                </Text>

                                <Pressable
                                    style={styles.deleteIcon}
                                    onPress={handleDelete}
                                    hitSlop={8}
                                >
                                    <Feather
                                        name="minus-circle"
                                        size={14}
                                        color={isSelected ? '#FFFFFF' : COLORS.textSecondary}
                                        style={{ opacity: 0.8 }}
                                    />
                                </Pressable>
                            </Pressable>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.inputArea}>
                {isCreatingNew && (
                    <View style={styles.newMetricForm}>
                        <TextInput
                            style={[styles.input, { flex: 2 }]}
                            placeholder="수치 이름 (예: 혈당)"
                            value={newMetricName}
                            onChangeText={setNewMetricName}
                        />
                        <TextInput
                            style={[styles.input, { flex: 1 }]}
                            placeholder="단위 (선택)"
                            value={newMetricUnit}
                            onChangeText={setNewMetricUnit}
                        />
                    </View>
                )}

                <View style={styles.valueRow}>
                    <TextInput
                        style={[styles.input, styles.valueInput]}
                        placeholder="값 입력"
                        keyboardType="numeric"
                        value={value}
                        onChangeText={setValue}
                    />
                    <Pressable style={styles.addButton} onPress={handleAddRecord}>
                        <Text style={styles.addButtonText}>기록하기</Text>
                    </Pressable>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 24,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    selectorContainer: {
        marginBottom: 16,
    },
    scrollContent: {
        gap: 8,
        paddingBottom: 4, // for shadow visibility if needed
    },
    chip: {
        paddingLeft: 14,
        paddingRight: 8, // Reduced mainly because icon has its own padding/margin
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    deleteIcon: {
        padding: 2,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    chipTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    inputArea: {
        gap: 12,
    },
    newMetricForm: {
        flexDirection: 'row',
        gap: 8,
    },
    valueRow: {
        flexDirection: 'row',
        gap: 8,
    },
    input: {
        backgroundColor: COLORS.background,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12, // More rounded as per design system trend
        fontSize: 16,
        color: COLORS.textPrimary,
        borderWidth: 1,
        borderColor: 'transparent', // Prepare for focus state if needed
    },
    valueInput: {
        flex: 1,
        // Match height of button
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        height: 48, // Standard touch target
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

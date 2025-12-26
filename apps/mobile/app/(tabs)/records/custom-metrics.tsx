import { useState, useCallback } from 'react';
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

import { COLORS } from '../../../constants';
import { Button, Header } from '../../../components';
import {
    addCustomMetric,
    getCustomMetrics,
    addMetricRecord,
    getAllMetricRecords,
    CustomMetric,
    CustomMetricRecord,
    getTodayDateString
} from '../../../services';

export default function CustomMetricsScreen() {
    const [metrics, setMetrics] = useState<CustomMetric[]>([]);
    const [recentRecords, setRecentRecords] = useState<(CustomMetricRecord & { metricName: string; metricUnit: string | null })[]>([]);
    const [showAddMetric, setShowAddMetric] = useState(false);
    const [showAddRecord, setShowAddRecord] = useState(false);
    const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null);

    const [newMetricName, setNewMetricName] = useState('');
    const [newMetricUnit, setNewMetricUnit] = useState('');
    const [newValue, setNewValue] = useState('');
    const [newDate, setNewDate] = useState(getTodayDateString());
    const [newMemo, setNewMemo] = useState('');
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [metricList, records] = await Promise.all([
                getCustomMetrics(),
                getAllMetricRecords(20),
            ]);
            setMetrics(metricList);
            setRecentRecords(records);
        } catch (error) {
            // Error handled silently
        } finally {
            setLoading(false);
        }
    };

    const handleAddMetric = async () => {
        if (!newMetricName.trim()) {
            Alert.alert('알림', '항목 이름을 입력해주세요.');
            return;
        }

        try {
            const metric = await addCustomMetric(newMetricName.trim(), newMetricUnit.trim() || undefined);
            setMetrics(prev => [...prev, metric]);
            setNewMetricName('');
            setNewMetricUnit('');
            setShowAddMetric(false);
            Alert.alert('추가 완료', `${metric.name} 항목이 추가되었습니다.`);
        } catch (error) {
            Alert.alert('오류', '추가 중 문제가 발생했습니다.');
        }
    };

    const handleAddRecord = async () => {
        if (!selectedMetric) {
            Alert.alert('알림', '항목을 선택해주세요.');
            return;
        }
        if (!newValue.trim()) {
            Alert.alert('알림', '수치를 입력해주세요.');
            return;
        }

        try {
            await addMetricRecord(
                selectedMetric.id,
                parseFloat(newValue),
                newDate,
                newMemo.trim() || undefined
            );
            await loadData();
            setSelectedMetric(null);
            setNewValue('');
            setNewMemo('');
            setShowAddRecord(false);
            Alert.alert('저장 완료', '수치가 기록되었습니다.');
        } catch (error) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    const formatDate = (dateStr: string) => {
        const [, month, day] = dateStr.split('-');
        return `${month}/${day}`;
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header title="커스텀 수치" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>로딩 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="커스텀 수치" showBack />
            <ScrollView style={styles.scrollView}>
                {/* Metric List */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>수치 항목</Text>
                    {metrics.length === 0 ? (
                        <Text style={styles.emptyText}>등록된 항목이 없습니다.</Text>
                    ) : (
                        <View style={styles.metricList}>
                            {metrics.map(metric => (
                                <Pressable
                                    key={metric.id}
                                    style={[
                                        styles.metricChip,
                                        selectedMetric?.id === metric.id && styles.metricChipSelected,
                                    ]}
                                    onPress={() => {
                                        setSelectedMetric(metric);
                                        setShowAddRecord(true);
                                    }}
                                >
                                    <Text
                                        style={[
                                            styles.metricChipText,
                                            selectedMetric?.id === metric.id && styles.metricChipTextSelected,
                                        ]}
                                    >
                                        {metric.name}
                                        {metric.unit && ` (${metric.unit})`}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>
                    )}

                    {!showAddMetric && (
                        <Pressable
                            style={styles.addChipButton}
                            onPress={() => setShowAddMetric(true)}
                        >
                            <Text style={styles.addChipText}>+ 항목 추가</Text>
                        </Pressable>
                    )}
                </View>

                {/* Add Metric Form */}
                {showAddMetric && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>새 항목 추가</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="이름 (예: BUN, CREA)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newMetricName}
                            onChangeText={setNewMetricName}
                        />
                        <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            placeholder="단위 (예: mg/dL) - 선택"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newMetricUnit}
                            onChangeText={setNewMetricUnit}
                        />
                        <View style={styles.formButtons}>
                            <Button
                                title="취소"
                                variant="secondary"
                                onPress={() => setShowAddMetric(false)}
                                style={styles.formButton}
                            />
                            <Button
                                title="추가"
                                onPress={handleAddMetric}
                                style={styles.formButton}
                            />
                        </View>
                    </View>
                )}

                {/* Add Record Form */}
                {showAddRecord && selectedMetric && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>
                            {selectedMetric.name} 수치 입력
                        </Text>
                        <TextInput
                            style={styles.input}
                            placeholder={`수치${selectedMetric.unit ? ` (${selectedMetric.unit})` : ''}`}
                            placeholderTextColor={COLORS.textSecondary}
                            value={newValue}
                            onChangeText={setNewValue}
                            keyboardType="numeric"
                        />
                        <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            placeholder="날짜 (YYYY-MM-DD)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newDate}
                            onChangeText={setNewDate}
                        />
                        <TextInput
                            style={[styles.input, { marginTop: 8 }]}
                            placeholder="메모 (선택)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newMemo}
                            onChangeText={setNewMemo}
                        />
                        <View style={styles.formButtons}>
                            <Button
                                title="취소"
                                variant="secondary"
                                onPress={() => {
                                    setShowAddRecord(false);
                                    setSelectedMetric(null);
                                }}
                                style={styles.formButton}
                            />
                            <Button
                                title="저장"
                                onPress={handleAddRecord}
                                style={styles.formButton}
                            />
                        </View>
                    </View>
                )}

                {/* Recent Records */}
                {recentRecords.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>최근 기록</Text>
                        {recentRecords.map(record => (
                            <View key={record.id} style={styles.recordItem}>
                                <View style={styles.recordHeader}>
                                    <Text style={styles.recordName}>{record.metricName}</Text>
                                    <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                                </View>
                                <Text style={styles.recordValue}>
                                    {record.value}
                                    {record.metricUnit && ` ${record.metricUnit}`}
                                </Text>
                                {record.memo && (
                                    <Text style={styles.recordMemo}>{record.memo}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <View style={styles.bottomPadding} />
            </ScrollView>
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
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 16,
    },
    metricList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metricChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    metricChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    metricChipText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    metricChipTextSelected: {
        color: COLORS.surface,
    },
    addChipButton: {
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    addChipText: {
        fontSize: 14,
        color: COLORS.primary,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
    },
    formButton: {
        flex: 1,
    },
    recordItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    recordName: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    recordDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    recordValue: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    recordMemo: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bottomPadding: {
        height: 32,
    },
});

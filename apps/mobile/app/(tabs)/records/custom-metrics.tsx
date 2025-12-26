import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card, Button } from '../../../components';

interface CustomMetric {
    id: string;
    name: string;
    unit: string;
}

export default function CustomMetricsScreen() {
    const [metrics, setMetrics] = useState<CustomMetric[]>([
        { id: '1', name: 'BUN', unit: 'mg/dL' },
        { id: '2', name: 'CREA', unit: 'mg/dL' },
    ]);
    const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null);
    const [value, setValue] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMetricName, setNewMetricName] = useState('');
    const [newMetricUnit, setNewMetricUnit] = useState('');

    const handleSave = () => {
        // TODO: DB 저장
        setValue('');
        setSelectedMetric(null);
    };

    const addMetric = () => {
        if (!newMetricName.trim()) return;

        const newMetric: CustomMetric = {
            id: Date.now().toString(),
            name: newMetricName.trim(),
            unit: newMetricUnit.trim() || '',
        };
        setMetrics(prev => [...prev, newMetric]);
        setNewMetricName('');
        setNewMetricUnit('');
        setShowAddForm(false);
    };

    return (
        <View style={styles.container}>
            <Header title="커스텀 수치" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionTitle}>수치 항목</Text>
                        <Pressable onPress={() => setShowAddForm(true)}>
                            <Text style={styles.addButton}>+ 추가</Text>
                        </Pressable>
                    </View>

                    {metrics.length === 0 ? (
                        <Text style={styles.emptyText}>등록된 수치 항목이 없습니다.</Text>
                    ) : (
                        <View style={styles.metricList}>
                            {metrics.map(metric => (
                                <Pressable
                                    key={metric.id}
                                    style={[
                                        styles.metricItem,
                                        selectedMetric?.id === metric.id && styles.metricItemSelected,
                                    ]}
                                    onPress={() => setSelectedMetric(metric)}
                                >
                                    <Text style={styles.metricName}>{metric.name}</Text>
                                    {metric.unit && (
                                        <Text style={styles.metricUnit}>{metric.unit}</Text>
                                    )}
                                </Pressable>
                            ))}
                        </View>
                    )}
                </Card>

                {showAddForm && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>새 수치 추가</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="수치명 (예: BUN)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newMetricName}
                            onChangeText={setNewMetricName}
                            autoFocus
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="단위 (예: mg/dL) - 선택"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newMetricUnit}
                            onChangeText={setNewMetricUnit}
                        />
                        <View style={styles.formButtons}>
                            <Button
                                title="취소"
                                variant="secondary"
                                onPress={() => {
                                    setShowAddForm(false);
                                    setNewMetricName('');
                                    setNewMetricUnit('');
                                }}
                                style={styles.formButton}
                            />
                            <Button
                                title="추가"
                                onPress={addMetric}
                                disabled={!newMetricName.trim()}
                                style={styles.formButton}
                            />
                        </View>
                    </Card>
                )}

                {selectedMetric && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {selectedMetric.name} 값 입력
                        </Text>
                        <View style={styles.valueInputContainer}>
                            <TextInput
                                style={styles.valueInput}
                                placeholder="수치 입력"
                                placeholderTextColor={COLORS.textSecondary}
                                value={value}
                                onChangeText={setValue}
                                keyboardType="numeric"
                            />
                            {selectedMetric.unit && (
                                <Text style={styles.unitLabel}>{selectedMetric.unit}</Text>
                            )}
                        </View>
                        <Button
                            title="저장하기"
                            onPress={handleSave}
                            disabled={!value.trim()}
                            style={styles.saveButton}
                        />
                    </Card>
                )}

                <Text style={styles.hint}>
                    💡 저장된 수치는 차트 탭에서 추이 그래프로 확인할 수 있습니다.
                </Text>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    cardHeader: {
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
    addButton: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    metricList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    metricItem: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    metricItemSelected: {
        borderColor: COLORS.primary,
        backgroundColor: `${COLORS.primary}20`,
    },
    metricName: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    metricUnit: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    formButton: {
        flex: 1,
    },
    valueInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 16,
        marginBottom: 16,
    },
    valueInput: {
        flex: 1,
        paddingVertical: 16,
        fontSize: 24,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
    },
    unitLabel: {
        fontSize: 16,
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    saveButton: {
        marginTop: 8,
    },
    hint: {
        marginHorizontal: 16,
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 32,
    },
});

import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';

interface CustomMetric {
    id: string;
    name: string;
    unit: string;
}

interface DataPoint {
    date: string;
    value: number;
}

// 임시 데이터
const MOCK_METRICS: CustomMetric[] = [
    { id: '1', name: 'BUN', unit: 'mg/dL' },
    { id: '2', name: 'CREA', unit: 'mg/dL' },
];

const MOCK_DATA: Record<string, DataPoint[]> = {
    '1': [
        { date: '11/15', value: 35 },
        { date: '12/01', value: 32 },
        { date: '12/15', value: 28 },
    ],
    '2': [
        { date: '11/15', value: 2.1 },
        { date: '12/01', value: 1.9 },
        { date: '12/15', value: 1.7 },
    ],
};

export default function CustomChartScreen() {
    const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(
        MOCK_METRICS[0]
    );

    const data = selectedMetric ? MOCK_DATA[selectedMetric.id] || [] : [];
    const maxValue = data.length > 0 ? Math.max(...data.map(d => d.value)) * 1.2 : 100;

    return (
        <View style={styles.container}>
            <Header title="커스텀 수치 차트" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>수치 선택</Text>
                    <View style={styles.metricList}>
                        {MOCK_METRICS.map(metric => (
                            <Pressable
                                key={metric.id}
                                style={[
                                    styles.metricItem,
                                    selectedMetric?.id === metric.id && styles.metricItemSelected,
                                ]}
                                onPress={() => setSelectedMetric(metric)}
                            >
                                <Text
                                    style={[
                                        styles.metricName,
                                        selectedMetric?.id === metric.id && styles.metricNameSelected,
                                    ]}
                                >
                                    {metric.name}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>

                {selectedMetric && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {selectedMetric.name} 추이
                            {selectedMetric.unit && ` (${selectedMetric.unit})`}
                        </Text>

                        {data.length === 0 ? (
                            <Text style={styles.emptyText}>기록된 데이터가 없습니다.</Text>
                        ) : (
                            <>
                                {/* 간단한 라인 차트 시뮬레이션 */}
                                <View style={styles.chart}>
                                    {data.map((point, index) => (
                                        <View key={index} style={styles.pointContainer}>
                                            <View style={styles.pointWrapper}>
                                                <View
                                                    style={[
                                                        styles.pointBar,
                                                        { height: (point.value / maxValue) * 100 },
                                                    ]}
                                                />
                                                <View style={styles.point} />
                                            </View>
                                            <Text style={styles.pointValue}>{point.value}</Text>
                                            <Text style={styles.pointDate}>{point.date}</Text>
                                        </View>
                                    ))}
                                </View>

                                {/* 트렌드 표시 */}
                                {data.length >= 2 && (
                                    <View style={styles.trendBox}>
                                        {data[data.length - 1].value < data[0].value ? (
                                            <Text style={styles.trendGood}>📉 감소 추세 (좋음)</Text>
                                        ) : data[data.length - 1].value > data[0].value ? (
                                            <Text style={styles.trendBad}>📈 증가 추세 (주의)</Text>
                                        ) : (
                                            <Text style={styles.trendNeutral}>➡️ 유지 중</Text>
                                        )}
                                    </View>
                                )}
                            </>
                        )}
                    </Card>
                )}

                <Text style={styles.hint}>
                    💡 새로운 수치는 기록 탭 → 커스텀 수치에서 추가할 수 있습니다.
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
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
        backgroundColor: COLORS.primary,
    },
    metricName: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    metricNameSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 160,
        paddingTop: 20,
    },
    pointContainer: {
        alignItems: 'center',
        flex: 1,
    },
    pointWrapper: {
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    pointBar: {
        width: 3,
        backgroundColor: `${COLORS.primary}40`,
        borderRadius: 2,
    },
    point: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
        position: 'absolute',
        bottom: -6,
    },
    pointValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 12,
    },
    pointDate: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    trendBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        alignItems: 'center',
    },
    trendGood: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    trendBad: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: '600',
    },
    trendNeutral: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
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

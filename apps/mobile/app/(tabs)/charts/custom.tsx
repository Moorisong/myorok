import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';
import {
    getCustomMetrics,
    getMetricRecords,
    CustomMetric,
    CustomMetricRecord
} from '../../../services/customMetrics';
import { useSelectedPet } from '../../../hooks/use-selected-pet';

interface ChartPoint {
    date: string;
    value: number;
    originalDate: string; // for sorting if needed
}

export default function CustomChartScreen() {
    const { selectedPetId } = useSelectedPet();
    const [metrics, setMetrics] = useState<CustomMetric[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null);
    const [chartData, setChartData] = useState<ChartPoint[]>([]);

    useFocusEffect(
        useCallback(() => {
            // Reset selected metric when pet changes
            setSelectedMetric(null);
            loadMetrics();
        }, [selectedPetId])
    );

    useEffect(() => {
        if (selectedMetric) {
            loadMetricData(selectedMetric.id);
        } else {
            setChartData([]);
        }
    }, [selectedMetric]);

    const loadMetrics = async () => {
        try {
            const fetchedMetrics = await getCustomMetrics();
            setMetrics(fetchedMetrics);
            // Always select the first metric when loading
            if (fetchedMetrics.length > 0) {
                setSelectedMetric(fetchedMetrics[0]);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    };

    const loadMetricData = async (metricId: string) => {
        try {
            const records = await getMetricRecords(metricId, 30); // Last 30 records
            // Process for chart (Sort by date ASC for chart)
            const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

            const points: ChartPoint[] = sortedRecords.map(r => ({
                date: r.date.substring(5).replace('-', '/'),
                value: r.value,
                originalDate: r.date
            }));
            setChartData(points);
        } catch (error) {
            console.error('Error loading metric data:', error);
        }
    };

    const maxValue = chartData.length > 0 ? Math.max(...chartData.map(d => d.value)) * 1.2 : 100;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="커스텀 수치 차트" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>수치 선택</Text>
                    <View style={styles.metricList}>
                        {metrics.length === 0 ? (
                            <Text style={styles.emptyListText}>등록된 커스텀 수치가 없습니다.</Text>
                        ) : (
                            metrics.map(metric => (
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
                            ))
                        )}
                    </View>
                </Card>

                {selectedMetric && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {selectedMetric.name} 추이
                            {selectedMetric.unit && ` (${selectedMetric.unit})`}
                        </Text>

                        {chartData.length === 0 ? (
                            <Text style={styles.emptyText}>기록된 데이터가 없습니다.</Text>
                        ) : (
                            <>
                                {/* 간단한 라인 차트 시뮬레이션 */}
                                <View style={styles.chart}>
                                    {chartData.map((point, index) => (
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
                                {chartData.length >= 2 && (
                                    <View style={styles.trendBox}>
                                        {chartData[chartData.length - 1].value < chartData[0].value ? (
                                            <Text style={styles.trendGood}>📉 감소 추세</Text>
                                        ) : chartData[chartData.length - 1].value > chartData[0].value ? (
                                            <Text style={styles.trendBad}>📈 증가 추세</Text>
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
        </SafeAreaView>
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
    emptyListText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontStyle: 'italic',
        padding: 8,
    }
});

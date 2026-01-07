import { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';
import {
    AdaptiveChart,
    PeriodSelector,
    PeriodOption,
    getDateRangeForPeriod,
    ChartDataPoint,
} from '../../../components/charts';
import {
    getCustomMetrics,
    getMetricRecordsByDateRange,
    getMetricRecordsAggregated,
    getMetricRecordCount,
    getMetricSummaryStats,
    selectChartType,
    recommendAggregateUnit,
    CustomMetric,
    ChartType,
    AggregatedRecord,
} from '../../../services/customMetrics';
import { useSelectedPet } from '../../../hooks/use-selected-pet';

export default function CustomChartScreen() {
    const { selectedPetId } = useSelectedPet();
    const [metrics, setMetrics] = useState<CustomMetric[]>([]);
    const [selectedMetric, setSelectedMetric] = useState<CustomMetric | null>(null);
    const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>('1m');

    const [chartType, setChartType] = useState<ChartType>('DotChart');
    const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
    const [aggregatedData, setAggregatedData] = useState<AggregatedRecord[]>([]);
    const [summaryStats, setSummaryStats] = useState<{
        min: number;
        max: number;
        avg: number;
        count: number;
        firstDate: string | null;
        lastDate: string | null;
    } | null>(null);
    const [loading, setLoading] = useState(false);

    useFocusEffect(
        useCallback(() => {
            setSelectedMetric(null);
            loadMetrics();
        }, [selectedPetId])
    );

    useEffect(() => {
        if (selectedMetric) {
            loadMetricData(selectedMetric.id);
        } else {
            setChartData([]);
            setAggregatedData([]);
            setSummaryStats(null);
        }
    }, [selectedMetric, selectedPeriod]);

    const loadMetrics = async () => {
        try {
            const fetchedMetrics = await getCustomMetrics();
            setMetrics(fetchedMetrics);
            if (fetchedMetrics.length > 0) {
                setSelectedMetric(fetchedMetrics[0]);
            }
        } catch (error) {
            console.error('Error loading metrics:', error);
        }
    };

    const loadMetricData = async (metricId: string) => {
        setLoading(true);
        try {
            const { startDate, endDate } = getDateRangeForPeriod(selectedPeriod);

            // Get total count to determine chart type
            const totalCount = await getMetricRecordCount(metricId);
            const determinedChartType = selectChartType(totalCount);
            setChartType(determinedChartType);

            // For SummaryCard, just get summary stats
            if (determinedChartType === 'SummaryCard' || selectedPeriod === 'all' && totalCount > 180) {
                const stats = await getMetricSummaryStats(metricId);
                setSummaryStats(stats);

                // Still get some aggregated data for trend
                const unit = recommendAggregateUnit(totalCount);
                const aggData = await getMetricRecordsAggregated(metricId, startDate, endDate, unit);
                setAggregatedData(aggData);
                setChartData(aggData.map(r => ({
                    date: r.date,
                    displayDate: formatDisplayDate(r.date),
                    value: r.value,
                })));
            } else if (determinedChartType === 'BarChart' || determinedChartType === 'LineChart') {
                // Aggregate by week for medium-range data
                const unit = totalCount > 60 ? 'week' : 'day';
                const aggData = await getMetricRecordsAggregated(metricId, startDate, endDate, unit);
                setAggregatedData(aggData);
                setChartData(aggData.map(r => ({
                    date: r.date,
                    displayDate: formatDisplayDate(r.date),
                    value: r.value,
                })));
                setSummaryStats(null);
            } else {
                // DotChart - show daily data
                const records = await getMetricRecordsByDateRange(metricId, startDate, endDate);
                const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));

                const points: ChartDataPoint[] = sortedRecords.map(r => ({
                    date: r.date,
                    displayDate: r.date.substring(5).replace('-', '/'),
                    value: r.value,
                    originalRecord: r,
                }));
                setChartData(points);
                setAggregatedData([]);
                setSummaryStats(null);
            }
        } catch (error) {
            console.error('Error loading metric data:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="커스텀 수치 차트" showBack />

            <ScrollView style={styles.content}>
                {/* Metric Selector */}
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

                {/* Chart Card */}
                {selectedMetric && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>
                            {selectedMetric.name} 추이
                            {selectedMetric.unit && ` (${selectedMetric.unit})`}
                        </Text>

                        {/* Period Selector */}
                        <PeriodSelector
                            selected={selectedPeriod}
                            onSelect={setSelectedPeriod}
                        />


                        {/* Adaptive Chart */}
                        {loading ? (
                            <View style={styles.loadingContainer}>
                                <Text style={styles.loadingText}>로딩 중...</Text>
                            </View>
                        ) : (
                            <AdaptiveChart
                                chartType={chartType}
                                data={chartData}
                                aggregatedData={aggregatedData.length > 0 ? aggregatedData : undefined}
                                metricName={selectedMetric.name}
                                unit={selectedMetric.unit}
                                summaryStats={summaryStats}
                            />
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

function formatDisplayDate(dateStr: string): string {
    // 주간 형식: 2026-W03 → 26년\n01월 01주
    if (dateStr.includes('-W')) {
        const [yearPart, weekPart] = dateStr.split('-W');
        const year = yearPart.substring(2); // 26

        // ISO 주차로부터 해당 주의 날짜 계산
        const yearNum = parseInt(yearPart);
        const weekNum = parseInt(weekPart);

        // ISO week 기준 해당 주의 목요일 날짜 계산
        const jan4 = new Date(yearNum, 0, 4);
        const dayOfWeek = jan4.getDay() || 7;
        const firstThursday = new Date(jan4);
        firstThursday.setDate(jan4.getDate() - dayOfWeek + 4);

        const targetThursday = new Date(firstThursday);
        targetThursday.setDate(firstThursday.getDate() + (weekNum - 1) * 7);

        // 해당 월과 월 기준 주차 계산
        const month = String(targetThursday.getMonth() + 1).padStart(2, '0');
        const dayOfMonth = targetThursday.getDate();
        const weekOfMonth = String(Math.ceil(dayOfMonth / 7)).padStart(2, '0');

        return `${year}년\n${month}월 ${weekOfMonth}주`;
    }
    // 월별 형식: 2026-01 → 26/01
    if (dateStr.length === 7) {
        return dateStr.substring(2).replace('-', '/');
    }
    // 일별 형식: 2026-01-07 → 01/07
    return dateStr.substring(5).replace('-', '/');
}

function getChartTypeLabel(chartType: ChartType): string {
    switch (chartType) {
        case 'DotChart':
            return '📊 일별 점 차트';
        case 'LineChart':
            return '📈 주간 라인 차트';
        case 'BarChart':
            return '📉 주간 막대 차트';
        case 'SummaryCard':
            return '📋 요약 카드';
    }
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
    chartTypeBadge: {
        alignSelf: 'flex-start',
        backgroundColor: COLORS.background,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        marginBottom: 12,
    },
    chartTypeText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    loadingContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 14,
        color: COLORS.textSecondary,
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

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { COLORS } from '../../constants';
import SummaryStatsCard from './summary-stats-card';
import {
    ChartType,
    AggregatedRecord,
    CustomMetricRecord,
} from '../../services/customMetrics';

interface AdaptiveChartProps {
    chartType: ChartType;
    data: ChartDataPoint[];
    aggregatedData?: AggregatedRecord[];
    metricName: string;
    unit?: string | null;
    summaryStats?: {
        min: number;
        max: number;
        avg: number;
        count: number;
        firstDate: string | null;
        lastDate: string | null;
    } | null;
}

export interface ChartDataPoint {
    date: string;
    displayDate: string;
    value: number;
    originalRecord?: CustomMetricRecord;
}

interface TooltipState {
    visible: boolean;
    x: number;
    y: number;
    value: number;
    date: string;
}

export default function AdaptiveChart({
    chartType,
    data,
    aggregatedData,
    metricName,
    unit,
    summaryStats,
}: AdaptiveChartProps) {
    const [tooltip, setTooltip] = useState<TooltipState>({
        visible: false,
        x: 0,
        y: 0,
        value: 0,
        date: '',
    });

    // Calculate trend from first and last values
    const calculateTrend = (): 'up' | 'down' | 'stable' => {
        if (data.length < 2) return 'stable';
        const first = data[0].value;
        const last = data[data.length - 1].value;
        const diff = last - first;
        const threshold = first * 0.05; // 5% change threshold
        if (diff > threshold) return 'up';
        if (diff < -threshold) return 'down';
        return 'stable';
    };

    // Render SummaryCard for very long periods
    if (chartType === 'SummaryCard' && summaryStats) {
        return (
            <SummaryStatsCard
                metricName={metricName}
                unit={unit}
                min={summaryStats.min}
                max={summaryStats.max}
                avg={summaryStats.avg}
                count={summaryStats.count}
                firstDate={summaryStats.firstDate}
                lastDate={summaryStats.lastDate}
                trend={calculateTrend()}
            />
        );
    }

    const chartData = aggregatedData?.map(r => ({
        date: r.date,
        displayDate: formatDisplayDate(r.date),
        value: r.value,
    })) || data;

    if (chartData.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>기록된 데이터가 없습니다.</Text>
            </View>
        );
    }

    const maxValue = Math.max(...chartData.map(d => d.value)) * 1.2 || 100;
    const showValues = chartType === 'DotChart' && chartData.length <= 15;

    const handlePointPress = (point: typeof chartData[0], x: number, y: number) => {
        setTooltip({
            visible: true,
            x,
            y,
            value: point.value,
            date: point.displayDate,
        });

        // Auto-hide tooltip after 2 seconds
        setTimeout(() => {
            setTooltip(prev => ({ ...prev, visible: false }));
        }, 2000);
    };

    return (
        <View style={styles.container}>
            {/* Tooltip */}
            {tooltip.visible && (
                <View style={[styles.tooltip, { left: tooltip.x - 30, top: tooltip.y - 50 }]}>
                    <Text style={styles.tooltipValue}>{tooltip.value}{unit ? ` ${unit}` : ''}</Text>
                    <Text style={styles.tooltipDate}>{tooltip.date}</Text>
                </View>
            )}

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chartContent}
            >
                <View style={styles.chart}>
                    {chartData.map((point, index) => (
                        <Pressable
                            key={index}
                            style={styles.pointContainer}
                            onPress={(e) => {
                                const { pageX, pageY } = e.nativeEvent;
                                handlePointPress(point, pageX, pageY);
                            }}
                        >
                            <View style={styles.pointWrapper}>
                                {chartType === 'BarChart' ? (
                                    <View
                                        style={[
                                            styles.bar,
                                            { height: (point.value / maxValue) * 100 },
                                        ]}
                                    />
                                ) : (
                                    <>
                                        <View
                                            style={[
                                                styles.pointBar,
                                                { height: (point.value / maxValue) * 100 },
                                            ]}
                                        />
                                        <View style={[
                                            styles.point,
                                            chartType === 'LineChart' && styles.pointSmall,
                                        ]} />
                                    </>
                                )}
                            </View>
                            {showValues && (
                                <Text style={styles.pointValue}>{point.value}</Text>
                            )}
                            <Text style={styles.pointDate}>{point.displayDate}</Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>

            {/* Trend indicator */}
            {chartData.length >= 2 && (
                <View style={styles.trendBox}>
                    {calculateTrend() === 'down' ? (
                        <Text style={styles.trendDown}>📉 감소 추세</Text>
                    ) : calculateTrend() === 'up' ? (
                        <Text style={styles.trendUp}>📈 증가 추세</Text>
                    ) : (
                        <Text style={styles.trendStable}>➡️ 유지 중</Text>
                    )}
                </View>
            )}
        </View>
    );
}

function formatDisplayDate(dateStr: string): string {
    // Handle different date formats
    if (dateStr.includes('-W')) {
        // Week format: 2026-W01
        return dateStr.replace('-W', '/W');
    }
    if (dateStr.length === 7) {
        // Month format: 2026-01
        return dateStr.substring(2).replace('-', '/');
    }
    // Day format: 2026-01-15
    return dateStr.substring(5).replace('-', '/');
}

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    emptyContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    chartContent: {
        paddingHorizontal: 8,
    },
    chart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 160,
        paddingTop: 20,
        gap: 4,
    },
    pointContainer: {
        alignItems: 'center',
        minWidth: 36,
        paddingHorizontal: 4,
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
    pointSmall: {
        width: 8,
        height: 8,
        borderRadius: 4,
        bottom: -4,
    },
    bar: {
        width: 20,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
        minHeight: 4,
    },
    pointValue: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 12,
    },
    pointDate: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    tooltip: {
        position: 'absolute',
        backgroundColor: COLORS.textPrimary,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    tooltipValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.surface,
    },
    tooltipDate: {
        fontSize: 11,
        color: COLORS.surface,
        opacity: 0.8,
    },
    trendBox: {
        marginTop: 16,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        alignItems: 'center',
    },
    trendDown: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '600',
    },
    trendUp: {
        fontSize: 14,
        color: COLORS.error,
        fontWeight: '600',
    },
    trendStable: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});

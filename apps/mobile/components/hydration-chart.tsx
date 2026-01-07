import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../constants';
import Card from './card';

export interface HydrationChartItem {
    label: string;
    force: number;
    fluid: number;
    displayValue?: string;
}

interface HydrationChartProps {
    data: HydrationChartItem[];
    maxValue: number;
    title: string;
    columnWidth: number;
    barWidth: number;
    scrollViewRef?: React.RefObject<ScrollView | null>;
}

export default function HydrationChart({
    data,
    maxValue,
    title,
    columnWidth,
    barWidth,
    scrollViewRef
}: HydrationChartProps) {
    const chartHeight = 150;
    const barAreaHeight = 120;

    // 차트 너비 계산 (최소 300)
    const chartWidth = Math.max(data.length * columnWidth, 300);
    // 0 나누기 방지
    const maxDisplayValue = Math.max(maxValue, 1);

    return (
        <Card style={styles.card}>
            <Text style={styles.sectionTitle}>{title}</Text>
            <Text style={styles.chartHint}>좌우로 스크롤하여 확인하세요</Text>

            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
            >
                <View style={[
                    styles.hydrationChart,
                    {
                        width: chartWidth,
                        minWidth: 300,
                        backgroundColor: 'rgba(0, 0, 0, 0.02)',
                        borderRadius: 8,
                        paddingHorizontal: data.length <= 5 ? 20 : 0,
                        height: chartHeight + 40
                    }
                ]}>
                    {data.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>기록이 없습니다.</Text>
                        </View>
                    ) : (
                        data.map((item, index) => {
                            const hasData = item.force > 0 || item.fluid > 0;

                            return (
                                <View key={index} style={[styles.hydrationColumn, { width: columnWidth }]}>
                                    <View style={styles.hydrationMlLabelContainer}>
                                        <Text style={styles.hydrationMlLabel}>
                                            {item.displayValue}
                                        </Text>
                                    </View>

                                    <View style={styles.hydrationBarArea}>
                                        {hasData && (
                                            <View style={styles.hydrationBarStack}>
                                                {item.fluid > 0 && (
                                                    <View
                                                        style={[
                                                            styles.hydrationBar,
                                                            styles.barFluid,
                                                            {
                                                                width: barWidth,
                                                                height: Math.max((item.fluid / maxDisplayValue) * barAreaHeight, 2)
                                                            },
                                                        ]}
                                                    />
                                                )}
                                                {item.force > 0 && (
                                                    <View
                                                        style={[
                                                            styles.hydrationBar,
                                                            styles.barForce,
                                                            {
                                                                width: barWidth,
                                                                height: Math.max((item.force / maxDisplayValue) * barAreaHeight, 2)
                                                            },
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>

                                    <Text style={styles.dateLabel}>{item.label}</Text>
                                </View>
                            );
                        })
                    )}
                </View>
            </ScrollView>

            <View style={styles.legend}>
                <View style={styles.legendItem}>
                    <Text style={styles.legendEmoji}>💧</Text>
                    <View style={[styles.legendColor, styles.barForce]} />
                    <Text style={styles.legendText}>강수</Text>
                </View>
                <View style={styles.legendItem}>
                    <Text style={styles.legendEmoji}>💉</Text>
                    <View style={[styles.legendColor, styles.barFluid]} />
                    <Text style={styles.legendText}>수액</Text>
                </View>
            </View>
        </Card>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
        textAlign: 'center',
    },
    chartHint: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 8,
        lineHeight: 16,
        textAlign: 'center',
    },
    emptyContainer: {
        minWidth: 300,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    hydrationChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingTop: 10,
        // height는 inline style에서 덮어씀
    },
    hydrationColumn: {
        alignItems: 'center',
    },
    hydrationMlLabelContainer: {
        height: 14,
        marginBottom: 4,
        justifyContent: 'flex-end',
        width: '100%',
    },
    hydrationMlLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.emerald,
        textAlign: 'center',
    },
    hydrationBarArea: {
        height: 140, // 70 -> 140
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    hydrationBarStack: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    hydrationBar: {
        borderRadius: 4,
        marginBottom: 1,
    },
    barForce: {
        backgroundColor: COLORS.indigo,
    },
    barFluid: {
        backgroundColor: COLORS.emerald,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 6,
    },
    legendText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    dateLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 4,
    },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '../constants';
import Card from './card';
import type { MonthlyChartData, MonthlyHydrationData } from '../types/chart-types';

interface SummaryMonthlyChartsProps {
    monthlyChartData: MonthlyChartData[];
    monthlyHydrationData: MonthlyHydrationData[];
}

// Opacity 계산 함수
const getPoopOpacity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 20) return 0.3;
    if (count <= 60) return 0.6;
    return 1.0;
};

const getDiarrheaOpacity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 3) return 0.3;
    if (count <= 7) return 0.6;
    return 1.0;
};

const getVomitOpacity = (count: number): number => {
    if (count === 0) return 0;
    if (count <= 2) return 0.3;
    if (count <= 5) return 0.6;
    return 1.0;
};

export default function SummaryMonthlyCharts({
    monthlyChartData,
    monthlyHydrationData
}: SummaryMonthlyChartsProps) {
    if (monthlyChartData.length === 0) {
        return (
            <Card style={styles.card}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>기록이 없습니다.</Text>
                </View>
            </Card>
        );
    }

    return (
        <>
            {/* 배변 횟수 차트 */}
            <Card style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>배변 횟수 (월간)</Text>
                    <Text style={styles.legendTextHeader}>색이 진할수록 많이 기록됨</Text>
                </View>
                <View style={styles.chartRow}>
                    {monthlyChartData.map((month, index) => (
                        <View key={index} style={styles.monthColumn}>
                            <View style={styles.barArea}>
                                {month.poop > 0 && (
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barPoop,
                                            { opacity: getPoopOpacity(month.poop) }
                                        ]}
                                    />
                                )}
                            </View>
                            <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        </View>
                    ))}
                </View>
            </Card>

            {/* 설사 횟수 차트 */}
            <Card style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>설사 횟수 (월간)</Text>
                    <Text style={styles.legendTextHeader}>색이 진할수록 많이 기록됨</Text>
                </View>
                <View style={styles.chartRow}>
                    {monthlyChartData.map((month, index) => (
                        <View key={index} style={styles.monthColumn}>
                            <View style={styles.barArea}>
                                {month.diarrhea > 0 && (
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barWarning,
                                            { opacity: getDiarrheaOpacity(month.diarrhea) }
                                        ]}
                                    />
                                )}
                            </View>
                            <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        </View>
                    ))}
                </View>
            </Card>

            {/* 구토 횟수 차트 */}
            <Card style={styles.card}>
                <View style={styles.headerRow}>
                    <Text style={styles.sectionTitle}>구토 횟수 (월간)</Text>
                    <Text style={styles.legendTextHeader}>색이 진할수록 많이 기록됨</Text>
                </View>
                <View style={styles.chartRow}>
                    {monthlyChartData.map((month, index) => (
                        <View key={index} style={styles.monthColumn}>
                            <View style={styles.barArea}>
                                {month.vomit > 0 && (
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barError,
                                            { opacity: getVomitOpacity(month.vomit) }
                                        ]}
                                    />
                                )}
                            </View>
                            <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        </View>
                    ))}
                </View>
            </Card>

            {/* 강수/수액 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>강수 / 수액 (월간)</Text>
                <View style={styles.chartRow}>
                    {monthlyHydrationData.map((month, index) => (
                        <View key={index} style={styles.monthColumn}>
                            <View style={styles.barArea}>
                                {(month.hasForce || month.hasFluid) && (
                                    <View style={styles.hydrationStack}>
                                        {month.hasForce && (
                                            <View style={[styles.barSmall, styles.barForce]} />
                                        )}
                                        {month.hasFluid && (
                                            <View style={[styles.barSmall, styles.barFluid]} />
                                        )}
                                    </View>
                                )}
                            </View>
                            <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                        </View>
                    ))}
                </View>
                <View style={styles.legend}>
                    <View style={styles.legendItem}>
                        <Text style={styles.legendEmoji}>💧</Text>
                        <View style={[styles.legendColor, styles.barForce]} />
                        <Text style={styles.legendItemText}>강수</Text>
                    </View>
                    <View style={styles.legendItem}>
                        <Text style={styles.legendEmoji}>💉</Text>
                        <View style={[styles.legendColor, styles.barFluid]} />
                        <Text style={styles.legendItemText}>수액</Text>
                    </View>
                </View>
            </Card>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    legendTextHeader: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    chartRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
        paddingHorizontal: 8,
    },
    monthColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barArea: {
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: 28,
        height: 50,
        borderRadius: 6,
    },
    barSmall: {
        width: 28,
        height: 22,
        borderRadius: 4,
    },
    barPoop: {
        backgroundColor: COLORS.primary,
    },
    barWarning: {
        backgroundColor: COLORS.warning,
    },
    barError: {
        backgroundColor: COLORS.error,
    },
    barForce: {
        backgroundColor: COLORS.indigoDeep,
    },
    barFluid: {
        backgroundColor: COLORS.emeraldDeep,
    },
    hydrationStack: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    monthLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 8,
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
    legendItemText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});

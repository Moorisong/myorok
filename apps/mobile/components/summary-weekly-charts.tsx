import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { COLORS } from '../constants';
import Card from './card';
import type { WeeklyChartData, WeeklyHydrationData } from '../types/chart-types';

interface SummaryWeeklyChartsProps {
    weeklyChartData: WeeklyChartData[];
    weeklyHydrationData: WeeklyHydrationData[];
    scrollViewRef3m1: React.RefObject<ScrollView | null>;
    scrollViewRef3m2: React.RefObject<ScrollView | null>;
    scrollViewRef3m3: React.RefObject<ScrollView | null>;
    scrollViewRef3m4: React.RefObject<ScrollView | null>;
}

export default function SummaryWeeklyCharts({
    weeklyChartData,
    weeklyHydrationData,
    scrollViewRef3m1,
    scrollViewRef3m2,
    scrollViewRef3m3,
    scrollViewRef3m4
}: SummaryWeeklyChartsProps) {
    return (
        <>
            {/* 배변 주간 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>배변 횟수 (주간)</Text>
                {weeklyChartData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>기록이 없습니다.</Text>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef3m1}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                    >
                        <View style={styles.weeklyChart}>
                            {weeklyChartData.map((week, index) => {
                                const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.poop), 10);
                                const hasData = week.poop > 0;
                                return (
                                    <View key={index} style={styles.weeklyColumn}>
                                        <Text style={styles.weeklyBarLabel}>
                                            {hasData ? `${week.poop}회` : ''}
                                        </Text>
                                        <View style={styles.weeklyBarArea}>
                                            {hasData && (
                                                <View
                                                    style={[
                                                        styles.weeklyBar,
                                                        styles.weeklyBarPoop,
                                                        { height: Math.max((week.poop / maxWeeklyValue) * 60, 4) }
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.weeklyLabel}>{week.weekLabel}</Text>
                                    </View>
                                );
                            })}
                        </View>
                    </ScrollView>
                )}
            </Card>

            {/* 설사 주간 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>설사 횟수 (주간)</Text>
                <ScrollView
                    ref={scrollViewRef3m2}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.weeklyChart}>
                        {weeklyChartData.map((week, index) => {
                            const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.diarrhea), 5);
                            const hasData = week.diarrhea > 0;
                            return (
                                <View key={index} style={styles.weeklyColumn}>
                                    <Text style={[styles.weeklyBarLabel, styles.weeklyBarLabelWarning]}>
                                        {hasData ? `${week.diarrhea}회` : ''}
                                    </Text>
                                    <View style={styles.weeklyBarArea}>
                                        {hasData && (
                                            <View
                                                style={[
                                                    styles.weeklyBar,
                                                    styles.weeklyBarWarning,
                                                    { height: Math.max((week.diarrhea / maxWeeklyValue) * 60, 4) }
                                                ]}
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.weeklyLabel}>{week.weekLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Card>

            {/* 구토 주간 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>구토 횟수 (주간)</Text>
                <ScrollView
                    ref={scrollViewRef3m3}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.weeklyChart}>
                        {weeklyChartData.map((week, index) => {
                            const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.vomit), 5);
                            const hasData = week.vomit > 0;
                            return (
                                <View key={index} style={styles.weeklyColumn}>
                                    <Text style={[styles.weeklyBarLabel, styles.weeklyBarLabelError]}>
                                        {hasData ? `${week.vomit}회` : ''}
                                    </Text>
                                    <View style={styles.weeklyBarArea}>
                                        {hasData && (
                                            <View
                                                style={[
                                                    styles.weeklyBar,
                                                    styles.weeklyBarError,
                                                    { height: Math.max((week.vomit / maxWeeklyValue) * 60, 4) }
                                                ]}
                                            />
                                        )}
                                    </View>
                                    <Text style={styles.weeklyLabel}>{week.weekLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Card>

            {/* 강수/수액 주간 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>강수 / 수액 (주간)</Text>
                <ScrollView
                    ref={scrollViewRef3m4}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                >
                    <View style={styles.weeklyChart}>
                        {weeklyHydrationData.map((week, index) => {
                            const total = week.force + week.fluid;
                            const maxWeeklyValue = Math.max(...weeklyHydrationData.map(w => w.force + w.fluid), 500);
                            const hasData = total > 0;
                            return (
                                <View key={index} style={styles.weeklyColumn}>
                                    <Text style={styles.weeklyBarLabelHydration}>
                                        {hasData ? `${total}ml` : ''}
                                    </Text>
                                    <View style={styles.weeklyBarArea}>
                                        {hasData && (
                                            <View style={styles.weeklyBarStack}>
                                                {week.fluid > 0 && (
                                                    <View
                                                        style={[
                                                            styles.weeklyBar,
                                                            styles.weeklyBarFluid,
                                                            { height: Math.max((week.fluid / maxWeeklyValue) * 60, 2) }
                                                        ]}
                                                    />
                                                )}
                                                {week.force > 0 && (
                                                    <View
                                                        style={[
                                                            styles.weeklyBar,
                                                            styles.weeklyBarForce,
                                                            { height: Math.max((week.force / maxWeeklyValue) * 60, 2) }
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.weeklyLabel}>{week.weekLabel}</Text>
                                </View>
                            );
                        })}
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

            <View style={styles.bottomPadding} />
        </>
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
        marginBottom: 8,
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
    weeklyChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
        paddingHorizontal: 8,
    },
    weeklyColumn: {
        alignItems: 'center',
        width: 48,
        marginHorizontal: 4,
    },
    weeklyBarArea: {
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    weeklyBar: {
        width: 24,
        borderRadius: 4,
    },
    weeklyBarPoop: {
        backgroundColor: COLORS.primary,
    },
    weeklyBarWarning: {
        backgroundColor: COLORS.warning,
    },
    weeklyBarError: {
        backgroundColor: COLORS.error,
    },
    weeklyBarForce: {
        backgroundColor: COLORS.indigoDeep,
    },
    weeklyBarFluid: {
        backgroundColor: COLORS.emeraldDeep,
    },
    weeklyBarStack: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    weeklyBarLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 4,
        height: 16,
    },
    weeklyBarLabelWarning: {
        color: COLORS.warning,
    },
    weeklyBarLabelError: {
        color: COLORS.error,
    },
    weeklyBarLabelHydration: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.indigoDeep,
        marginBottom: 4,
        height: 16,
    },
    weeklyLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 6,
        textAlign: 'center',
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
    barForce: {
        backgroundColor: COLORS.indigo,
    },
    barFluid: {
        backgroundColor: COLORS.emerald,
    },
    bottomPadding: {
        height: 100,
    },
});

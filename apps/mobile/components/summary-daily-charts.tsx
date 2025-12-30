import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

import { COLORS } from '../constants';
import Card from './card';
import type { ChartData, HydrationData } from '../types/chart-types';

interface SummaryDailyChartsProps {
    chartData: ChartData[];
    hydrationData: HydrationData[];
    maxValue: number;
    maxVolValue: number;
    scrollViewRef: React.RefObject<ScrollView>;
    scrollViewRef2: React.RefObject<ScrollView>;
    scrollViewRef3: React.RefObject<ScrollView>;
    scrollViewRef4: React.RefObject<ScrollView>;
}

export default function SummaryDailyCharts({
    chartData,
    hydrationData,
    maxValue,
    maxVolValue,
    scrollViewRef,
    scrollViewRef2,
    scrollViewRef3,
    scrollViewRef4
}: SummaryDailyChartsProps) {
    return (
        <>
            {/* 배변 횟수 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>배변 횟수</Text>

                <ScrollView
                    ref={scrollViewRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={[styles.dotChart, { width: Math.max(chartData.length * 36, 300) }]}>
                        {chartData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>기록이 없습니다.</Text>
                            </View>
                        ) : (
                            chartData.map((day, index) => {
                                const maxDisplayValue = Math.max(maxValue, 5);
                                const hasData = day.poop > 0;
                                return (
                                    <View key={index} style={styles.dotColumn}>
                                        <View style={styles.dotArea}>
                                            {hasData && (
                                                <>
                                                    <Text style={styles.dotLabel}>{day.poop}회</Text>
                                                    <View
                                                        style={[
                                                            styles.dot,
                                                            styles.dotPoop,
                                                            { bottom: (day.poop / maxDisplayValue) * 60 }
                                                        ]}
                                                    />
                                                </>
                                            )}
                                        </View>
                                        <Text style={styles.dotDateLabel}>{day.date}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </Card>

            {/* 설사 횟수 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>설사 횟수</Text>

                <ScrollView
                    ref={scrollViewRef2}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={[styles.dotChart, { width: Math.max(chartData.length * 36, 300) }]}>
                        {chartData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>기록이 없습니다.</Text>
                            </View>
                        ) : (
                            chartData.map((day, index) => {
                                const maxDisplayValue = Math.max(maxValue, 5);
                                const hasData = day.diarrhea > 0;
                                return (
                                    <View key={index} style={styles.dotColumn}>
                                        <View style={styles.dotArea}>
                                            {hasData && (
                                                <>
                                                    <Text style={[styles.dotLabel, styles.dotLabelWarning]}>{day.diarrhea}회</Text>
                                                    <View
                                                        style={[
                                                            styles.dot,
                                                            styles.dotDiarrhea,
                                                            { bottom: (day.diarrhea / maxDisplayValue) * 60 }
                                                        ]}
                                                    />
                                                </>
                                            )}
                                        </View>
                                        <Text style={styles.dotDateLabel}>{day.date}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </Card>

            {/* 구토 횟수 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>구토 횟수</Text>

                <ScrollView
                    ref={scrollViewRef3}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={[styles.dotChart, { width: Math.max(chartData.length * 36, 300) }]}>
                        {chartData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>기록이 없습니다.</Text>
                            </View>
                        ) : (
                            chartData.map((day, index) => {
                                const maxDisplayValue = Math.max(maxValue, 5);
                                const hasData = day.vomit > 0;
                                return (
                                    <View key={index} style={styles.dotColumn}>
                                        <View style={styles.dotArea}>
                                            {hasData && (
                                                <>
                                                    <Text style={[styles.dotLabel, styles.dotLabelError]}>{day.vomit}회</Text>
                                                    <View
                                                        style={[
                                                            styles.dot,
                                                            styles.dotVomit,
                                                            { bottom: (day.vomit / maxDisplayValue) * 60 }
                                                        ]}
                                                    />
                                                </>
                                            )}
                                        </View>
                                        <Text style={styles.dotDateLabel}>{day.date}</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                </ScrollView>
            </Card>

            {/* 강수/수액 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>강수 / 수액</Text>

                <ScrollView ref={scrollViewRef4} horizontal showsHorizontalScrollIndicator={false}>
                    <View style={[styles.hydrationChart, { width: Math.max(hydrationData.length * 44, 300) }]}>
                        {hydrationData.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Text style={styles.emptyText}>기록이 없습니다.</Text>
                            </View>
                        ) : (
                            hydrationData.map((day, index) => {
                                const total = day.force + day.fluid;
                                const hasData = total > 0;
                                const maxDisplayValue = Math.max(maxVolValue, 100);

                                return (
                                    <View key={index} style={styles.hydrationColumn}>
                                        <Text style={styles.hydrationMlLabel}>
                                            {hasData ? `${total}ml` : ''}
                                        </Text>

                                        <View style={styles.hydrationBarArea}>
                                            {hasData && (
                                                <View style={styles.hydrationBarStack}>
                                                    {day.fluid > 0 && (
                                                        <View
                                                            style={[
                                                                styles.hydrationBar,
                                                                styles.barFluid,
                                                                { height: (day.fluid / maxDisplayValue) * 70 },
                                                            ]}
                                                        />
                                                    )}
                                                    {day.force > 0 && (
                                                        <View
                                                            style={[
                                                                styles.hydrationBar,
                                                                styles.barForce,
                                                                { height: (day.force / maxDisplayValue) * 70 },
                                                            ]}
                                                        />
                                                    )}
                                                </View>
                                            )}
                                        </View>

                                        <Text style={styles.dotDateLabel}>{day.date}</Text>
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
    dotChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 110,
        paddingTop: 10,
    },
    dotColumn: {
        alignItems: 'center',
        width: 36,
    },
    dotArea: {
        height: 80,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        position: 'absolute',
    },
    dotPoop: {
        backgroundColor: COLORS.primary,
    },
    dotDiarrhea: {
        backgroundColor: COLORS.warning,
    },
    dotVomit: {
        backgroundColor: COLORS.error,
    },
    dotLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
        position: 'absolute',
        top: 0,
        textAlign: 'center',
    },
    dotLabelWarning: {
        color: COLORS.warning,
    },
    dotLabelError: {
        color: COLORS.error,
    },
    dotDateLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 4,
        textAlign: 'center',
    },
    hydrationChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 120,
        paddingTop: 10,
    },
    hydrationColumn: {
        alignItems: 'center',
        width: 44,
    },
    hydrationMlLabel: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.emerald,
        height: 14,
        textAlign: 'center',
        marginBottom: 2,
    },
    hydrationBarArea: {
        height: 80,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    hydrationBarStack: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    hydrationBar: {
        width: 20,
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
});

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

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

// 연속된 데이터 구간을 찾는 함수
interface ContinuousSegment {
    startIndex: number;
    endIndex: number;
    points: Array<{ index: number; value: number }>;
}

function findContinuousSegments(data: WeeklyChartData[], key: 'poop' | 'diarrhea' | 'vomit'): ContinuousSegment[] {
    const segments: ContinuousSegment[] = [];
    let currentSegment: ContinuousSegment | null = null;

    for (let index = 0; index < data.length; index++) {
        const item = data[index];
        const value = item[key];
        const hasData = value > 0;

        if (hasData) {
            if (!currentSegment) {
                currentSegment = {
                    startIndex: index,
                    endIndex: index,
                    points: [{ index, value }]
                };
            } else {
                currentSegment.endIndex = index;
                currentSegment.points.push({ index, value });
            }
        } else {
            if (currentSegment && currentSegment.points.length >= 2) {
                segments.push(currentSegment);
            }
            currentSegment = null;
        }
    }

    if (currentSegment && currentSegment.points.length >= 2) {
        segments.push(currentSegment);
    }

    return segments;
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
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 주입니다. 선은 연속으로 발생한 주를 연결한 표시이며, 발생하지 않은 주(0회)는 표시하지 않습니다.
                </Text>
                {weeklyChartData.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText}>기록이 없습니다.</Text>
                    </View>
                ) : (
                    <ScrollView
                        ref={scrollViewRef3m1}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
                        <View style={[styles.weeklyChart, { width: Math.max(weeklyChartData.length * 56, 300) }]}>
                            {/* SVG로 연속 라인 그리기 */}
                            <Svg
                                style={StyleSheet.absoluteFill}
                                width={Math.max(weeklyChartData.length * 56, 300)}
                                height={110}
                            >
                                {findContinuousSegments(weeklyChartData, 'poop').map((segment, segIndex) => {
                                    const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.poop), 10);
                                    const pathData = segment.points
                                        .map((point, i) => {
                                            const x = point.index * 56 + 28;
                                            const y = 90 - (point.value / maxWeeklyValue) * 60 - 6; // -6 for dot center
                                            return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                                        })
                                        .join(' ');

                                    return (
                                        <Path
                                            key={segIndex}
                                            d={pathData}
                                            stroke={COLORS.primary}
                                            strokeWidth={1.5}
                                            fill="none"
                                            opacity={0.5}
                                        />
                                    );
                                })}
                            </Svg>

                            {/* 점과 라벨 */}
                            {weeklyChartData.map((week, index) => {
                                const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.poop), 10);
                                const hasData = week.poop > 0;
                                return (
                                    <View key={index} style={styles.weeklyColumn}>
                                        <View style={styles.weeklyDotArea}>
                                            {hasData && (
                                                <>
                                                    <Text style={styles.weeklyDotLabel}>{week.poop}회</Text>
                                                    <View
                                                        style={[
                                                            styles.weeklyDot,
                                                            styles.weeklyDotPoop,
                                                            { bottom: (week.poop / maxWeeklyValue) * 60 }
                                                        ]}
                                                    />
                                                </>
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
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 주입니다. 선은 연속으로 발생한 주를 연결한 표시이며, 발생하지 않은 주(0회)는 표시하지 않습니다.
                </Text>
                <ScrollView
                    ref={scrollViewRef3m2}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={[styles.weeklyChart, { width: Math.max(weeklyChartData.length * 56, 300) }]}>
                        {/* SVG로 연속 라인 그리기 */}
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={Math.max(weeklyChartData.length * 56, 300)}
                            height={110}
                        >
                            {findContinuousSegments(weeklyChartData, 'diarrhea').map((segment, segIndex) => {
                                const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.diarrhea), 5);
                                const pathData = segment.points
                                    .map((point, i) => {
                                        const x = point.index * 56 + 28;
                                        const y = 90 - (point.value / maxWeeklyValue) * 60 - 6;
                                        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                                    })
                                    .join(' ');

                                return (
                                    <Path
                                        key={segIndex}
                                        d={pathData}
                                        stroke={COLORS.warning}
                                        strokeWidth={1.5}
                                        fill="none"
                                        opacity={0.5}
                                    />
                                );
                            })}
                        </Svg>

                        {/* 점과 라벨 */}
                        {weeklyChartData.map((week, index) => {
                            const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.diarrhea), 5);
                            const hasData = week.diarrhea > 0;
                            return (
                                <View key={index} style={styles.weeklyColumn}>
                                    <View style={styles.weeklyDotArea}>
                                        {hasData && (
                                            <>
                                                <Text style={[styles.weeklyDotLabel, styles.weeklyDotLabelWarning]}>{week.diarrhea}회</Text>
                                                <View
                                                    style={[
                                                        styles.weeklyDot,
                                                        styles.weeklyDotWarning,
                                                        { bottom: (week.diarrhea / maxWeeklyValue) * 60 }
                                                    ]}
                                                />
                                            </>
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
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 주입니다. 선은 연속으로 발생한 주를 연결한 표시이며, 발생하지 않은 주(0회)는 표시하지 않습니다.
                </Text>
                <ScrollView
                    ref={scrollViewRef3m3}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={[styles.weeklyChart, { width: Math.max(weeklyChartData.length * 56, 300) }]}>
                        {/* SVG로 연속 라인 그리기 */}
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={Math.max(weeklyChartData.length * 56, 300)}
                            height={110}
                        >
                            {findContinuousSegments(weeklyChartData, 'vomit').map((segment, segIndex) => {
                                const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.vomit), 5);
                                const pathData = segment.points
                                    .map((point, i) => {
                                        const x = point.index * 56 + 28;
                                        const y = 90 - (point.value / maxWeeklyValue) * 60 - 6;
                                        return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                                    })
                                    .join(' ');

                                return (
                                    <Path
                                        key={segIndex}
                                        d={pathData}
                                        stroke={COLORS.error}
                                        strokeWidth={1.5}
                                        fill="none"
                                        opacity={0.5}
                                    />
                                );
                            })}
                        </Svg>

                        {/* 점과 라벨 */}
                        {weeklyChartData.map((week, index) => {
                            const maxWeeklyValue = Math.max(...weeklyChartData.map(w => w.vomit), 5);
                            const hasData = week.vomit > 0;
                            return (
                                <View key={index} style={styles.weeklyColumn}>
                                    <View style={styles.weeklyDotArea}>
                                        {hasData && (
                                            <>
                                                <Text style={[styles.weeklyDotLabel, styles.weeklyDotLabelError]}>{week.vomit}회</Text>
                                                <View
                                                    style={[
                                                        styles.weeklyDot,
                                                        styles.weeklyDotError,
                                                        { bottom: (week.vomit / maxWeeklyValue) * 60 }
                                                    ]}
                                                />
                                            </>
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
                    contentContainerStyle={{ paddingRight: 20 }}
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
        marginBottom: 4,
    },
    chartHint: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginBottom: 8,
        lineHeight: 16,
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
        height: 110,
        paddingTop: 10,
    },
    weeklyColumn: {
        alignItems: 'center',
        width: 56,
    },
    weeklyDotArea: {
        height: 80,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    weeklyDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
    },
    weeklyDotPoop: {
        backgroundColor: COLORS.primary,
    },
    weeklyDotWarning: {
        backgroundColor: COLORS.warning,
    },
    weeklyDotError: {
        backgroundColor: COLORS.error,
    },
    weeklyDotLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
        position: 'absolute',
        top: 0,
        textAlign: 'center',
    },
    weeklyDotLabelWarning: {
        color: COLORS.warning,
    },
    weeklyDotLabelError: {
        color: COLORS.error,
    },
    weeklyBarForce: {
        backgroundColor: COLORS.indigoDeep,
    },
    weeklyBarFluid: {
        backgroundColor: COLORS.emeraldDeep,
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
    weeklyBarStack: {
        flexDirection: 'column',
        alignItems: 'center',
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
        marginTop: 4,
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

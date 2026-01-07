import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { COLORS } from '../constants';
import Card from './card';
import type { MonthlyChartData, MonthlyHydrationData } from '../types/chart-types';

interface SummaryMonthlyChartsProps {
    monthlyChartData: MonthlyChartData[];
    monthlyHydrationData: MonthlyHydrationData[];
}

// 연속된 데이터 구간을 찾는 함수
interface ContinuousSegment {
    startIndex: number;
    endIndex: number;
    points: Array<{ index: number; value: number }>;
}

function findContinuousSegments(data: MonthlyChartData[], key: 'poop' | 'diarrhea' | 'vomit'): ContinuousSegment[] {
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
                <Text style={styles.sectionTitle}>배변 횟수 (월간)</Text>
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 월입니다. 선은 연속으로 발생한 월을 연결한 표시이며, 발생하지 않은 월(0회)은 표시하지 않습니다.
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingRight: 20,
                        flexGrow: monthlyChartData.length <= 5 ? 1 : 0,
                        justifyContent: monthlyChartData.length <= 5 ? 'center' : 'flex-start',
                    }}
                >
                    <View style={[styles.chartRow, { width: monthlyChartData.length * 60 }]}>
                        {/* SVG로 연속 라인 그리기 */}
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={Math.max(monthlyChartData.length * 60, 300)}
                            height={110}
                        >
                            {findContinuousSegments(monthlyChartData, 'poop').map((segment, segIndex) => {
                                const maxValue = Math.max(...monthlyChartData.map(m => m.poop), 10);
                                const pathData = segment.points
                                    .map((point, i) => {
                                        const x = point.index * 60 + 30;
                                        const y = 90 - (point.value / maxValue) * 60;
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
                        {monthlyChartData.map((month, index) => {
                            const maxValue = Math.max(...monthlyChartData.map(m => m.poop), 10);
                            const hasData = month.poop > 0;
                            return (
                                <View key={index} style={styles.monthColumn}>
                                    <View style={styles.dotArea}>
                                        {hasData && (
                                            <>
                                                <Text style={styles.dotLabel}>{month.poop}회</Text>
                                                <View
                                                    style={[
                                                        styles.dot,
                                                        styles.dotPoop,
                                                        { bottom: (month.poop / maxValue) * 60 }
                                                    ]}
                                                />
                                            </>
                                        )}
                                    </View>
                                    <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Card>

            {/* 설사 횟수 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>설사 횟수 (월간)</Text>
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 월입니다. 선은 연속으로 발생한 월을 연결한 표시이며, 발생하지 않은 월(0회)은 표시하지 않습니다.
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingRight: 20,
                        flexGrow: monthlyChartData.length <= 5 ? 1 : 0,
                        justifyContent: monthlyChartData.length <= 5 ? 'center' : 'flex-start',
                    }}
                >
                    <View style={[styles.chartRow, { width: monthlyChartData.length * 60 }]}>
                        {/* SVG로 연속 라인 그리기 */}
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={Math.max(monthlyChartData.length * 60, 300)}
                            height={110}
                        >
                            {findContinuousSegments(monthlyChartData, 'diarrhea').map((segment, segIndex) => {
                                const maxValue = Math.max(...monthlyChartData.map(m => m.diarrhea), 10);
                                const pathData = segment.points
                                    .map((point, i) => {
                                        const x = point.index * 60 + 30;
                                        const y = 90 - (point.value / maxValue) * 60;
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
                        {monthlyChartData.map((month, index) => {
                            const maxValue = Math.max(...monthlyChartData.map(m => m.diarrhea), 10);
                            const hasData = month.diarrhea > 0;
                            return (
                                <View key={index} style={styles.monthColumn}>
                                    <View style={styles.dotArea}>
                                        {hasData && (
                                            <>
                                                <Text style={[styles.dotLabel, styles.dotLabelWarning]}>{month.diarrhea}회</Text>
                                                <View
                                                    style={[
                                                        styles.dot,
                                                        styles.dotWarning,
                                                        { bottom: (month.diarrhea / maxValue) * 60 }
                                                    ]}
                                                />
                                            </>
                                        )}
                                    </View>
                                    <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Card>

            {/* 구토 횟수 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>구토 횟수 (월간)</Text>
                <Text style={styles.chartHint}>
                    점은 증상이 발생한 월입니다. 선은 연속으로 발생한 월을 연결한 표시이며, 발생하지 않은 월(0회)은 표시하지 않습니다.
                </Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{
                        paddingRight: 20,
                        flexGrow: monthlyChartData.length <= 5 ? 1 : 0,
                        justifyContent: monthlyChartData.length <= 5 ? 'center' : 'flex-start',
                    }}
                >
                    <View style={[styles.chartRow, { width: monthlyChartData.length * 60 }]}>
                        {/* SVG로 연속 라인 그리기 */}
                        <Svg
                            style={StyleSheet.absoluteFill}
                            width={Math.max(monthlyChartData.length * 60, 300)}
                            height={110}
                        >
                            {findContinuousSegments(monthlyChartData, 'vomit').map((segment, segIndex) => {
                                const maxValue = Math.max(...monthlyChartData.map(m => m.vomit), 10);
                                const pathData = segment.points
                                    .map((point, i) => {
                                        const x = point.index * 60 + 30;
                                        const y = 90 - (point.value / maxValue) * 60;
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
                        {monthlyChartData.map((month, index) => {
                            const maxValue = Math.max(...monthlyChartData.map(m => m.vomit), 10);
                            const hasData = month.vomit > 0;
                            return (
                                <View key={index} style={styles.monthColumn}>
                                    <View style={styles.dotArea}>
                                        {hasData && (
                                            <>
                                                <Text style={[styles.dotLabel, styles.dotLabelError]}>{month.vomit}회</Text>
                                                <View
                                                    style={[
                                                        styles.dot,
                                                        styles.dotError,
                                                        { bottom: (month.vomit / maxValue) * 60 }
                                                    ]}
                                                />
                                            </>
                                        )}
                                    </View>
                                    <Text style={styles.monthLabel}>{month.monthLabel}</Text>
                                </View>
                            );
                        })}
                    </View>
                </ScrollView>
            </Card>

            {/* 강수/수액 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>강수 / 수액 (월간)</Text>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
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
                </ScrollView>
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
    chartRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 110,
        paddingTop: 10,
        position: 'relative',
    },
    monthColumn: {
        alignItems: 'center',
        width: 60,
    },
    dotArea: {
        height: 80,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
        position: 'relative',
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        position: 'absolute',
    },
    dotPoop: {
        backgroundColor: COLORS.primary,
    },
    dotWarning: {
        backgroundColor: COLORS.warning,
    },
    dotError: {
        backgroundColor: COLORS.error,
    },
    dotLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
        position: 'absolute',
        top: -6,
        textAlign: 'center',
    },
    dotLabelWarning: {
        color: COLORS.warning,
    },
    dotLabelError: {
        color: COLORS.error,
    },
    barArea: {
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    barSmall: {
        width: 28,
        height: 22,
        borderRadius: 4,
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
        fontSize: 9,
        color: COLORS.textSecondary,
        marginTop: 4,
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

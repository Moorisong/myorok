import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

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

// 차트 상수 (3개월 - 주간)
const CHART_CONFIG = {
    columnWidth: 56,
    chartHeight: 110,
    dotRadius: 6,
    valueAreaHeight: 60,
    topPadding: 20,
};

// Y 좌표 계산 함수
function getYPosition(value: number, maxValue: number): number {
    const normalizedValue = value / maxValue;
    return CHART_CONFIG.chartHeight - CHART_CONFIG.topPadding - (normalizedValue * CHART_CONFIG.valueAreaHeight);
}

function getXPosition(index: number): number {
    return index * CHART_CONFIG.columnWidth + CHART_CONFIG.columnWidth / 2;
}

interface DotLineChartProps {
    data: WeeklyChartData[];
    dataKey: 'poop' | 'diarrhea' | 'vomit';
    maxValue: number;
    color: string;
    scrollViewRef: React.RefObject<ScrollView | null>;
    title: string;
}

function DotLineChart({ data, dataKey, maxValue, color, scrollViewRef, title }: DotLineChartProps) {
    const chartWidth = Math.max(data.length * CHART_CONFIG.columnWidth, 300);
    const maxDisplayValue = Math.max(maxValue, 5);

    if (data.length === 0) {
        return (
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>기록이 없습니다.</Text>
                </View>
            </Card>
        );
    }

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
                <View style={{ width: chartWidth, height: CHART_CONFIG.chartHeight + 40, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 8, padding: 8 }}>
                    {/* SVG로 선과 점 그리기 */}
                    <Svg width={chartWidth} height={CHART_CONFIG.chartHeight}>
                        {/* 1. 연속 라인 */}
                        {findContinuousSegments(data, dataKey).map((segment, segIndex) => {
                            const pathData = segment.points
                                .map((point, i) => {
                                    const x = getXPosition(point.index);
                                    const y = getYPosition(point.value, maxDisplayValue);
                                    return i === 0 ? `M ${x} ${y}` : `L ${x} ${y}`;
                                })
                                .join(' ');

                            return (
                                <Path
                                    key={segIndex}
                                    d={pathData}
                                    stroke={color}
                                    strokeWidth={1.5}
                                    fill="none"
                                    opacity={0.5}
                                />
                            );
                        })}

                        {/* 2. 점 */}
                        {data.map((week, index) => {
                            const value = week[dataKey];
                            if (value <= 0) return null;

                            const x = getXPosition(index);
                            const y = getYPosition(value, maxDisplayValue);

                            return (
                                <Circle
                                    key={index}
                                    cx={x}
                                    cy={y}
                                    r={CHART_CONFIG.dotRadius}
                                    fill={color}
                                />
                            );
                        })}
                    </Svg>

                    {/* 값 라벨 */}
                    <View style={styles.labelsContainer}>
                        {data.map((week, index) => {
                            const value = week[dataKey];
                            const hasData = value > 0;
                            const y = hasData ? getYPosition(value, maxDisplayValue) : 0;

                            return (
                                <View key={index} style={[styles.labelColumn, { width: CHART_CONFIG.columnWidth }]}>
                                    {hasData && (
                                        <Text
                                            style={[
                                                styles.valueLabel,
                                                { color, top: y - CHART_CONFIG.dotRadius - 14 }
                                            ]}
                                        >
                                            {value}회
                                        </Text>
                                    )}
                                </View>
                            );
                        })}
                    </View>

                    {/* 주 라벨 */}
                    <View style={styles.dateLabelsContainer}>
                        {data.map((week, index) => (
                            <View key={index} style={[styles.labelColumn, { width: CHART_CONFIG.columnWidth }]}>
                                <Text style={styles.dateLabel}>{week.weekLabel}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Card>
    );
}

export default function SummaryWeeklyCharts({
    weeklyChartData,
    weeklyHydrationData,
    scrollViewRef3m1,
    scrollViewRef3m2,
    scrollViewRef3m3,
    scrollViewRef3m4
}: SummaryWeeklyChartsProps) {
    const maxPoopValue = Math.max(...weeklyChartData.map(w => w.poop), 10);
    const maxDiarrheaValue = Math.max(...weeklyChartData.map(w => w.diarrhea), 5);
    const maxVomitValue = Math.max(...weeklyChartData.map(w => w.vomit), 5);

    return (
        <>
            <DotLineChart
                data={weeklyChartData}
                dataKey="poop"
                maxValue={maxPoopValue}
                color={COLORS.primary}
                scrollViewRef={scrollViewRef3m1}
                title="배변 횟수 (주간)"
            />

            <DotLineChart
                data={weeklyChartData}
                dataKey="diarrhea"
                maxValue={maxDiarrheaValue}
                color={COLORS.warning}
                scrollViewRef={scrollViewRef3m2}
                title="설사 횟수 (주간)"
            />

            <DotLineChart
                data={weeklyChartData}
                dataKey="vomit"
                maxValue={maxVomitValue}
                color={COLORS.error}
                scrollViewRef={scrollViewRef3m3}
                title="구토 횟수 (주간)"
            />

            {/* 강수/수액 주간 차트 */}
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>강수 / 수액 (주간)</Text>
                <ScrollView
                    ref={scrollViewRef3m4}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ paddingRight: 20 }}
                >
                    <View style={styles.hydrationChart}>
                        {weeklyHydrationData.map((week, index) => {
                            const total = week.force + week.fluid;
                            const maxWeeklyValue = Math.max(...weeklyHydrationData.map(w => w.force + w.fluid), 500);
                            const hasData = total > 0;
                            return (
                                <View key={index} style={styles.hydrationColumn}>
                                    <Text style={styles.hydrationMlLabel}>
                                        {hasData ? `${total}ml` : ''}
                                    </Text>
                                    <View style={styles.hydrationBarArea}>
                                        {hasData && (
                                            <View style={styles.hydrationBarStack}>
                                                {week.fluid > 0 && (
                                                    <View
                                                        style={[
                                                            styles.hydrationBar,
                                                            styles.barFluid,
                                                            { height: Math.max((week.fluid / maxWeeklyValue) * 60, 2) }
                                                        ]}
                                                    />
                                                )}
                                                {week.force > 0 && (
                                                    <View
                                                        style={[
                                                            styles.hydrationBar,
                                                            styles.barForce,
                                                            { height: Math.max((week.force / maxWeeklyValue) * 60, 2) }
                                                        ]}
                                                    />
                                                )}
                                            </View>
                                        )}
                                    </View>
                                    <Text style={styles.dateLabel}>{week.weekLabel}</Text>
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
    labelsContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
    },
    dateLabelsContainer: {
        flexDirection: 'row',
        marginTop: 4,
    },
    labelColumn: {
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 10,
        fontWeight: '600',
        position: 'absolute',
        textAlign: 'center',
        width: '100%',
        left: 7,
    },
    dateLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    hydrationChart: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 110,
        paddingTop: 10,
    },
    hydrationColumn: {
        alignItems: 'center',
        width: 56,
    },
    hydrationMlLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.indigoDeep,
        marginBottom: 4,
        height: 16,
    },
    hydrationBarArea: {
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    hydrationBar: {
        width: 24,
        borderRadius: 4,
    },
    hydrationBarStack: {
        flexDirection: 'column',
        alignItems: 'center',
    },
    barForce: {
        backgroundColor: COLORS.indigoDeep,
    },
    barFluid: {
        backgroundColor: COLORS.emeraldDeep,
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

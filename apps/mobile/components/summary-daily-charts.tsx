import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { COLORS } from '../constants';
import Card from './card';
import HydrationChart from './hydration-chart';
import type { ChartData, HydrationData } from '../types/chart-types';

interface SummaryDailyChartsProps {
    chartData: ChartData[];
    hydrationData: HydrationData[];
    maxValue: number;
    maxVolValue: number;
    scrollViewRef: React.RefObject<ScrollView | null>;
    scrollViewRef2: React.RefObject<ScrollView | null>;
    scrollViewRef3: React.RefObject<ScrollView | null>;
    scrollViewRef4: React.RefObject<ScrollView | null>;
}

// 연속된 데이터 구간을 찾는 함수
interface ContinuousSegment {
    startIndex: number;
    endIndex: number;
    points: Array<{ index: number; value: number }>;
}

function findContinuousSegments(data: ChartData[], key: 'poop' | 'diarrhea' | 'vomit'): ContinuousSegment[] {
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

// 차트 상수
const CHART_CONFIG = {
    columnWidth: 36,
    chartHeight: 110,
    dotRadius: 6,
    valueAreaHeight: 60,
    topPadding: 20,
};

// Y 좌표 계산 함수 (점과 선 모두 동일하게 사용)
function getYPosition(value: number, maxValue: number): number {
    const normalizedValue = value / maxValue;
    // topPadding에서 시작해서 valueAreaHeight 범위 내에서 위치 계산
    return CHART_CONFIG.chartHeight - CHART_CONFIG.topPadding - (normalizedValue * CHART_CONFIG.valueAreaHeight);
}

function getXPosition(index: number): number {
    return index * CHART_CONFIG.columnWidth + CHART_CONFIG.columnWidth / 2;
}

interface DotLineChartProps {
    data: ChartData[];
    dataKey: 'poop' | 'diarrhea' | 'vomit';
    maxValue: number;
    color: string;
    scrollViewRef: React.RefObject<ScrollView | null>;
    title: string;
}

function DotLineChart({ data, dataKey, maxValue, color, scrollViewRef, title }: DotLineChartProps) {
    const chartWidth = Math.max(data.length * CHART_CONFIG.columnWidth, 300);
    const maxDisplayValue = Math.max(maxValue, 5);

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
                    {data.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>기록이 없습니다.</Text>
                        </View>
                    ) : (
                        <>
                            {/* SVG로 선과 점 그리기 */}
                            <Svg width={chartWidth} height={CHART_CONFIG.chartHeight}>
                                {/* 1. 먼저 연속 라인 그리기 */}
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

                                {/* 2. 그 위에 점 그리기 */}
                                {data.map((day, index) => {
                                    const value = day[dataKey];
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

                            {/* 라벨 (날짜와 값) */}
                            <View style={styles.labelsContainer}>
                                {data.map((day, index) => {
                                    const value = day[dataKey];
                                    const hasData = value > 0;
                                    const y = hasData ? getYPosition(value, maxDisplayValue) : 0;

                                    return (
                                        <View key={index} style={[styles.labelColumn, { width: CHART_CONFIG.columnWidth }]}>
                                            {/* 값 라벨 */}
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

                            {/* 날짜 라벨 */}
                            <View style={styles.dateLabelsContainer}>
                                {data.map((day, index) => (
                                    <View key={index} style={[styles.labelColumn, { width: CHART_CONFIG.columnWidth }]}>
                                        <Text style={styles.dateLabel}>{day.date}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
        </Card>
    );
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
            <DotLineChart
                data={chartData}
                dataKey="poop"
                maxValue={maxValue}
                color={COLORS.primary}
                scrollViewRef={scrollViewRef}
                title="배변 횟수"
            />

            <DotLineChart
                data={chartData}
                dataKey="diarrhea"
                maxValue={maxValue}
                color={COLORS.warning}
                scrollViewRef={scrollViewRef2}
                title="설사 횟수"
            />

            <DotLineChart
                data={chartData}
                dataKey="vomit"
                maxValue={maxValue}
                color={COLORS.error}
                scrollViewRef={scrollViewRef3}
                title="구토 횟수"
            />

            {/* 강수/수액 차트 */}
            {(() => {
                const hydrationChartData = hydrationData.map(day => ({
                    label: day.date,
                    force: day.force,
                    fluid: day.fluid,
                    displayValue: (day.force + day.fluid) > 0 ? `${day.force + day.fluid}ml` : ''
                }));
                const maxHydration = Math.max(maxVolValue, 100);

                return (
                    <HydrationChart
                        data={hydrationChartData}
                        maxValue={maxHydration}
                        title="강수 / 수액"
                        columnWidth={44}
                        barWidth={20}
                        scrollViewRef={scrollViewRef4}
                    />
                );
            })()}
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
        marginBottom: 8,
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

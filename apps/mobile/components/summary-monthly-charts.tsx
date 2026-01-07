import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { COLORS } from '../constants';
import Card from './card';
import HydrationChart from './hydration-chart';
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

// 차트 상수 (6개월 - 월간)
const CHART_CONFIG = {
    columnWidth: 60,
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
    data: MonthlyChartData[];
    dataKey: 'poop' | 'diarrhea' | 'vomit';
    maxValue: number;
    color: string;
    title: string;
}

function DotLineChart({ data, dataKey, maxValue, color, title }: DotLineChartProps) {
    const chartWidth = Math.max(data.length * CHART_CONFIG.columnWidth, 300);
    const maxDisplayValue = Math.max(maxValue, 10);

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
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: 'center',
                }}
            >
                <View style={{ width: data.length <= 5 ? undefined : chartWidth, height: CHART_CONFIG.chartHeight + 40, backgroundColor: 'rgba(0, 0, 0, 0.02)', borderRadius: 8, padding: 8 }}>
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
                        {data.map((month, index) => {
                            const value = month[dataKey];
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
                        {data.map((month, index) => {
                            const value = month[dataKey];
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

                    {/* 월 라벨 */}
                    <View style={styles.dateLabelsContainer}>
                        {data.map((month, index) => (
                            <View key={index} style={[styles.labelColumn, { width: CHART_CONFIG.columnWidth }]}>
                                <Text style={styles.dateLabel}>{month.monthLabel}</Text>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
        </Card>
    );
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

    const maxPoopValue = Math.max(...monthlyChartData.map(m => m.poop), 10);
    const maxDiarrheaValue = Math.max(...monthlyChartData.map(m => m.diarrhea), 10);
    const maxVomitValue = Math.max(...monthlyChartData.map(m => m.vomit), 10);

    return (
        <>
            <DotLineChart
                data={monthlyChartData}
                dataKey="poop"
                maxValue={maxPoopValue}
                color={COLORS.primary}
                title="배변 횟수 (월간)"
            />

            <DotLineChart
                data={monthlyChartData}
                dataKey="diarrhea"
                maxValue={maxDiarrheaValue}
                color={COLORS.warning}
                title="설사 횟수 (월간)"
            />

            <DotLineChart
                data={monthlyChartData}
                dataKey="vomit"
                maxValue={maxVomitValue}
                color={COLORS.error}
                title="구토 횟수 (월간)"
            />

            {/* 강수/수액 월간 차트 */}
            {(() => {
                const hydrationChartData = monthlyHydrationData.map(m => ({
                    label: m.monthLabel,
                    force: m.hasForce ? 10 : 0,
                    fluid: m.hasFluid ? 10 : 0,
                    displayValue: ''
                }));
                const maxHydration = Math.max(...hydrationChartData.map(d => d.force + d.fluid), 10);

                return (
                    <HydrationChart
                        data={hydrationChartData}
                        maxValue={maxHydration}
                        title="강수 / 수액 (월간)"
                        columnWidth={60}
                        barWidth={28}
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
        height: 110,
        paddingTop: 10,
    },
    hydrationColumn: {
        alignItems: 'center',
        width: 60,
    },
    hydrationBarArea: {
        height: 70,
        width: '100%',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    hydrationStack: {
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
    },
    hydrationBar: {
        width: 28,
        height: 22,
        borderRadius: 4,
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

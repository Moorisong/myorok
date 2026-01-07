
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { COLORS } from '../constants';
import Card from './card';

export interface DotLineChartData {
    label: string;
    value: number;
}

interface ContinuousSegment {
    startIndex: number;
    endIndex: number;
    points: Array<{ index: number; value: number }>;
}

// 연속된 데이터 구간을 찾는 함수
function findContinuousSegments(data: DotLineChartData[]): ContinuousSegment[] {
    const segments: ContinuousSegment[] = [];
    let currentSegment: ContinuousSegment | null = null;

    for (let index = 0; index < data.length; index++) {
        const item = data[index];
        const value = item.value;
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

interface DotLineChartProps {
    data: DotLineChartData[];
    maxValue: number;
    color: string;
    title: string;
    scrollViewRef?: React.RefObject<ScrollView | null>;
    columnWidth: number;
    height?: number;
}

export default function DotLineChart({
    data,
    maxValue,
    color,
    title,
    scrollViewRef,
    columnWidth,
    height = 170
}: DotLineChartProps) {
    // 차트 설정
    const CHART_CONFIG = {
        columnWidth: columnWidth,
        chartHeight: height,
        dotRadius: 6,
        valueAreaHeight: height - 50, // 라벨 공간 확보 (200 - 50 = 150)
        topPadding: 20,
    };

    // Y 좌표 계산 함수
    const getYPosition = (value: number, maxVal: number): number => {
        const normalizedValue = value / maxVal;
        return CHART_CONFIG.chartHeight - CHART_CONFIG.topPadding - (normalizedValue * CHART_CONFIG.valueAreaHeight);
    };

    const getXPosition = (index: number): number => {
        return index * CHART_CONFIG.columnWidth + CHART_CONFIG.columnWidth / 2;
    };

    const chartWidth = Math.max(data.length * CHART_CONFIG.columnWidth, 300);
    const maxDisplayValue = Math.max(maxValue, 5); // 최소값 5

    // 데이터가 없는 경우
    if (data.length === 0) {
        return (
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>{title}</Text>
                <View style={[styles.emptyContainer, { height: height + 40 }]}>
                    <Text style={styles.emptyText}>기록이 없습니다.</Text>
                </View>
            </Card>
        );
    }

    const segments = findContinuousSegments(data);

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
                    styles.chartContainer,
                    {
                        width: data.length * columnWidth <= 300 ? undefined : chartWidth,
                        minWidth: data.length * columnWidth <= 300 ? 300 : undefined,
                        paddingHorizontal: data.length * columnWidth <= 300 ? 20 : 0,
                    }
                ]}>
                    <View style={{ height: CHART_CONFIG.chartHeight, width: '100%' }}>
                        {/* 연결선 그리기 */}
                        <Svg style={StyleSheet.absoluteFill}>
                            {segments.map((segment, index) => {
                                let pathData = '';
                                segment.points.forEach((point, i) => {
                                    const x = getXPosition(point.index);
                                    const y = getYPosition(point.value, maxDisplayValue);
                                    if (i === 0) {
                                        pathData += `M ${x} ${y}`;
                                    } else {
                                        pathData += ` L ${x} ${y}`;
                                    }
                                });

                                return (
                                    <Path
                                        key={index}
                                        d={pathData}
                                        stroke={color}
                                        strokeWidth="2"
                                        fill="none"
                                        opacity={0.5}
                                    />
                                );
                            })}
                        </Svg>

                        {/* 데이터 포인트 (원, 수치, 날짜) 그리기 */}
                        {data.map((item, index) => {
                            const value = item.value;
                            const hasData = value > 0;
                            const cx = getXPosition(index);
                            const cy = hasData ? getYPosition(value, maxDisplayValue) : 0;

                            return (
                                <View
                                    key={index}
                                    style={[
                                        styles.columnWrapper,
                                        {
                                            width: CHART_CONFIG.columnWidth,
                                            left: index * CHART_CONFIG.columnWidth
                                        }
                                    ]}
                                >
                                    {/* 점과 수치 (데이터가 있을 때만) */}
                                    {hasData && (
                                        <>
                                            <View
                                                style={[
                                                    styles.dot,
                                                    {
                                                        backgroundColor: color,
                                                        left: (CHART_CONFIG.columnWidth / 2) - CHART_CONFIG.dotRadius,
                                                        top: cy - CHART_CONFIG.dotRadius,
                                                        width: CHART_CONFIG.dotRadius * 2,
                                                        height: CHART_CONFIG.dotRadius * 2,
                                                    }
                                                ]}
                                            />
                                            <Text
                                                style={[
                                                    styles.valueLabel,
                                                    {
                                                        color: color,
                                                        top: cy - 20, // 점 위에 표시
                                                    }
                                                ]}
                                            >
                                                {value}
                                            </Text>
                                        </>
                                    )}

                                    {/* 날짜 라벨 (항상 표시 - 하단 고정) */}
                                    <View style={styles.dateLabelContainer}>
                                        <Text style={styles.dateLabel}>{item.label}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>
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
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 8,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    chartContainer: {
        backgroundColor: 'rgba(0, 0, 0, 0.02)',
        borderRadius: 8,
    },
    columnWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignItems: 'center',
    },
    dot: {
        position: 'absolute',
        borderRadius: 50,
        zIndex: 10,
    },
    valueLabel: {
        position: 'absolute',
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
        width: '100%',
        zIndex: 11,
    },
    dateLabelContainer: {
        position: 'absolute',
        bottom: 8,
        width: '100%',
        alignItems: 'center',
    },
    dateLabel: {
        fontSize: 9,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
});

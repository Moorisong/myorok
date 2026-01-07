import React from 'react';
import { View, Text, StyleSheet, DimensionValue } from 'react-native';

import { COLORS } from '../constants';
import Card from './card';
import type { MedicineRow, Period } from '../types/chart-types';

interface SummaryMedicineChartProps {
    medicineRows: MedicineRow[];
    chartDates: string[];
    period: Period;
}

export default function SummaryMedicineChart({
    medicineRows,
    chartDates,
    period
}: SummaryMedicineChartProps) {
    if (medicineRows.length === 0) {
        return (
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>
                    {period === '15d' ? '최근 15일' :
                        period === '1m' ? '최근 1개월' :
                            period === '3m' ? '최근 3개월' : '전체 기간'} 약/영양제 복용
                </Text>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>복용 기록이 없습니다.</Text>
                </View>
            </Card>
        );
    }

    return (
        <>
            <Card style={styles.card}>
                <Text style={styles.sectionTitle}>
                    {period === '15d' ? '최근 15일' :
                        period === '1m' ? '최근 1개월' :
                            period === '3m' ? '최근 3개월' : '전체 기간'} 약/영양제 복용
                </Text>

                <View style={styles.medicineChartContainer}>
                    {(period === '15d' || period === '1m') && (
                        <>
                            {/* Date Header Row - Fixed 3-point anchor system */}
                            <View style={styles.medHeaderRow}>
                                <View style={styles.medNameHeader} />
                                <View style={styles.medGridFixed}>
                                    <Text style={styles.medDateLabelStart}>
                                        {chartDates[0]}
                                    </Text>
                                    <Text style={styles.medDateLabelCenter}>
                                        {chartDates[Math.floor(chartDates.length / 2)]}
                                    </Text>
                                    <Text style={styles.medDateLabelEnd}>
                                        {chartDates[chartDates.length - 1]}
                                    </Text>
                                </View>
                            </View>

                            {/* Medicine Rows with Fixed Grid */}
                            {medicineRows.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.medRow}>
                                    <View style={styles.medNameCol}>
                                        <Text
                                            style={[styles.medNameText, row.isDeleted && styles.textDeleted]}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {row.name}
                                        </Text>
                                        {row.isDeleted && <Text style={styles.textDeletedSmall}>(삭제)</Text>}
                                    </View>

                                    <View style={styles.medGridFixed}>
                                        {/* Fixed Grid Background - 3 vertical lines for anchor points */}
                                        <View style={styles.gridLineStart} />
                                        <View style={styles.gridLineCenter} />
                                        <View style={styles.gridLineEnd} />

                                        {/* Segments (Bars and Dots) - positioned within fixed grid */}
                                        {row.segments.map((seg, segIndex) => {
                                            const columns = period === '1m' ? 30 : 15;
                                            const cellWidthPercent = 100 / columns;
                                            const leftPercent = seg.startIndex * cellWidthPercent;
                                            const widthPercent = seg.length * cellWidthPercent;

                                            if (seg.type === 'bar') {
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medBarFixed,
                                                            {
                                                                left: `${leftPercent}%` as DimensionValue,
                                                                width: `${widthPercent}%` as DimensionValue
                                                            },
                                                            row.isDeleted && styles.medBarDeleted,
                                                        ]}
                                                    />
                                                );
                                            } else {
                                                // Single dot - center it within its cell
                                                const dotCenterPercent = leftPercent + (cellWidthPercent / 2);
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medDotFixed,
                                                            { left: `${dotCenterPercent}%` as DimensionValue },
                                                            period === '1m' && styles.medDotSmall,
                                                            row.isDeleted && styles.medDotDeleted,
                                                        ]}
                                                    />
                                                );
                                            }
                                        })}
                                    </View>
                                </View>
                            ))}
                        </>
                    )}

                    {period === '3m' && (
                        <>
                            {/* 3개월: 주간 요약 차트 - Opacity 기반 Bar */}
                            {/* 주차 라벨 헤더 */}
                            {medicineRows.length > 0 && medicineRows[0].weekSegments && (
                                <View style={styles.medHeaderRow}>
                                    <View style={styles.medNameHeader} />
                                    <View style={styles.weekDateLabelContainer}>
                                        <Text style={styles.weekDateLabel}>12주 전</Text>
                                        <Text style={[styles.weekDateLabel, styles.weekDateLabelCenter]}>6주 전</Text>
                                        <Text style={[styles.weekDateLabel, styles.weekDateLabelRight]}>이번 주</Text>
                                    </View>
                                </View>
                            )}

                            {medicineRows.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.medRow}>
                                    <View style={styles.medNameCol}>
                                        <Text
                                            style={[styles.medNameText, row.isDeleted && styles.textDeleted]}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {row.name}
                                        </Text>
                                        {row.isDeleted && <Text style={styles.textDeletedSmall}>(삭제)</Text>}
                                    </View>

                                    <View style={styles.weekGridContainer}>
                                        {row.weekSegments?.map((seg, segIndex) => {
                                            // days → opacity 변환
                                            const opacity = seg.days === 0 ? 0 :
                                                seg.days <= 2 ? 0.3 :
                                                    seg.days <= 5 ? 0.6 : 1.0;

                                            return (
                                                <View key={segIndex} style={styles.weekBarWrapper}>
                                                    {seg.days > 0 && (
                                                        <View
                                                            style={[
                                                                styles.weekBar,
                                                                { opacity },
                                                                row.isDeleted && styles.weekBarDeleted,
                                                            ]}
                                                        />
                                                    )}
                                                </View>
                                            );
                                        })}
                                    </View>
                                </View>
                            ))}

                            {/* 범례 */}
                            <View style={styles.weekLegendContainer}>
                                <Text style={styles.weekLegendText}>
                                    막대 농도: 1~2일(연) · 3~5일(중) · 6~7일(진)
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </Card>

            <Text style={styles.hint}>
                💡 이 화면을 병원에서 보여주세요. {"\n"}
                {period === '3m' ? (
                    <>약/영양제 차트는 최근 3개월 기준이며, {"\n"}막대 색이 진할수록 해당 주에 자주 복용했음을 의미합니다.</>
                ) : (
                    <>약/영양제 차트는 {period === '15d' ? '최근 15일' : '최근 1개월'} 기준이며, {"\n"}연속된 날짜는 막대(Bar), 하루 복용은 점(Dot)으로 표시됩니다.</>
                )}
            </Text>

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
    medicineChartContainer: {
        marginTop: 8,
        paddingBottom: 8,
    },
    medHeaderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    medNameHeader: {
        width: 85,
    },
    medRow: {
        flexDirection: 'row',
        height: 36,
        alignItems: 'center',
        marginBottom: 4,
    },
    medNameCol: {
        width: 85,
        paddingRight: 8,
        justifyContent: 'center',
    },
    medNameText: {
        fontSize: 11,
        color: COLORS.textPrimary,
    },
    textDeleted: {
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through',
    },
    textDeletedSmall: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    medGridFixed: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        height: 36,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 8,
    },
    medDateLabelStart: {
        position: 'absolute',
        left: 0,
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'left',
    },
    medDateLabelCenter: {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -15 }],
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'center',
        width: 30,
    },
    medDateLabelEnd: {
        position: 'absolute',
        right: 0,
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    gridLineStart: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: COLORS.borderLight,
    },
    gridLineCenter: {
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: COLORS.borderLight,
    },
    gridLineEnd: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: COLORS.borderLight,
    },
    medBarFixed: {
        position: 'absolute',
        height: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        top: '50%',
        marginTop: -6,
    },
    medBarDeleted: {
        backgroundColor: COLORS.border,
    },
    medDotFixed: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        top: '50%',
        marginTop: -4,
        marginLeft: -4,
    },
    medDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: -3,
        marginLeft: -3,
    },
    medDotDeleted: {
        backgroundColor: COLORS.border,
    },
    hint: {
        marginHorizontal: 16,
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 100,
    },
    // 3개월 주간 요약 차트 스타일 (Bar + Opacity 기반)
    weekGridContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
        marginRight: 8,
    },
    weekDateLabelContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 8,
    },
    weekDateLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    weekDateLabelCenter: {
        textAlign: 'center',
    },
    weekDateLabelRight: {
        textAlign: 'right',
    },
    weekBarWrapper: {
        flex: 1,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekBar: {
        width: '90%',
        height: 12,
        borderRadius: 6,
        backgroundColor: COLORS.primary,
    },
    weekBarDeleted: {
        backgroundColor: COLORS.border,
    },
    weekLegendContainer: {
        marginTop: 8,
        alignItems: 'flex-end',
    },
    weekLegendText: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
});

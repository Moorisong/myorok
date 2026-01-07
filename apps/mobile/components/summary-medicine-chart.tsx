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
                            period === '3m' ? '최근 3개월' :
                                period === '6m' ? '최근 6개월' : '전체 기간'} 약/영양제 복용
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
                            period === '3m' ? '최근 3개월' :
                                period === '6m' ? '최근 6개월' : '전체 기간'} 약/영양제 복용
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

                                    {/* Fixed Grid Area */}
                                    <View style={styles.medGridFixed}>
                                        {/* Grid Lines */}
                                        <View style={styles.gridLineStart} />
                                        <View style={styles.gridLineCenter} />
                                        <View style={styles.gridLineEnd} />

                                        {/* Segments */}
                                        {row.segments.map((seg, segIndex) => {
                                            // Calculate position based on 15d grid (0-14)
                                            // 100% width = 15 days (or 30 for 1m)
                                            // But standardizing on index based positioning
                                            const totalSlots = chartDates.length; // 15 or 30
                                            const slotWidthPercent = 100 / totalSlots;

                                            const left = `${seg.startIndex * slotWidthPercent}%` as DimensionValue;
                                            const width = `${seg.length * slotWidthPercent}%` as DimensionValue;

                                            if (seg.type === 'bar') {
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medBarFixed,
                                                            { left, width },
                                                            row.isDeleted && styles.medBarDeleted
                                                        ]}
                                                    />
                                                );
                                            } else {
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medDotFixed,
                                                            { left: left as DimensionValue },
                                                            row.isDeleted && styles.medDotDeleted
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
                                        {Array.from({ length: 12 }).map((_, i) => (
                                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                                {i === 0 && (
                                                    <Text style={[styles.weekDateLabel, { position: 'absolute', width: 60, textAlign: 'center' }]}>
                                                        12주 전
                                                    </Text>
                                                )}
                                                {i === 6 && (
                                                    <Text style={[styles.weekDateLabel, { position: 'absolute', width: 60, textAlign: 'center' }]}>
                                                        6주 전
                                                    </Text>
                                                )}
                                                {i === 11 && (
                                                    <Text style={[styles.weekDateLabel, { position: 'absolute', width: 60, textAlign: 'center' }]}>
                                                        이번 주
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
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
                                            let opacity = 0;
                                            if (seg.days >= 6) opacity = 1.0;
                                            else if (seg.days >= 3) opacity = 0.6;
                                            else if (seg.days >= 1) opacity = 0.3;

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

                    {period === '6m' && (
                        <>
                            {/* 6개월: 월간 요약 차트 */}
                            {/* 월 라벨 헤더 */}
                            {medicineRows.length > 0 && medicineRows[0].monthSegments && (
                                <View style={styles.medHeaderRow}>
                                    <View style={styles.medNameHeader} />
                                    <View style={styles.weekDateLabelContainer}>
                                        {medicineRows[0].monthSegments?.map((seg, i) => (
                                            <View key={i} style={{ flex: 1, alignItems: 'center' }}>
                                                {(i === 0 || i === 3 || i === 5) && (
                                                    <Text style={[styles.weekDateLabel, { position: 'absolute', width: 40, textAlign: 'center' }]}>
                                                        {seg.label}
                                                    </Text>
                                                )}
                                            </View>
                                        ))}
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
                                        {row.monthSegments?.map((seg, segIndex) => {
                                            // days → opacity 변환
                                            const opacity = seg.days === 0 ? 0 :
                                                seg.days <= 10 ? 0.3 :
                                                    seg.days <= 20 ? 0.6 : 1.0;

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
                                    막대 농도: 1~10일(연) · 11~20일(중) · 21일+(진)
                                </Text>
                            </View>
                        </>
                    )}
                </View>
            </Card>

            <Text style={styles.hint}>
                💡 이 화면을 병원에서 보여주세요. {"\n"}
                {period === '6m' ? (
                    <>약/영양제 차트는 최근 6개월 기준이며, {"\n"}막대 색이 진할수록 해당 월에 자주 복용했음을 의미합니다.</>
                ) : period === '3m' ? (
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
        marginTop: 24,
        paddingBottom: 8,
    },
    medHeaderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    medNameHeader: {
        width: 70, // Reduced from 85 for 3m/6m layout
    },
    medRow: {
        flexDirection: 'row',
        height: 36,
        alignItems: 'center',
        marginBottom: 4,
    },
    medNameCol: {
        width: 70, // Reduced from 85
        paddingRight: 4,
        justifyContent: 'center',
    },
    medNameText: {
        fontSize: 12,
        color: COLORS.textPrimary,
    },
    textDeleted: {
        color: COLORS.border,
        textDecorationLine: 'line-through',
    },
    textDeletedSmall: {
        fontSize: 10,
        color: COLORS.border,
    },
    medGridFixed: {
        flex: 1,
        position: 'relative',
        height: '100%',
    },
    medDateLabelStart: {
        position: 'absolute',
        left: 0,
        fontSize: 10,
        color: COLORS.textSecondary,
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
    // 3개월/6개월 요약 차트 스타일
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
        alignItems: 'center',
        marginRight: 8,
        gap: 2,
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
    // Old dot styles for safety if referenced (partially removed but kept wrapper)
    weekSegmentItem: {
        flex: 1,
        alignItems: 'center',
    },
    weekDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
    weekDotDeleted: {
        backgroundColor: COLORS.border,
    }
});

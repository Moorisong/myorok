import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { COLORS } from '../constants';
import Card from './card';
import type { OverallSummaryData } from '../types/chart-types';

interface SummaryOverallCardsProps {
    overallSummary: OverallSummaryData;
}

export default function SummaryOverallCards({ overallSummary }: SummaryOverallCardsProps) {
    return (
        <>
            {/* 기록 기간 카드 */}
            <Card style={styles.card}>
                <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardIcon}>📅</Text>
                    <Text style={styles.summaryCardTitle}>기록 기간</Text>
                </View>
                <Text style={styles.summaryDateRange}>
                    {overallSummary.firstRecordDate.replace(/-/g, '.')} ~ {overallSummary.lastRecordDate.replace(/-/g, '.')}
                </Text>
                <Text style={styles.summarySubtext}>
                    (총 {overallSummary.totalDays.toLocaleString()}일)
                </Text>
            </Card>

            {/* 증상 요약 카드 */}
            <Card style={styles.card}>
                <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardIcon}>🏥</Text>
                    <Text style={styles.summaryCardTitle}>증상 요약</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>구토:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.totalVomit.toLocaleString()}회</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>설사:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.diarrheaDays.toLocaleString()}일</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>평균 배변:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.avgPoop}회 / 일</Text>
                </View>
            </Card>

            {/* 강수/수액 요약 카드 */}
            <Card style={styles.card}>
                <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardIcon}>💧</Text>
                    <Text style={styles.summaryCardTitle}>강수 / 수액 요약</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>강수:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.totalForce.toLocaleString()}ml</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>수액:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.totalFluid.toLocaleString()}ml</Text>
                </View>
                <View style={[styles.summaryStatRow, styles.summaryStatRowHighlight]}>
                    <Text style={styles.summaryStatLabel}>총 투여량:</Text>
                    <Text style={styles.summaryStatValueLarge}>
                        {(overallSummary.totalForce + overallSummary.totalFluid).toLocaleString()}ml
                    </Text>
                </View>
            </Card>

            {/* 관리 밀도 카드 */}
            <Card style={styles.card}>
                <View style={styles.summaryCardHeader}>
                    <Text style={styles.summaryCardIcon}>📊</Text>
                    <Text style={styles.summaryCardTitle}>관리 요약</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>기록된 날:</Text>
                    <Text style={styles.summaryStatValue}>{overallSummary.recordedDays.toLocaleString()}일</Text>
                </View>
                <View style={styles.summaryStatRow}>
                    <Text style={styles.summaryStatLabel}>기록률:</Text>
                    <Text style={[
                        styles.summaryStatValue,
                        overallSummary.recordingRate >= 70 && styles.summaryStatValueGood,
                        overallSummary.recordingRate < 50 && styles.summaryStatValueWarning
                    ]}>{overallSummary.recordingRate}%</Text>
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
    summaryCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryCardIcon: {
        fontSize: 22,
        marginRight: 10,
    },
    summaryCardTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    summaryDateRange: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        textAlign: 'center',
        marginBottom: 4,
    },
    summarySubtext: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    summaryStatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.lightGray,
    },
    summaryStatRowHighlight: {
        backgroundColor: `${COLORS.primary}10`,
        borderRadius: 8,
        paddingHorizontal: 8,
        marginTop: 8,
        borderBottomWidth: 0,
    },
    summaryStatLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        flex: 1,
    },
    summaryStatValue: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    summaryStatValueLarge: {
        fontSize: 17,
        fontWeight: '700',
        color: COLORS.primary,
    },
    summaryStatValueGood: {
        color: COLORS.primary,
    },
    summaryStatValueWarning: {
        color: COLORS.warning,
    },
    bottomPadding: {
        height: 100,
    },
});

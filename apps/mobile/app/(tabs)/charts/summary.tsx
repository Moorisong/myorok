import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import {
    Header,
    Card,
    SummaryOverallCards
} from '../../../components';
import SummaryCharts from '../../../components/summary-charts';
import { useSummaryChart } from '../../../hooks/use-summary-chart';
import type { Period } from '../../../types/chart-types';

export default function SummaryChartScreen() {
    const {
        // State
        period,
        isLoading,
        chartData,
        hydrationData,
        maxValue,
        maxVolValue,
        overallSummary,
        weeklyChartData,
        weeklyHydrationData,
        monthlyChartData,
        monthlyHydrationData,

        // Refs
        scrollViewRef,
        scrollViewRef2,
        scrollViewRef3,
        scrollViewRef4,
        scrollViewRef3m1,
        scrollViewRef3m2,
        scrollViewRef3m3,
        scrollViewRef3m4,

        // Handlers
        handlePeriodChange
    } = useSummaryChart();

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="병원용 요약 차트" showBack />

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {(['15d', '1m', '3m', '6m', 'all'] as Period[]).map((p) => (
                    <Pressable
                        key={p}
                        style={[
                            styles.periodButton,
                            period === p && styles.periodButtonSelected
                        ]}
                        onPress={() => handlePeriodChange(p)}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            period === p && styles.periodButtonTextSelected
                        ]}>
                            {p === '15d' ? '15일' : p === '1m' ? '1개월' : p === '3m' ? '3개월' : p === '6m' ? '6개월' : '전체'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView
                style={styles.content}
                contentContainerStyle={styles.scrollContent}
            >
                {/* 전체 기간: 요약 카드 표시 */}
                {period === 'all' && overallSummary ? (
                    <SummaryOverallCards overallSummary={overallSummary} />
                ) : period === 'all' ? (
                    <Card style={styles.card}>
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>기록이 없습니다.</Text>
                        </View>
                    </Card>
                ) : (
                    <SummaryCharts
                        period={period}
                        chartData={chartData}
                        hydrationData={hydrationData}
                        maxValue={maxValue}
                        maxVolValue={maxVolValue}
                        weeklyChartData={weeklyChartData}
                        weeklyHydrationData={weeklyHydrationData}
                        monthlyChartData={monthlyChartData}
                        monthlyHydrationData={monthlyHydrationData}
                        scrollViewRefs={{
                            daily: [scrollViewRef, scrollViewRef2, scrollViewRef3, scrollViewRef4],
                            weekly: [scrollViewRef3m1, scrollViewRef3m2, scrollViewRef3m3, scrollViewRef3m4]
                        }}
                    />
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
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
    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.background,
        gap: 8,
    },
    periodButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    periodButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    periodButtonText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    periodButtonTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    scrollContent: {
        paddingBottom: 100,
    },
});

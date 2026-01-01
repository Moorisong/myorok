import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../../constants';

interface SummaryStatsCardProps {
    metricName: string;
    unit?: string | null;
    min: number;
    max: number;
    avg: number;
    count: number;
    firstDate: string | null;
    lastDate: string | null;
    trend?: 'up' | 'down' | 'stable';
}

export default function SummaryStatsCard({
    metricName,
    unit,
    min,
    max,
    avg,
    count,
    firstDate,
    lastDate,
    trend,
}: SummaryStatsCardProps) {
    const formatDate = (date: string | null) => {
        if (!date) return '-';
        return date.replace(/-/g, '.');
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'up':
                return <Feather name="trending-up" size={20} color={COLORS.error} />;
            case 'down':
                return <Feather name="trending-down" size={20} color={COLORS.primary} />;
            case 'stable':
            default:
                return <Feather name="minus" size={20} color={COLORS.textSecondary} />;
        }
    };

    return (
        <View style={styles.container}>
            <Text style={styles.title}>
                {metricName} 요약
                {unit && <Text style={styles.unit}> ({unit})</Text>}
            </Text>

            <View style={styles.periodRow}>
                <Text style={styles.periodText}>
                    {formatDate(firstDate)} ~ {formatDate(lastDate)}
                </Text>
                <Text style={styles.countText}>총 {count}건</Text>
            </View>

            <View style={styles.statsRow}>
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>최소</Text>
                    <Text style={styles.statValue}>{min}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>평균</Text>
                    <Text style={[styles.statValue, styles.avgValue]}>{avg}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                    <Text style={styles.statLabel}>최대</Text>
                    <Text style={styles.statValue}>{max}</Text>
                </View>
            </View>

            {trend && (
                <View style={styles.trendRow}>
                    {getTrendIcon()}
                    <Text style={styles.trendText}>
                        {trend === 'up' ? '증가 추세' : trend === 'down' ? '감소 추세' : '유지 중'}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    unit: {
        fontWeight: '400',
        color: COLORS.textSecondary,
    },
    periodRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    periodText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    countText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
    },
    statBox: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 1,
        height: 32,
        backgroundColor: COLORS.border,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    avgValue: {
        color: COLORS.primary,
    },
    trendRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        gap: 6,
    },
    trendText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
});

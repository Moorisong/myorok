import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../../constants';

export type PeriodOption = '1w' | '1m' | '3m' | '6m' | '1y' | 'all';

interface PeriodSelectorProps {
    selected: PeriodOption;
    onSelect: (period: PeriodOption) => void;
}

const PERIODS: { key: PeriodOption; label: string }[] = [
    { key: '1w', label: '1주' },
    { key: '1m', label: '1개월' },
    { key: '3m', label: '3개월' },
    { key: '6m', label: '6개월' },
    { key: '1y', label: '1년' },
    { key: 'all', label: '전체' },
];

export function getDateRangeForPeriod(period: PeriodOption): { startDate: string; endDate: string } {
    const now = new Date();
    const endDate = now.toISOString().split('T')[0];

    let startDate: string;

    switch (period) {
        case '1w':
            now.setDate(now.getDate() - 7);
            startDate = now.toISOString().split('T')[0];
            break;
        case '1m':
            now.setMonth(now.getMonth() - 1);
            startDate = now.toISOString().split('T')[0];
            break;
        case '3m':
            now.setMonth(now.getMonth() - 3);
            startDate = now.toISOString().split('T')[0];
            break;
        case '6m':
            now.setMonth(now.getMonth() - 6);
            startDate = now.toISOString().split('T')[0];
            break;
        case '1y':
            now.setFullYear(now.getFullYear() - 1);
            startDate = now.toISOString().split('T')[0];
            break;
        case 'all':
        default:
            startDate = '1900-01-01'; // Effectively "all"
            break;
    }

    return { startDate, endDate };
}

export default function PeriodSelector({ selected, onSelect }: PeriodSelectorProps) {
    return (
        <View style={styles.container}>
            {PERIODS.map(({ key, label }) => (
                <Pressable
                    key={key}
                    style={[
                        styles.chip,
                        selected === key && styles.chipSelected,
                    ]}
                    onPress={() => onSelect(key)}
                >
                    <Text
                        style={[
                            styles.chipText,
                            selected === key && styles.chipTextSelected,
                        ]}
                    >
                        {label}
                    </Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    chipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    chipText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    chipTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
});

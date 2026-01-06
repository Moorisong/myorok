import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface MetricCardProps {
    label: string;
    value: number | string;
    unit: '명' | '원' | '%' | '대';
    highlight?: boolean;
}

export function MetricCard({ label, value, unit, highlight }: MetricCardProps) {
    const formattedValue = formatValue(value, unit);

    return (
        <View style={[styles.container, highlight && styles.highlight]}>
            <Text style={styles.label}>{label}</Text>
            <View style={styles.valueContainer}>
                <Text style={[styles.value, highlight && styles.highlightText]}>
                    {formattedValue}
                </Text>
                <Text style={styles.unit}>{unit}</Text>
            </View>
        </View>
    );
}

function formatValue(value: number | string, unit: string): string {
    if (typeof value === 'string') {
        return value;
    }

    if (unit === '원') {
        // 천 단위 콤마
        return value.toLocaleString('ko-KR');
    }

    if (unit === '%') {
        // 소수점 1자리 + % 기호는 이미 표시
        return value.toFixed(1);
    }

    // 명, 대 - 천 단위 콤마
    return value.toLocaleString('ko-KR');
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    highlight: {
        borderColor: COLORS.primary,
        borderWidth: 2,
    },
    label: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 8,
    },
    valueContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    value: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: 4,
    },
    highlightText: {
        color: COLORS.primary,
    },
    unit: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
});

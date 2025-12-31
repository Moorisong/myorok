import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS } from '../../constants';

export type SubscriptionStatusType = 'trial' | 'active' | 'expired';

interface SubscriptionStatusProps {
    status: SubscriptionStatusType;
    daysRemaining?: number;
    expiryDate?: string;
    onSubscribe?: () => void;
}

/**
 * 구독 상태 표시 컴포넌트
 * - trial: "무료 체험 중 (N일 남음)"
 * - active: "구독 중 (YYYY-MM-DD까지)"
 * - expired: "구독 만료" + 결제 유도 버튼
 */
export function SubscriptionStatus({
    status,
    daysRemaining,
    expiryDate,
    onSubscribe,
}: SubscriptionStatusProps) {
    const getStatusConfig = () => {
        switch (status) {
            case 'trial':
                return {
                    label: '무료 체험 중',
                    description: daysRemaining !== undefined ? `${daysRemaining}일 남음` : '',
                    color: COLORS.primary,
                    showButton: false,
                };
            case 'active':
                return {
                    label: '구독 중',
                    description: expiryDate ? `${formatDate(expiryDate)}까지` : '',
                    color: COLORS.primary,
                    showButton: false,
                };
            case 'expired':
                return {
                    label: '구독 만료',
                    description: '구독을 갱신해주세요',
                    color: COLORS.error,
                    showButton: true,
                };
            default:
                return {
                    label: '알 수 없음',
                    description: '',
                    color: COLORS.textSecondary,
                    showButton: false,
                };
        }
    };

    const config = getStatusConfig();

    return (
        <View style={styles.container}>
            <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: config.color }]} />
                <Text style={styles.statusLabel}>{config.label}</Text>
                {config.description && (
                    <Text style={styles.statusDescription}>({config.description})</Text>
                )}
            </View>

            {config.showButton && onSubscribe && (
                <TouchableOpacity
                    style={styles.subscribeButton}
                    onPress={onSubscribe}
                    activeOpacity={0.8}
                >
                    <Text style={styles.subscribeButtonText}>구독하기</Text>
                </TouchableOpacity>
            )}
        </View>
    );
}

function formatDate(dateString: string): string {
    try {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } catch {
        return dateString;
    }
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 12,
        padding: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    statusDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginLeft: 8,
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        paddingVertical: 12,
        marginTop: 12,
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});

export default SubscriptionStatus;

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { COLORS } from '../constants';

interface TrialBannerProps {
    daysRemaining: number;
    onPress?: () => void;
}

export default function TrialBanner({ daysRemaining, onPress }: TrialBannerProps) {
    if (daysRemaining <= 0) return null;

    const getMessage = () => {
        if (daysRemaining === 1) {
            return '무료 체험이 내일 종료돼요';
        }
        return `무료 체험 D-${daysRemaining}`;
    };

    const isUrgent = daysRemaining <= 1;

    return (
        <Pressable
            style={[styles.container, isUrgent && styles.containerUrgent]}
            onPress={onPress}
        >
            <View style={styles.content}>
                <Text style={styles.emoji}>⏰</Text>
                <View style={styles.textContainer}>
                    <Text style={styles.message}>{getMessage()}</Text>
                    {isUrgent && (
                        <Text style={styles.submessage}>
                            계속 사용하려면 구독이 필요해요
                        </Text>
                    )}
                </View>
            </View>
            {onPress && (
                <Text style={styles.action}>구독하기 →</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.primary + '15',
        borderRadius: 12,
        padding: 14,
        marginHorizontal: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.primary + '40',
    },
    containerUrgent: {
        backgroundColor: '#FFB300' + '15',
        borderColor: '#FFB300',
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    emoji: {
        fontSize: 20,
        marginRight: 10,
    },
    textContainer: {
        flex: 1,
    },
    message: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    submessage: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    action: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
        marginTop: 6,
        textAlign: 'right',
    },
});

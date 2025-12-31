import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface SubscriptionBlockScreenProps {
    visible: boolean;
    onDismiss?: () => void; // Optional: Only for preview/dev mode
}

export default function SubscriptionBlockScreen({ visible, onDismiss }: SubscriptionBlockScreenProps) {
    const router = useRouter();

    if (!visible) return null;

    const handleSubscribe = () => {
        router.push('/(tabs)/settings/pro');
    };

    return (
        <View style={styles.overlay}>
            <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
                {onDismiss && (
                    <Pressable style={styles.closeButton} onPress={onDismiss} hitSlop={20}>
                        <Feather name="x" size={24} color={COLORS.textSecondary} />
                    </Pressable>
                )}

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.iconContainer}>
                        <Feather name="lock" size={64} color={COLORS.primary} />
                    </View>

                    <Text style={styles.title}>무료 체험이 종료되었습니다</Text>

                    <Text style={styles.message}>
                        기록한 데이터는 안전하게 보관 중이에요.{'\n'}
                        구독하면 바로 다시 확인할 수 있어요.
                    </Text>

                    <View style={styles.featureBox}>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureEmoji}>📝</Text>
                            <Text style={styles.featureText}>모든 기록 데이터 안전 보관</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureEmoji}>📊</Text>
                            <Text style={styles.featureText}>전체 기간 차트 확인</Text>
                        </View>
                        <View style={styles.featureItem}>
                            <Text style={styles.featureEmoji}>🏥</Text>
                            <Text style={styles.featureText}>병원용 차트</Text>
                        </View>
                    </View>

                    <Pressable style={styles.subscribeButton} onPress={handleSubscribe}>
                        <Text style={styles.subscribeButtonText}>구독하기</Text>
                        <Text style={styles.priceText}>월 3,500원</Text>
                    </Pressable>

                    <Text style={styles.priceSubtext}>
                        하루 100원도 안 되는 반려동물 기록
                    </Text>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.background,
        zIndex: 9999,
    },
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    featureBox: {
        width: '100%',
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 32,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
    },
    featureEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    featureText: {
        fontSize: 15,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    subscribeButton: {
        width: '100%',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 8,
    },
    subscribeButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    priceText: {
        fontSize: 14,
        color: '#FFFFFF',
        marginTop: 4,
        opacity: 0.9,
    },
    priceSubtext: {
        fontSize: 13,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
});

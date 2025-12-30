import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card, Button } from '../../../components';

const FEATURES = [
    { emoji: '📊', title: '전체 기간 차트', description: '과거 기록까지 모두 확인' },
    { emoji: '🏥', title: '병원용 차트', description: '진료 시 보여줄 수 있는 전문 차트' },
    { emoji: '📈', title: '무제한 커스텀 수치', description: '혈액검사 수치를 무제한으로 추적' },
    { emoji: '☁️', title: '클라우드 백업', description: '안전한 데이터 보관' },
];

export default function ProScreen() {
    const router = useRouter();

    const handlePurchase = () => {
        // TODO: In-App Purchase
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>Pro 업그레이드</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>⭐</Text>
                    <Text style={styles.heroTitle}>묘록 Pro</Text>
                    <Text style={styles.heroSubtitle}>
                        아이의 소중한 기록을{'\n'}완벽하게 관리하세요
                    </Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.infoTitle}>📦 이미 데이터는 저장되어 있습니다</Text>
                    <Text style={styles.infoText}>
                        무료 플랜에서 기록한 모든 데이터는 15일이 지나도 삭제되지 않습니다.
                        Pro를 구매하시면 과거 데이터를 바로 확인하실 수 있습니다.
                    </Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.featuresTitle}>Pro 기능</Text>
                    {FEATURES.map((feature, index) => (
                        <View key={index} style={styles.featureItem}>
                            <Text style={styles.featureEmoji}>{feature.emoji}</Text>
                            <View style={styles.featureContent}>
                                <Text style={styles.featureTitle}>{feature.title}</Text>
                                <Text style={styles.featureDescription}>{feature.description}</Text>
                            </View>
                        </View>
                    ))}
                </Card>

                <View style={styles.priceBox}>
                    <Text style={styles.priceLabel}>평생 이용</Text>
                    <Text style={styles.price}>₩9,900</Text>
                    <Text style={styles.priceNote}>1회 결제, 구독 아님</Text>
                </View>

                <Button
                    title="Pro 구매하기"
                    onPress={handlePurchase}
                    style={styles.purchaseButton}
                />

                <Text style={styles.disclaimer}>
                    구매 시 Google Play 계정으로 결제됩니다.
                </Text>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    content: {
        flex: 1,
    },
    hero: {
        alignItems: 'center',
        paddingVertical: 24,
    },
    heroEmoji: {
        fontSize: 60,
        marginBottom: 12,
    },
    heroTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    heroSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    infoTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.primary,
        marginBottom: 8,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    featuresTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    featureItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    featureEmoji: {
        fontSize: 24,
        marginRight: 14,
    },
    featureContent: {
        flex: 1,
    },
    featureTitle: {
        fontSize: 15,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    featureDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    priceBox: {
        alignItems: 'center',
        marginTop: 32,
        paddingVertical: 24,
    },
    priceLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    price: {
        fontSize: 36,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    priceNote: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    purchaseButton: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    disclaimer: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 12,
    },
    bottomPadding: {
        height: 40,
    },
});

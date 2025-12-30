import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';

export default function AboutScreen() {
    const router = useRouter();

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
                <Text style={styles.headerTitle}>앱 정보</Text>
                <View style={styles.placeholder} />
            </View>

            <ScrollView style={styles.content}>
                <View style={styles.hero}>
                    <Text style={styles.heroEmoji}>🐱</Text>
                    <Text style={styles.heroTitle}>묘록</Text>
                    <Text style={styles.heroVersion}>v1.0.0</Text>
                </View>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>앱 소개</Text>
                    <Text style={styles.text}>
                        묘록은 반려묘의 건강 기록을 장기간 누적하여 관리할 수 있는 앱입니다.
                        {'\n\n'}
                        집사의 실제 사용 흐름에 맞춰 설계되었으며,
                        병원 진료 시 수의사 선생님께 바로 보여드릴 수 있는 차트 기능을 제공합니다.
                    </Text>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>데이터 정책</Text>
                    <View style={styles.policyItem}>
                        <Text style={styles.policyEmoji}>💾</Text>
                        <Text style={styles.policyText}>
                            모든 기록은 기기에 안전하게 저장됩니다
                        </Text>
                    </View>
                    <View style={styles.policyItem}>
                        <Text style={styles.policyEmoji}>🔒</Text>
                        <Text style={styles.policyText}>
                            데이터는 삭제되지 않습니다
                        </Text>
                    </View>
                    <View style={styles.policyItem}>
                        <Text style={styles.policyEmoji}>📱</Text>
                        <Text style={styles.policyText}>
                            서버 없이도 앱이 동작합니다
                        </Text>
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>문의</Text>
                    <Text style={styles.text}>
                        버그 신고, 기능 제안, 기타 문의사항은{'\n'}
                        아래 이메일로 연락 주세요.
                    </Text>
                    <Text style={styles.email}>support@myorok.app</Text>
                </Card>

                <Text style={styles.footer}>
                    Made with 💚 for cats
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
        marginBottom: 4,
    },
    heroVersion: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    text: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 22,
    },
    policyItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    policyEmoji: {
        fontSize: 20,
        marginRight: 12,
    },
    policyText: {
        fontSize: 14,
        color: COLORS.textPrimary,
        flex: 1,
    },
    email: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '600',
        marginTop: 12,
    },
    footer: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 32,
    },
    bottomPadding: {
        height: 40,
    },
});

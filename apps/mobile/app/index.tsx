import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '../constants';

export default function HomeScreen() {
    const router = useRouter();

    // 임시 데이터 (나중에 DB 연동)
    const todayStats = {
        pee: 0,
        poop: 0,
        diarrhea: 0,
        vomit: 0,
    };

    const today = new Date();
    const dateString = `${today.getMonth() + 1}월 ${today.getDate()}일`;
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayString = dayNames[today.getDay()];

    return (
        <View style={styles.container}>
            <View style={styles.dateContainer}>
                <Text style={styles.dateText}>{dateString}</Text>
                <Text style={styles.dayText}>{dayString}요일</Text>
            </View>

            <View style={styles.summaryCard}>
                <Text style={styles.cardTitle}>오늘의 기록</Text>

                <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>💧</Text>
                        <Text style={styles.statLabel}>오줌</Text>
                        <Text style={styles.statValue}>{todayStats.pee}회</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>💩</Text>
                        <Text style={styles.statLabel}>똥</Text>
                        <Text style={styles.statValue}>{todayStats.poop}회</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>🚨</Text>
                        <Text style={styles.statLabel}>설사</Text>
                        <Text style={styles.statValue}>{todayStats.diarrhea}회</Text>
                    </View>

                    <View style={styles.statItem}>
                        <Text style={styles.statEmoji}>🤮</Text>
                        <Text style={styles.statLabel}>구토</Text>
                        <Text style={styles.statValue}>{todayStats.vomit}회</Text>
                    </View>
                </View>
            </View>

            <Pressable
                style={({ pressed }) => [
                    styles.recordButton,
                    pressed && styles.recordButtonPressed,
                ]}
                onPress={() => router.push('/today')}
            >
                <Text style={styles.recordButtonText}>오늘 기록하기</Text>
            </Pressable>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: COLORS.background,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 24,
    },
    dateText: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginRight: 8,
    },
    dayText: {
        fontSize: 18,
        color: COLORS.textSecondary,
    },
    summaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statEmoji: {
        fontSize: 28,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 2,
    },
    statValue: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    recordButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
    },
    recordButtonPressed: {
        opacity: 0.8,
    },
    recordButtonText: {
        color: COLORS.surface,
        fontSize: 18,
        fontWeight: '600',
    },
});

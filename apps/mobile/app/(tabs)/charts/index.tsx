import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';
import { useSelectedPet } from '../../../hooks/use-selected-pet';

export default function ChartsScreen() {
    const router = useRouter();
    const { selectedPet } = useSelectedPet();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView style={styles.container}>
                {/* Pet Indicator */}
                <View style={styles.petIndicatorRow}>
                    <View style={styles.petIndicator}>
                        <Text style={styles.petName} numberOfLines={1}>{selectedPet?.name || ''}</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>차트</Text>
                    <Text style={styles.headerSubtitle}>기록의 추이를 한눈에 확인하세요</Text>
                </View>

                <Pressable
                    style={({ pressed }) => pressed && styles.pressed}
                    onPress={() => router.push('/(tabs)/charts/summary')}
                >
                    <Card style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Text style={styles.emoji}>🏥</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>병원용 요약 차트</Text>
                            <Text style={styles.cardDescription}>
                                배변/구토 추이 + 약 복용 기간을 한 화면에
                            </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </Card>
                </Pressable>

                <Pressable
                    style={({ pressed }) => pressed && styles.pressed}
                    onPress={() => router.push('/(tabs)/charts/custom')}
                >
                    <Card style={styles.card}>
                        <View style={styles.cardIcon}>
                            <Text style={styles.emoji}>📈</Text>
                        </View>
                        <View style={styles.cardContent}>
                            <Text style={styles.cardTitle}>커스텀 수치 차트</Text>
                            <Text style={styles.cardDescription}>
                                혈액검사 등 직접 입력한 수치의 변화 추이
                            </Text>
                        </View>
                        <Text style={styles.arrow}>›</Text>
                    </Card>
                </Pressable>

                <View style={styles.infoBox}>
                    <Text style={styles.infoText}>
                        💡 차트 데이터는 기록 탭에서 입력한 내용을 기반으로 자동 생성됩니다.
                    </Text>
                </View>

                <View style={styles.bottomPadding} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
    },
    header: {
        padding: 20,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.7,
    },
    cardIcon: {
        width: 50,
        height: 50,
        borderRadius: 12,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    emoji: {
        fontSize: 24,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    cardDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    arrow: {
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    infoBox: {
        marginHorizontal: 16,
        marginTop: 24,
        padding: 16,
        backgroundColor: `${COLORS.primary}15`,
        borderRadius: 12,
    },
    infoText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 32,
    },
    petIndicatorRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    petIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        maxWidth: 100,
    },
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});

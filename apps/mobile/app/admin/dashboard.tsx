import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MetricCard } from '../../components/MetricCard';
import { COLORS } from '../../constants';
import { CONFIG } from '../../constants/config';

interface DashboardData {
    kpi: {
        activeSubscriptions: number;
        monthlyRevenue: number;
        growthRate: number;
    };
    conversion: {
        trialUsers: number;
        conversionRate: number;
    };
    secondary: {
        totalDevices: number;
        newDevices7Days: number;
    };
}

export default function AdminDashboard() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setLoading(true);
            setError(null);

            const token = await AsyncStorage.getItem('jwt_token');
            if (!token) {
                setError('로그인이 필요합니다');
                return;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/api/admin/dashboard`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setError('접근 권한이 없습니다');
                } else {
                    setError('데이터를 불러오는데 실패했습니다');
                }
                return;
            }

            const dashboardData: DashboardData = await response.json();
            setData(dashboardData);
        } catch (err) {
            console.error('[Dashboard] Load failed:', err);
            setError('데이터를 불러오는 중 오류가 발생했습니다');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <Stack.Screen
                options={{
                    title: '운영자 대시보드',
                    headerBackTitle: '설정',
                }}
            />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.scrollContent}
            >
                {loading && (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <Text style={styles.loadingText}>데이터 로딩 중...</Text>
                    </View>
                )}

                {error && (
                    <View style={styles.errorContainer}>
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                )}

                {data && !loading && !error && (
                    <>
                        <Section title="핵심 지표 (KPI)">
                            <MetricCard
                                label="유효 구독 수"
                                value={data.kpi.activeSubscriptions}
                                unit="명"
                                highlight
                            />
                            <MetricCard
                                label="월 매출 (MRR)"
                                value={data.kpi.monthlyRevenue}
                                unit="원"
                                highlight
                            />
                            <MetricCard
                                label="지난달 대비 증감률"
                                value={data.kpi.growthRate}
                                unit="%"
                            />
                        </Section>

                        <Section title="전환 지표">
                            <MetricCard
                                label="체험 사용자"
                                value={data.conversion.trialUsers}
                                unit="명"
                            />
                            <MetricCard
                                label="전환율 (trial → active)"
                                value={data.conversion.conversionRate}
                                unit="%"
                            />
                        </Section>

                        <Section title="보조 지표">
                            <MetricCard
                                label="총 기기"
                                value={data.secondary.totalDevices}
                                unit="대"
                            />
                            <MetricCard
                                label="신규 기기 (7일)"
                                value={data.secondary.newDevices7Days}
                                unit="대"
                            />
                        </Section>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>{title}</Text>
            {children}
        </View>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
        padding: 16,
        paddingTop: 32,
    },
    scrollContent: {
        paddingBottom: 40,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    errorText: {
        fontSize: 16,
        color: COLORS.error,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
});

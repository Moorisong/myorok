import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getLast7DaysRecords, getRecentDailyRecords, DailyRecord } from '../../../services/dailyRecords';
import { getRecentSupplementHistory } from '../../../services/supplements';
import { getRecentFluidHistory, FluidRecord } from '../../../services/fluidRecords';

type Period = '15d' | '1m' | '3m' | 'all';

interface ChartData {
    date: string;
    poop: number;
    diarrhea: number;
    vomit: number;
}

interface HydrationData {
    date: string;
    water: number;
    force: number;
    fluid: number;
}

interface MedicineDisplay {
    name: string;
    startDate: string;
    endDate: string;
}

export default function SummaryChartScreen() {
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [hydrationData, setHydrationData] = useState<HydrationData[]>([]);
    const [medicineList, setMedicineList] = useState<MedicineDisplay[]>([]);
    const [maxValue, setMaxValue] = useState(5);
    const [maxVolValue, setMaxVolValue] = useState(100);

    // v1.2 State
    const [period, setPeriod] = useState<Period>('15d');
    const [isPro, setIsPro] = useState(false); // Mock Pro Status

    useFocusEffect(
        useCallback(() => {
            loadData(period);
        }, [period])
    );

    const getDaysFromPeriod = (p: Period) => {
        switch (p) {
            case '15d': return 15;
            case '1m': return 30;
            case '3m': return 90;
            case 'all': return 365; // or more
            default: return 15;
        }
    };

    const loadData = async (currentPeriod: Period) => {
        try {
            const days = getDaysFromPeriod(currentPeriod);

            const records = await getRecentDailyRecords(days);
            const medicines = await getRecentSupplementHistory(days);
            const fluids = await getRecentFluidHistory(days);

            // Process Chart Data
            const processedData = records.map(r => ({
                date: r.date.substring(5).replace('-', '/'),
                poop: r.poopCount,
                diarrhea: r.diarrheaCount,
                vomit: r.vomitCount
            }));

            // Process Hydration Data
            // We need to merge daily records (water) and fluid records (force/fluid)
            // Create a map for the last 7 days (based on records which has the dates)
            const hydrationMap = new Map<string, { water: number, force: number, fluid: number }>();

            // Initialize with dates from daily records (which covers last 7 days)
            records.forEach(r => {
                hydrationMap.set(r.date, {
                    water: 0, // Request to hide voluntary water
                    force: 0,
                    fluid: 0
                });
            });

            // Add fluids
            fluids.forEach(f => {
                if (hydrationMap.has(f.date)) {
                    const current = hydrationMap.get(f.date)!;
                    if (f.fluidType === 'force') {
                        current.force += (f.volume || 0);
                    } else {
                        current.fluid += (f.volume || 0);
                    }
                }
            });

            const processedHydration = Array.from(hydrationMap.entries()).map(([date, data]) => ({
                date: date.substring(5).replace('-', '/'),
                ...data
            })).sort((a, b) => a.date.localeCompare(b.date));

            // Calculate Max Values
            const maxVal = Math.max(...processedData.map(d => d.poop + d.diarrhea + d.vomit), 5);
            const maxVol = Math.max(...processedHydration.map(d => d.water + d.force + d.fluid), 100); // Min 100ml scale

            setChartData(processedData);
            setHydrationData(processedHydration);
            setMaxValue(maxVal);
            setMaxVolValue(maxVol);

            // Process Medicine Data
            const medMap = new Map<string, { name: string, dates: string[] }>();
            medicines.forEach(m => {
                if (!medMap.has(m.name)) {
                    medMap.set(m.name, { name: m.name, dates: [] });
                }
                medMap.get(m.name)?.dates.push(m.date);
            });

            // Flatten to ranges (Simplified logic: just show recent activity or separate blocks)
            // For now, let's just show the last taken date or range if continuous
            const displayMeds: MedicineDisplay[] = [];
            medMap.forEach((value) => {
                value.dates.sort();
                // Simple logic: Start to End of all existing records in period
                if (value.dates.length > 0) {
                    displayMeds.push({
                        name: value.name,
                        startDate: value.dates[0].substring(5).replace('-', '/'),
                        endDate: value.dates[value.dates.length - 1].substring(5).replace('-', '/')
                    });
                }
            });
            setMedicineList(displayMeds);

        } catch (error) {
            console.error('Error loading summary chart data:', error);
        }
    };

    const handlePeriodChange = (newPeriod: Period) => {
        if (!isPro && newPeriod !== '15d') {
            // Simple alert for now, in real app this would open paywall
            alert('전체 기간 조회는 Pro 버전에서 가능합니다.\n(임시: Pro 모드가 활성화됩니다)');
            setIsPro(true); // Auto-upgrade for testing as per request "Show UX"
            setPeriod(newPeriod);
            return;
        }
        setPeriod(newPeriod);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="병원용 요약 차트" showBack />

            {/* Period Selector */}
            <View style={styles.periodSelector}>
                {(['15d', '1m', '3m', 'all'] as Period[]).map((p) => (
                    <Pressable
                        key={p}
                        style={[
                            styles.periodButton,
                            period === p && styles.periodButtonSelected
                        ]}
                        onPress={() => handlePeriodChange(p)}
                    >
                        <Text style={[
                            styles.periodButtonText,
                            period === p && styles.periodButtonTextSelected
                        ]}>
                            {p === '15d' ? '15일' : p === '1m' ? '1개월' : p === '3m' ? '3개월' : '전체'}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {period === '15d' ? '최근 15일' :
                            period === '1m' ? '최근 1개월' :
                                period === '3m' ? '최근 3개월' : '전체 기간'} 기록
                    </Text>

                    {/* 간단한 바 차트 */}
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.chart, { width: Math.max(chartData.length * 40, 300) }]}>
                            {chartData.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>해당 기간에 기록이 없습니다.</Text>
                                </View>
                            ) : (
                                chartData.map((day, index) => (
                                    <View key={index} style={styles.barContainer}>
                                        <View style={styles.barWrapper}>
                                            {day.vomit > 0 && (
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        styles.barVomit,
                                                        { height: (day.vomit / maxValue) * 100 },
                                                    ]}
                                                />
                                            )}
                                            {day.diarrhea > 0 && (
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        styles.barDiarrhea,
                                                        { height: (day.diarrhea / maxValue) * 100 },
                                                    ]}
                                                />
                                            )}
                                            {day.poop > 0 && (
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        styles.barPoop,
                                                        { height: (day.poop / maxValue) * 100 },
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.barLabel}>{day.date?.split?.('/')[2] || ''}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>

                    {/* 범례 */}
                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.barPoop]} />
                            <Text style={styles.legendText}>배변</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.barDiarrhea]} />
                            <Text style={styles.legendText}>묽은 변</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.barVomit]} />
                            <Text style={styles.legendText}>구토</Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {period === '15d' ? '최근 15일' :
                            period === '1m' ? '최근 1개월' :
                                period === '3m' ? '최근 3개월' : '전체 기간'} 강수/수액
                    </Text>

                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        <View style={[styles.chart, { width: Math.max(hydrationData.length * 40, 300) }]}>
                            {hydrationData.length === 0 ? (
                                <View style={styles.emptyContainer}>
                                    <Text style={styles.emptyText}>기록이 없습니다.</Text>
                                </View>
                            ) : (
                                hydrationData.map((day, index) => (
                                    <View key={index} style={styles.barContainer}>
                                        <View style={styles.barWrapper}>
                                            {/* Stacked Bars: Fluid (Top), Force (Middle) - Water removed */}
                                            {day.fluid > 0 && (
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        styles.barFluid,
                                                        { height: (day.fluid / maxVolValue) * 100 },
                                                    ]}
                                                />
                                            )}
                                            {day.force > 0 && (
                                                <View
                                                    style={[
                                                        styles.bar,
                                                        styles.barForce,
                                                        { height: (day.force / maxVolValue) * 100 },
                                                    ]}
                                                />
                                            )}
                                        </View>
                                        <Text style={styles.barLabel}>{day.date?.split?.('/')[2] || ''}</Text>
                                        <Text style={styles.volLabel}>
                                            {day.fluid + day.force > 0 ? day.fluid + day.force : ''}
                                        </Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>

                    <View style={styles.legend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.barForce]} />
                            <Text style={styles.legendText}>강수</Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendColor, styles.barFluid]} />
                            <Text style={styles.legendText}>수액</Text>
                        </View>
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {period === '15d' ? '최근 15일' :
                            period === '1m' ? '최근 1개월' :
                                period === '3m' ? '최근 3개월' : '전체 기간'} 약/영양제 복용
                    </Text>
                    {medicineList.length === 0 ? (
                        <Text style={styles.emptyText}>복용 기록이 없습니다.</Text>
                    ) : (
                        medicineList.map((med, index) => (
                            <View key={index} style={styles.medicineItem}>
                                <Text style={styles.medicineName}>💊 {med.name}</Text>
                                <Text style={styles.medicinePeriod}>
                                    {med.startDate} {med.startDate !== med.endDate ? `~${med.endDate} ` : ''}
                                </Text>
                            </View>
                        ))
                    )}
                </Card>

                <Text style={styles.hint}>
                    💡 이 화면을 병원에서 보여주세요. 수의사 선생님이 증상 추이를 한눈에 파악할 수 있습니다.
                </Text>

                <View style={styles.bottomPadding} />
            </ScrollView >
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    chart: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 140,
        paddingTop: 20,
    },
    barContainer: {
        alignItems: 'center',
        flex: 1,
    },
    barWrapper: {
        height: 100,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    bar: {
        width: 20,
        borderRadius: 4,
        marginBottom: 2,
    },
    barPoop: {
        backgroundColor: COLORS.primary,
    },
    barDiarrhea: {
        backgroundColor: COLORS.warning,
    },
    barVomit: {
        backgroundColor: COLORS.error,
    },
    barWater: {
        backgroundColor: '#60A5FA', // Blue
    },
    barForce: {
        backgroundColor: '#818CF8', // Indigo
    },
    barFluid: {
        backgroundColor: '#34D399', // Emerald
    },
    barLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 8,
    },
    volLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
        marginTop: 2,
        height: 14,
    },
    legend: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendColor: {
        width: 12,
        height: 12,
        borderRadius: 3,
        marginRight: 6,
    },
    legendText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    medicineItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    medicineName: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    medicinePeriod: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    hint: {
        marginHorizontal: 16,
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    bottomPadding: {
        height: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    periodSelector: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.background,
        gap: 8,
    },
    periodButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    periodButtonSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    periodButtonText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    periodButtonTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
});

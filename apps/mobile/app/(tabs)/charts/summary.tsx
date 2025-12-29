import { View, Text, StyleSheet, ScrollView, Pressable, DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';

import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { getLast7DaysRecords, getRecentDailyRecords, DailyRecord } from '../../../services/dailyRecords';
import { getRecentSupplementHistory } from '../../../services/supplements';
import { getRecentFluidHistory, FluidRecord } from '../../../services/fluidRecords';
import { useSelectedPet } from '../../../hooks/use-selected-pet';

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

// v1.2: Medicine Chart - Timeline Segment
interface MedicineSegment {
    type: 'bar' | 'dot';
    startIndex: number; // 0 to 14 (relative to current view window)
    length: number;     // 1 for dot, >=2 for bar
    dateLabel?: string; // For dot hover/display?
}

interface MedicineRow {
    name: string;
    isDeleted: boolean;
    segments: MedicineSegment[];
}

export default function SummaryChartScreen() {
    const { selectedPetId } = useSelectedPet();
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [hydrationData, setHydrationData] = useState<HydrationData[]>([]);

    // Medicine Chart State
    const [medicineRows, setMedicineRows] = useState<MedicineRow[]>([]);
    const [chartDates, setChartDates] = useState<string[]>([]); // Formatted M/D for column headers

    const [maxValue, setMaxValue] = useState(5);
    const [maxVolValue, setMaxVolValue] = useState(100);

    // v1.2 State
    const [period, setPeriod] = useState<Period>('15d');
    const [isPro, setIsPro] = useState(false); // Mock Pro Status

    useFocusEffect(
        useCallback(() => {
            loadData(period);
        }, [period, selectedPetId])
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
            const chartDays = 15; // Medicine chart is fixed to 15 days for now regardless of period selection (per spec "Last 15 days")? 
            // Spec says "Last 15 days intake display". Let's assume it always shows last 15 days even if global filter is different, 
            // or maybe it follows global filter but visualization is optimized for 15.
            // For now, let's sync global period fetching data but Medicine Chart might need specific handling if period > 15d.
            // Spec says "Area Name: Recent 15 Days Medicine Intake". So it implies it's always last 15 days.

            // Calculate date range for chart columns
            const today = new Date();
            const dates: string[] = [];
            const dateObjs: string[] = []; // YYYY-MM-DD for matching

            // Generate last 15 days (D-14 to D)
            for (let i = 14; i >= 0; i--) {
                const d = new Date();
                d.setDate(today.getDate() - i);
                const mm = String(d.getMonth() + 1); // No pad for display
                const dd = String(d.getDate());      // No pad
                dates.push(`${mm}/${dd}`);

                const yyyy = d.getFullYear();
                const mmPad = String(d.getMonth() + 1).padStart(2, '0');
                const ddPad = String(d.getDate()).padStart(2, '0');
                dateObjs.push(`${yyyy}-${mmPad}-${ddPad}`);
            }
            setChartDates(dates);

            const records = await getRecentDailyRecords(days);
            const medicines = await getRecentSupplementHistory(Math.max(days, 15)); // Ensure we have at least 15 days for meds
            const fluids = await getRecentFluidHistory(days);

            // Process Chart Data
            const processedData = records.map(r => ({
                date: r.date.substring(5).replace('-', '/'),
                poop: r.poopCount,
                diarrhea: r.diarrheaCount,
                vomit: r.vomitCount
            }));

            // Process Hydration Data
            const hydrationMap = new Map<string, { water: number, force: number, fluid: number }>();
            records.forEach(r => {
                hydrationMap.set(r.date, {
                    water: 0,
                    force: 0,
                    fluid: 0
                });
            });

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
            const maxVol = Math.max(...processedHydration.map(d => d.water + d.force + d.fluid), 100);

            setChartData(processedData);
            setHydrationData(processedHydration);
            setMaxValue(maxVal);
            setMaxVolValue(maxVol);

            // --- Process Medicine Data (Timeline) ---
            const medMap = new Map<string, { isDeleted: boolean, takenMap: Map<string, boolean> }>();

            // 1. Group by Medicine Name
            medicines.forEach(m => {
                // Determine display name
                let name = m.name;
                let isDeleted = false;

                // Check if name contains "(삭제된 항목)" or logic from service
                // The service adds '(삭제된 항목)' suffix if joined supplement is null (deleted)
                // But currently hardcoded string check isn't ideal if name itself has it. 
                // Assuming service contract: name is "Name (삭제된 항목)" or "Name".
                if (m.name.includes('(삭제된 항목)')) {
                    name = m.name.replace('(삭제된 항목)', '').trim();
                    isDeleted = true;
                }
                // Also check if supplementId resolves to a deleted item via previous join logic
                // For now relying on name suffix from service query.

                if (!medMap.has(name)) {
                    medMap.set(name, { isDeleted, takenMap: new Map() });
                }

                // Mark date as taken
                if (m.taken === 1) {
                    medMap.get(name)?.takenMap.set(m.date, true);
                }
            });

            // 2. Build Rows & Segments
            const rows: MedicineRow[] = [];

            medMap.forEach((data, name) => {
                const segments: MedicineSegment[] = [];
                let currentSegment: { start: number, length: number } | null = null;

                // Iterate through the 15 chart columns (dateObjs)
                for (let i = 0; i < dateObjs.length; i++) {
                    const date = dateObjs[i];
                    const isTaken = data.takenMap.has(date);

                    if (isTaken) {
                        if (currentSegment) {
                            // Continue segment
                            currentSegment.length++;
                        } else {
                            // Start new segment
                            currentSegment = { start: i, length: 1 };
                        }
                    } else {
                        // Gap encountered
                        if (currentSegment) {
                            // End existing segment -> determine type
                            segments.push({
                                type: currentSegment.length >= 2 ? 'bar' : 'dot',
                                startIndex: currentSegment.start,
                                length: currentSegment.length,
                                dateLabel: dates[currentSegment.start] // Simplified label
                            });
                            currentSegment = null;
                        }
                    }
                }

                // Close open segment at the end
                if (currentSegment) {
                    segments.push({
                        type: currentSegment.length >= 2 ? 'bar' : 'dot',
                        startIndex: currentSegment.start,
                        length: currentSegment.length,
                        dateLabel: dates[currentSegment.start]
                    });
                }

                rows.push({
                    name,
                    isDeleted: data.isDeleted,
                    segments
                });
            });

            setMedicineRows(rows);

        } catch (error) {
            console.error('Error loading summary chart data:', error);
        }
    };

    const handlePeriodChange = (newPeriod: Period) => {
        if (!isPro && newPeriod !== '15d') {
            alert('전체 기간 조회는 Pro 버전에서 가능합니다.\n(임시: Pro 모드가 활성화됩니다)');
            setIsPro(true);
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

                    {/* Basic Bar Chart */}
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

                    {/* Legend */}
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
                    <Text style={styles.sectionTitle}>최근 15일 약/영양제 복용</Text>

                    {medicineRows.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>복용 기록이 없습니다.</Text>
                        </View>
                    ) : (
                        <View style={styles.medicineChartContainer}>
                            {/* Date Header Row */}
                            <View style={styles.medHeaderRow}>
                                <View style={styles.medNameHeader} />
                                <View style={styles.medGrid}>
                                    {chartDates.map((date, i) => (
                                        <View key={i} style={styles.medGridCol}>
                                            <Text style={styles.medDateLabel}>{date.split('/')[1]}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Medicine Rows */}
                            {medicineRows.map((row, rowIndex) => (
                                <View key={rowIndex} style={styles.medRow}>
                                    <View style={styles.medNameCol}>
                                        <Text
                                            style={[styles.medNameText, row.isDeleted && styles.textDeleted]}
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                        >
                                            {row.name}
                                        </Text>
                                        {row.isDeleted && <Text style={styles.textDeletedSmall}>(삭제)</Text>}
                                    </View>

                                    <View style={styles.medGrid}>
                                        {/* Background Grid Lines */}
                                        {chartDates.map((_, i) => (
                                            <View key={`grid-${i}`} style={styles.medGridColLine} />
                                        ))}

                                        {/* Segments (Bars and Dots) */}
                                        {row.segments.map((seg, segIndex) => {
                                            // Calculate position
                                            const cellWidth = 100 / 15; // Percent width per cell
                                            const left = `${seg.startIndex * cellWidth}%`;
                                            const width = `${seg.length * cellWidth}%`;

                                            if (seg.type === 'bar') {
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medBar,
                                                            { left: left as DimensionValue, width: width as DimensionValue },
                                                            row.isDeleted && styles.medBarDeleted
                                                        ]}
                                                    />
                                                );
                                            } else {
                                                // Dot (Center in the cell)
                                                // width is 1 cell width
                                                // We want to center a dot inside this cell
                                                return (
                                                    <View
                                                        key={segIndex}
                                                        style={[
                                                            styles.medDotContainer,
                                                            { left: left as DimensionValue, width: width as DimensionValue }
                                                        ]}
                                                    >
                                                        <View style={[
                                                            styles.medDot,
                                                            row.isDeleted && styles.medDotDeleted
                                                        ]} />
                                                    </View>
                                                );
                                            }
                                        })}
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
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

                <Text style={styles.hint}>
                    💡 이 화면을 병원에서 보여주세요. {"\n"}
                    약/영양제 차트는 최근 15일 기준이며, {"\n"}
                    연속된 날짜는 막대(Bar), 하루 복용은 점(Dot)으로 표시됩니다.
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
    hint: {
        marginHorizontal: 16,
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 32,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        paddingVertical: 20,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
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
    // Medicine Chart Styles
    medicineChartContainer: {
        marginTop: 8,
        paddingBottom: 8,
    },
    medHeaderRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    medNameHeader: {
        width: 80,
    },
    medGrid: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
    },
    medGridCol: {
        flex: 1,
        alignItems: 'center',
    },
    medDateLabel: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    medRow: {
        flexDirection: 'row',
        height: 36,
        alignItems: 'center',
        marginBottom: 4,
    },
    medNameCol: {
        width: 80,
        paddingRight: 8,
        justifyContent: 'center',
    },
    medNameText: {
        fontSize: 12,
        color: COLORS.textPrimary,
    },
    textDeleted: {
        color: COLORS.textSecondary,
        textDecorationLine: 'line-through',
    },
    textDeletedSmall: {
        fontSize: 10,
        color: COLORS.textSecondary,
    },
    medGridColLine: {
        flex: 1,
        borderLeftWidth: 1,
        borderLeftColor: '#F0F0F0', // Very light info grid
        height: '100%',
    },
    medBar: {
        position: 'absolute',
        height: 14, // Bar Height
        backgroundColor: COLORS.primary, // Green bar for meds
        borderRadius: 7,
        top: 11, // Center in 36px height
    },
    medBarDeleted: {
        backgroundColor: COLORS.border,
    },
    medDotContainer: {
        position: 'absolute',
        height: '100%' as DimensionValue,
        justifyContent: 'center',
        alignItems: 'center',
    },
    medDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
    },
    medDotDeleted: {
        backgroundColor: COLORS.border,
    }
});

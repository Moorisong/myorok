import { View, Text, StyleSheet, ScrollView, Pressable, DimensionValue } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';

import { useCallback, useState, useRef, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { getRecentDailyRecords } from '../../../services/dailyRecords';
import { getRecentSupplementHistory } from '../../../services/supplements';
import { getRecentFluidHistory } from '../../../services/fluidRecords';
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

// v1.3: Pro Features
interface WeekSegment {
    weekIndex: number;
    count: number;
    type: 'thick' | 'thin' | 'dot' | 'none';
    label: string; // e.g. "3rd week of Mar"
}

interface MedicineSummary {
    startDate: string;
    endDate: string;
    totalDays: number;
    avgFreq: string; // "Weekly 4.2 times"
}

interface MedicineRow {
    name: string;
    isDeleted: boolean;
    segments: MedicineSegment[];    // For 15d, 1m
    weekSegments?: WeekSegment[];   // For 3m
    summary?: MedicineSummary;      // For all
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
    const [isLoading, setIsLoading] = useState(false);

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
            // Clear previous data to prevent flash of old data during period transition
            setIsLoading(true);
            setMedicineRows([]);

            // Determine days for data fetching based on period
            let daysToFetch = 15;
            let chartColumns = 15;

            if (currentPeriod === '1m') {
                daysToFetch = 30;
                chartColumns = 30;
            } else if (currentPeriod === '3m') {
                daysToFetch = 90;
                chartColumns = 12; // Approx 12-13 weeks, handled dynamically
            } else if (currentPeriod === 'all') {
                daysToFetch = 365; // Fetch enough history for summary
                chartColumns = 0;
            }

            // Sync hydration/daily record fetch days with period (Max 365 for now)
            const days = getDaysFromPeriod(currentPeriod);

            // Calculate date range for chart columns (15d / 1m only)
            const today = new Date();
            const dates: string[] = [];
            const dateObjs: string[] = [];

            if (currentPeriod === '15d' || currentPeriod === '1m') {
                for (let i = chartColumns - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(today.getDate() - i);
                    const mm = String(d.getMonth() + 1);
                    const dd = String(d.getDate());
                    dates.push(`${mm}/${dd}`);

                    const yyyy = d.getFullYear();
                    const mmPad = String(d.getMonth() + 1).padStart(2, '0');
                    const ddPad = String(d.getDate()).padStart(2, '0');
                    dateObjs.push(`${yyyy}-${mmPad}-${ddPad}`);
                }
            } else if (currentPeriod === '3m') {
                // For 3m, we need week labels? 
                // Let's generate last 12 weeks labels
                for (let i = 11; i >= 0; i--) {
                    dates.push(`W-${i}`); // Simplified labels for now, or use Month
                }
            }

            setChartDates(dates);

            const records = await getRecentDailyRecords(days);
            const medicines = await getRecentSupplementHistory(Math.max(days, daysToFetch));
            const fluids = await getRecentFluidHistory(days);

            // Process Chart Data (Daily Records - Fill empty dates)
            const recordMap = new Map<string, typeof records[0]>();
            records.forEach(r => {
                console.log('[ChartDebug] DB Record:', r.date, r);
                recordMap.set(r.date, r);
            });
            console.log('[ChartDebug] Period:', currentPeriod, 'DateObjs:', dateObjs);

            const processedData: ChartData[] = [];

            // 날짜 배열(chartDates)을 기준으로 데이터 매핑 (없으면 0)
            if (currentPeriod === '15d' || currentPeriod === '1m') {
                for (let i = 0; i < dateObjs.length; i++) {
                    const dateStr = dateObjs[i];
                    const record = recordMap.get(dateStr);

                    processedData.push({
                        date: dates[i], // "MM/DD"
                        poop: record?.poopCount || 0,
                        diarrhea: record?.diarrheaCount || 0,
                        vomit: record?.vomitCount || 0
                    });
                }
            } else if (currentPeriod === '3m') {
                // 3개월은 주(Week) 단위 집계가 필요할 수 있으나, 일단은 기존 records를 모두 표시하거나
                // 날짜를 모두 채우면 너무 많으니(90개), 기존 방식을 유지하되 데이터가 있는 날만 표시?
                // 아니면 3개월도 일별로 보여주되 스크롤하게 할까?
                // 기획상 3개월은 'Week' 단위가 아님 (약은 Week지만, 배변/수분은 일별 로그일 수 있음)
                // 일단 90일치를 다 생성해서 스크롤되게 합니다.

                // 3m일 때 dateObjs를 생성하지 않았으므로 여기서 생성
                const todayDate = new Date();
                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(todayDate.getDate() - i);

                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    const displayDate = `${Number(mm)}/${Number(dd)}`;

                    const record = recordMap.get(dateStr);
                    processedData.push({
                        date: displayDate,
                        poop: record?.poopCount || 0,
                        diarrhea: record?.diarrheaCount || 0,
                        vomit: record?.vomitCount || 0
                    });
                }
            } else {
                // All: 데이터가 너무 많으므로 있는 데이터만 표시 (기존 유지)
                records.forEach(r => {
                    processedData.push({
                        date: r.date.substring(5).replace('-', '/'),
                        poop: r.poopCount,
                        diarrhea: r.diarrheaCount,
                        vomit: r.vomitCount
                    });
                });
            }

            // Process Hydration Data (Fill empty dates strictly aligned with dateObjs)
            const hydrationMap = new Map<string, { water: number, force: number, fluid: number }>();

            // 1. Populate map with actual data first
            records.forEach(r => {
                if (!hydrationMap.has(r.date)) {
                    hydrationMap.set(r.date, { water: 0, force: 0, fluid: 0 });
                }
                const current = hydrationMap.get(r.date)!;
                current.water += r.waterIntake || 0;
            });

            fluids.forEach(f => {
                if (!hydrationMap.has(f.date)) {
                    hydrationMap.set(f.date, { water: 0, force: 0, fluid: 0 });
                }
                const current = hydrationMap.get(f.date)!;
                if (f.fluidType === 'force') {
                    current.force += (f.volume || 0);
                } else {
                    current.fluid += (f.volume || 0);
                }
            });

            const processedHydration: HydrationData[] = [];

            // 2. Iterate dateObjs (or dates list) to ensure perfect alignment and filling
            if (currentPeriod === '15d' || currentPeriod === '1m') {
                for (let i = 0; i < dateObjs.length; i++) {
                    const dateStr = dateObjs[i];
                    const data = hydrationMap.get(dateStr) || { water: 0, force: 0, fluid: 0 };

                    processedHydration.push({
                        date: dates[i], // "MM/DD"
                        ...data
                    });
                }
            } else if (currentPeriod === '3m') {
                // Re-generate dates for 3m if needed (same as processedData logic)
                const todayDate = new Date();
                for (let i = days - 1; i >= 0; i--) {
                    const d = new Date();
                    d.setDate(todayDate.getDate() - i);

                    const yyyy = d.getFullYear();
                    const mm = String(d.getMonth() + 1).padStart(2, '0');
                    const dd = String(d.getDate()).padStart(2, '0');
                    const dateStr = `${yyyy}-${mm}-${dd}`;
                    const displayDate = `${Number(mm)}/${Number(dd)}`;

                    const data = hydrationMap.get(dateStr) || { water: 0, force: 0, fluid: 0 };

                    processedHydration.push({
                        date: displayDate,
                        ...data
                    });
                }
            } else {
                // All: Sort by date string key
                const sortedKeys = Array.from(hydrationMap.keys()).sort();
                sortedKeys.forEach(key => {
                    const data = hydrationMap.get(key)!;
                    processedHydration.push({
                        date: key.substring(5).replace('-', '/'),
                        ...data
                    });
                });
            }

            // Calculate Max Values
            const maxVal = Math.max(...processedData.map(d => d.poop + d.diarrhea + d.vomit), 5);
            const maxVol = Math.max(...processedHydration.map(d => d.water + d.force + d.fluid), 100);

            setChartData(processedData);
            setHydrationData(processedHydration);
            setMaxValue(maxVal);
            setMaxVolValue(maxVol);

            // --- Process Medicine Data (Adaptive) ---
            const medMap = new Map<string, { isDeleted: boolean, takenMap: Map<string, boolean>, allDates: string[] }>();

            medicines.forEach(m => {
                let name = m.name;
                let isDeleted = false;
                if (m.name.includes('(삭제된 항목)')) {
                    name = m.name.replace('(삭제된 항목)', '').trim();
                    isDeleted = true;
                }

                if (!medMap.has(name)) {
                    medMap.set(name, { isDeleted, takenMap: new Map(), allDates: [] });
                }

                const entry = medMap.get(name)!;
                if (m.taken === 1) {
                    entry.takenMap.set(m.date, true);
                    entry.allDates.push(m.date);
                }
            });

            const rows: MedicineRow[] = [];

            medMap.forEach((data, name) => {
                const row: MedicineRow = {
                    name,
                    isDeleted: data.isDeleted,
                    segments: [],
                    weekSegments: [],
                    summary: undefined
                };

                if (currentPeriod === '15d' || currentPeriod === '1m') {
                    // Timeline Logic
                    const segments: MedicineSegment[] = [];
                    let currentSegment: { start: number, length: number } | null = null;

                    for (let i = 0; i < dateObjs.length; i++) {
                        const date = dateObjs[i];
                        const isTaken = data.takenMap.has(date);

                        if (isTaken) {
                            if (currentSegment) {
                                currentSegment.length++;
                            } else {
                                currentSegment = { start: i, length: 1 };
                            }
                        } else {
                            if (currentSegment) {
                                segments.push({
                                    type: currentSegment.length >= 2 ? 'bar' : 'dot',
                                    startIndex: currentSegment.start,
                                    length: currentSegment.length,
                                    dateLabel: dates[currentSegment.start]
                                });
                                currentSegment = null;
                            }
                        }
                    }
                    if (currentSegment) {
                        segments.push({
                            type: currentSegment.length >= 2 ? 'bar' : 'dot',
                            startIndex: currentSegment.start,
                            length: currentSegment.length,
                            dateLabel: dates[currentSegment.start]
                        });
                    }
                    row.segments = segments;

                } else if (currentPeriod === '3m') {
                    // Week Aggregation Logic
                    const weekSegments: WeekSegment[] = [];
                    // Process last 12 weeks (approx 84 days)
                    for (let i = 11; i >= 0; i--) {
                        // Define week range: today - (i*7 + 6) to today - (i*7)
                        const weekStart = new Date();
                        weekStart.setDate(today.getDate() - (i * 7 + 6));
                        const weekEnd = new Date();
                        weekEnd.setDate(today.getDate() - (i * 7));

                        let count = 0;
                        // Iterate days in this week
                        for (let d = 0; d < 7; d++) {
                            const checkDate = new Date(weekStart);
                            checkDate.setDate(weekStart.getDate() + d);
                            // Format YYYY-MM-DD
                            const y = checkDate.getFullYear();
                            const m = String(checkDate.getMonth() + 1).padStart(2, '0');
                            const dayStr = String(checkDate.getDate()).padStart(2, '0');
                            if (data.takenMap.has(`${y}-${m}-${dayStr}`)) {
                                count++;
                            }
                        }

                        let type: 'thick' | 'thin' | 'dot' | 'none' = 'none';
                        if (count >= 5) type = 'thick';
                        else if (count >= 2) type = 'thin';
                        else if (count >= 1) type = 'dot';
                        else type = 'none';

                        weekSegments.push({
                            weekIndex: 11 - i, // 0 is oldest, 11 is newest. OR match render order?
                            // Let's render left-to-right (oldest -> newest).
                            // If i=11 (12 weeks ago), this is the first item.
                            count,
                            type,
                            label: `${weekStart.getMonth() + 1}/${weekStart.getDate()}`
                        });
                    }
                    row.weekSegments = weekSegments;

                } else if (currentPeriod === 'all') {
                    // Summary Logic
                    data.allDates.sort(); // String sort works for ISO dates
                    if (data.allDates.length > 0) {
                        const start = data.allDates[0];
                        const end = data.allDates[data.allDates.length - 1];

                        // Calculate duration
                        const startDate = new Date(start);
                        const endDate = new Date(end);
                        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

                        // Avg Freq (Total Taken / Weeks)
                        const weeks = Math.max(diffDays / 7, 1);
                        const avg = (data.allDates.length / weeks).toFixed(1);

                        row.summary = {
                            startDate: start.substring(5).replace('-', '.'),
                            endDate: end.substring(5).replace('-', '.'),
                            totalDays: data.allDates.length,
                            avgFreq: `주 ${avg}회`
                        };
                    }
                }

                rows.push(row);
            });

            setMedicineRows(rows);
            setIsLoading(false);

        } catch (error) {
            console.error('Error loading summary chart data:', error);
            setIsLoading(false);
        }
    };

    const handlePeriodChange = (newPeriod: Period) => {
        setPeriod(newPeriod);
    };


    const scrollViewRef = useRef<ScrollView>(null);

    // Scroll to end when data loads
    useEffect(() => {
        if (chartData.length > 0 && scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [chartData]);

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
                    <ScrollView
                        ref={scrollViewRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingRight: 20 }}
                    >
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

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>
                        {period === '15d' ? '최근 15일' :
                            period === '1m' ? '최근 1개월' :
                                period === '3m' ? '최근 3개월' : '전체 기간'} 약/영양제 복용
                    </Text>

                    {medicineRows.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>복용 기록이 없습니다.</Text>
                        </View>
                    ) : (
                        <View style={styles.medicineChartContainer}>

                            {/* Fixed Layout Medicine Chart - All periods share same container width */}

                            {/* Render Logic: Timeline (15d/1m) vs Week (3m) vs Summary (All) */}
                            {(period === '15d' || period === '1m') && (
                                <>
                                    {/* Date Header Row - Fixed 3-point anchor system */}
                                    <View style={styles.medHeaderRow}>
                                        <View style={styles.medNameHeader} />
                                        <View style={styles.medGridFixed}>
                                            {/* Fixed anchor points: Start, Middle, End */}
                                            <Text style={styles.medDateLabelStart}>
                                                {chartDates[0]}
                                            </Text>
                                            <Text style={styles.medDateLabelCenter}>
                                                {chartDates[Math.floor(chartDates.length / 2)]}
                                            </Text>
                                            <Text style={styles.medDateLabelEnd}>
                                                {chartDates[chartDates.length - 1]}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Medicine Rows with Fixed Grid */}
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

                                            <View style={styles.medGridFixed}>
                                                {/* Fixed Grid Background - 3 vertical lines for anchor points */}
                                                <View style={styles.gridLineStart} />
                                                <View style={styles.gridLineCenter} />
                                                <View style={styles.gridLineEnd} />

                                                {/* Segments (Bars and Dots) - positioned within fixed grid */}
                                                {row.segments.map((seg, segIndex) => {
                                                    const columns = period === '1m' ? 30 : 15;
                                                    const cellWidthPercent = 100 / columns;
                                                    const leftPercent = seg.startIndex * cellWidthPercent;
                                                    const widthPercent = seg.length * cellWidthPercent;

                                                    if (seg.type === 'bar') {
                                                        return (
                                                            <View
                                                                key={segIndex}
                                                                style={[
                                                                    styles.medBarFixed,
                                                                    {
                                                                        left: `${leftPercent}%` as DimensionValue,
                                                                        width: `${widthPercent}%` as DimensionValue
                                                                    },
                                                                    row.isDeleted && styles.medBarDeleted,
                                                                ]}
                                                            />
                                                        );
                                                    } else {
                                                        // Single dot - center it within its cell
                                                        const dotCenterPercent = leftPercent + (cellWidthPercent / 2);
                                                        return (
                                                            <View
                                                                key={segIndex}
                                                                style={[
                                                                    styles.medDotFixed,
                                                                    { left: `${dotCenterPercent}%` as DimensionValue },
                                                                    period === '1m' && styles.medDotSmall,
                                                                    row.isDeleted && styles.medDotDeleted,
                                                                ]}
                                                            />
                                                        );
                                                    }
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}

                            {period === '3m' && (
                                <>
                                    {/* Week Legend Header */}
                                    <View style={styles.medHeaderRow}>
                                        <View style={styles.medNameHeader} />
                                        <View style={styles.weekLegendContainer}>
                                            <View style={styles.legendItem}>
                                                <View style={styles.legendThickBar} />
                                                <Text style={styles.legendText}>주 5회↑</Text>
                                            </View>
                                            <View style={styles.legendItem}>
                                                <View style={styles.legendThinBar} />
                                                <Text style={styles.legendText}>주 2~4회</Text>
                                            </View>
                                            <View style={styles.legendItem}>
                                                <View style={styles.legendDot} />
                                                <Text style={styles.legendText}>주 1회↓</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Date Header Row - Fixed anchor points for 3m (12 weeks) */}
                                    <View style={styles.medHeaderRow}>
                                        <View style={styles.medNameHeader} />
                                        <View style={styles.medGridFixed}>
                                            <Text style={styles.medDateLabelStart}>
                                                {medicineRows[0]?.weekSegments?.[0]?.label || '12주전'}
                                            </Text>
                                            <Text style={styles.medDateLabelCenter}>
                                                {medicineRows[0]?.weekSegments?.[5]?.label || '6주전'}
                                            </Text>
                                            <Text style={styles.medDateLabelEnd}>
                                                오늘
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Week Rows with Fixed Grid */}
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
                                            </View>

                                            <View style={styles.medGridFixed}>
                                                {/* Fixed Grid Background */}
                                                <View style={styles.gridLineStart} />
                                                <View style={styles.gridLineCenter} />
                                                <View style={styles.gridLineEnd} />

                                                {/* Week Segments - 12 fixed columns */}
                                                {row.weekSegments?.map((seg, i) => {
                                                    const cellWidthPercent = 100 / 12;
                                                    const leftPercent = i * cellWidthPercent;
                                                    const centerPercent = leftPercent + (cellWidthPercent / 2);

                                                    return (
                                                        <View
                                                            key={i}
                                                            style={[
                                                                styles.weekCellFixed,
                                                                { left: `${leftPercent}%` as DimensionValue }
                                                            ]}
                                                        >
                                                            {seg.type === 'thick' && (
                                                                <View style={styles.weekBarThick} />
                                                            )}
                                                            {seg.type === 'thin' && (
                                                                <View style={styles.weekBarThin} />
                                                            )}
                                                            {seg.type === 'dot' && (
                                                                <View style={styles.weekDot} />
                                                            )}
                                                        </View>
                                                    );
                                                })}
                                            </View>
                                        </View>
                                    ))}
                                </>
                            )}

                            {period === 'all' && (
                                <View>
                                    {medicineRows.map((row, rowIndex) => (
                                        <View key={rowIndex} style={styles.medSummaryCard}>
                                            <View style={styles.medNameContainer}>
                                                <Text style={[styles.medNameText, { fontSize: 13, fontWeight: '600' }]}>
                                                    💊 {row.name}
                                                </Text>
                                                {row.isDeleted && <Text style={styles.textDeletedSmall}>(삭제)</Text>}
                                            </View>

                                            {row.summary ? (
                                                <View style={styles.medSummaryContent}>
                                                    <Text style={styles.medSummaryText}>
                                                        기간: {row.summary.startDate} ~ {row.summary.endDate}
                                                    </Text>
                                                    <View style={styles.medSummaryRow}>
                                                        <Text style={styles.medSummaryHighlight}>
                                                            총 {row.summary.totalDays}일 복용
                                                        </Text>
                                                        <Text style={styles.medSummaryHighlight}>
                                                            평균: {row.summary.avgFreq}
                                                        </Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                <Text style={styles.medSummaryText}>데이터 없음</Text>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            )}

                        </View>
                    )}
                </Card>

                <Text style={styles.hint}>
                    💡 이 화면을 병원에서 보여주세요. {"\n"}
                    약/영양제 차트는 {period === '15d' ? '최근 15일' : period === '1m' ? '최근 1개월' : period === '3m' ? '최근 3개월' : '전체 기간'} 기준이며, {"\n"}
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
        width: 85,
    },
    medGrid: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        paddingRight: 16,
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
        width: 85,
        paddingRight: 8,
        justifyContent: 'center',
    },
    medNameText: {
        fontSize: 11, // Reduced to fit long names
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
        top: '50%',
        marginTop: -7, // Truly Center
    },
    medBarDeleted: {
        backgroundColor: COLORS.border,
    },
    medDotContainer: {
        position: 'absolute',
        height: '100%' as DimensionValue,
        top: 0,
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
    },
    medSummaryCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    medNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6
    },
    medSummaryContent: {
        gap: 4
    },
    medSummaryText: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    medSummaryRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 4
    },
    medSummaryHighlight: {
        fontSize: 13,
        fontWeight: '500',
        color: COLORS.primary,
    },
    testBtn: {
        backgroundColor: '#F3F4F6',
        padding: 12,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    testBtnText: {
        fontSize: 13,
        color: COLORS.textPrimary,
        fontWeight: '600',
    },
    // Fixed Layout Medicine Chart Styles
    medGridFixed: {
        flex: 1,
        flexDirection: 'row',
        position: 'relative',
        height: 36,
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 8,
    },
    medDateLabelStart: {
        position: 'absolute',
        left: 0,
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'left',
    },
    medDateLabelCenter: {
        position: 'absolute',
        left: '50%',
        transform: [{ translateX: -15 }],
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'center',
        width: 30,
    },
    medDateLabelEnd: {
        position: 'absolute',
        right: 0,
        fontSize: 10,
        color: COLORS.textSecondary,
        textAlign: 'right',
    },
    gridLineStart: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#E5E5E5',
    },
    gridLineCenter: {
        position: 'absolute',
        left: '50%',
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#E5E5E5',
    },
    gridLineEnd: {
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: '#E5E5E5',
    },
    medBarFixed: {
        position: 'absolute',
        height: 12,
        backgroundColor: COLORS.primary,
        borderRadius: 6,
        top: '50%',
        marginTop: -6,
    },
    medDotFixed: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.primary,
        top: '50%',
        marginTop: -4,
        marginLeft: -4,
    },
    medDotSmall: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: -3,
        marginLeft: -3,
    },
    // Week Legend Styles (3 months view)
    weekLegendContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingRight: 16,
    },
    legendThickBar: {
        width: 14,
        height: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 5,
        marginRight: 6,
    },
    legendThinBar: {
        width: 14,
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
        marginRight: 6,
    },
    legendDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
        marginRight: 6,
    },
    weekCellFixed: {
        position: 'absolute',
        width: `${100 / 12}%`,
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    weekBarThick: {
        width: '70%',
        height: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 5,
    },
    weekBarThin: {
        width: '70%',
        height: 4,
        backgroundColor: COLORS.primary,
        borderRadius: 2,
    },
    weekDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: COLORS.primary,
    },
});

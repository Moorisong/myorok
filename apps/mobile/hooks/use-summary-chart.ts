import { useState, useRef, useCallback, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { useFocusEffect } from 'expo-router';

import { getRecentDailyRecords } from '../services/dailyRecords';
import { getRecentFluidHistory } from '../services/fluidRecords';
import { useSelectedPet } from './use-selected-pet';

import type {
    Period,
    ChartData,
    HydrationData,
    OverallSummaryData,
    WeeklyChartData,
    WeeklyHydrationData,
    MonthlyChartData,
    MonthlyHydrationData
} from '../types/chart-types';

export function useSummaryChart() {
    const { selectedPetId } = useSelectedPet();
    const [chartData, setChartData] = useState<ChartData[]>([]);
    const [hydrationData, setHydrationData] = useState<HydrationData[]>([]);

    const [maxValue, setMaxValue] = useState(5);
    const [maxVolValue, setMaxVolValue] = useState(100);

    // Period State
    const [period, setPeriod] = useState<Period>('15d');
    const [isLoading, setIsLoading] = useState(false);

    // Overall Summary State (for 'all' period)
    const [overallSummary, setOverallSummary] = useState<OverallSummaryData | null>(null);

    // Weekly Chart State (for '3m' period)
    const [weeklyChartData, setWeeklyChartData] = useState<WeeklyChartData[]>([]);
    const [weeklyHydrationData, setWeeklyHydrationData] = useState<WeeklyHydrationData[]>([]);

    // Monthly Chart State (for '6m' period)
    const [monthlyChartData, setMonthlyChartData] = useState<MonthlyChartData[]>([]);
    const [monthlyHydrationData, setMonthlyHydrationData] = useState<MonthlyHydrationData[]>([]);

    // ScrollView refs
    const scrollViewRef = useRef<ScrollView>(null);
    const scrollViewRef2 = useRef<ScrollView>(null);
    const scrollViewRef3 = useRef<ScrollView>(null);
    const scrollViewRef4 = useRef<ScrollView>(null);
    const scrollViewRef3m1 = useRef<ScrollView>(null);
    const scrollViewRef3m2 = useRef<ScrollView>(null);
    const scrollViewRef3m3 = useRef<ScrollView>(null);
    const scrollViewRef3m4 = useRef<ScrollView>(null);

    const getDaysFromPeriod = (p: Period) => {
        switch (p) {
            case '15d': return 15;
            case '1m': return 30;
            case '3m': return 90;
            case '6m': return 180;
            case 'all': return 365;
            default: return 15;
        }
    };

    const loadData = useCallback(async (currentPeriod: Period) => {
        try {
            // Clear previous data to prevent flash of old data during period transition
            setIsLoading(true);

            // Determine days for data fetching based on period
            let daysToFetch = 15;
            let chartColumns = 15;

            if (currentPeriod === '1m') {
                daysToFetch = 30;
                chartColumns = 30;
            } else if (currentPeriod === '3m') {
                daysToFetch = 90;
                chartColumns = 12;
            } else if (currentPeriod === '6m') {
                daysToFetch = 180;
                chartColumns = 6;
            } else if (currentPeriod === 'all') {
                daysToFetch = 365;
                chartColumns = 0;
            }

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
            }

            const records = await getRecentDailyRecords(days);
            const fluids = await getRecentFluidHistory(days);

            // Process Chart Data (Daily Records - Fill empty dates)
            const recordMap = new Map<string, typeof records[0]>();
            records.forEach(r => recordMap.set(r.date, r));

            const processedData: ChartData[] = [];

            if (currentPeriod === '15d' || currentPeriod === '1m') {
                for (let i = 0; i < dateObjs.length; i++) {
                    const dateStr = dateObjs[i];
                    const record = recordMap.get(dateStr);

                    processedData.push({
                        date: dates[i],
                        poop: record?.poopCount || 0,
                        diarrhea: record?.diarrheaCount || 0,
                        vomit: record?.vomitCount || 0
                    });
                }
            } else if (currentPeriod === '3m') {
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
                records.forEach(r => {
                    processedData.push({
                        date: r.date.substring(5).replace('-', '/'),
                        poop: r.poopCount,
                        diarrhea: r.diarrheaCount,
                        vomit: r.vomitCount
                    });
                });
            }

            // Process Hydration Data
            const hydrationMap = new Map<string, { water: number, force: number, fluid: number }>();

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

            if (currentPeriod === '15d' || currentPeriod === '1m') {
                for (let i = 0; i < dateObjs.length; i++) {
                    const dateStr = dateObjs[i];
                    const data = hydrationMap.get(dateStr) || { water: 0, force: 0, fluid: 0 };

                    processedHydration.push({
                        date: dates[i],
                        ...data
                    });
                }
            } else if (currentPeriod === '3m') {
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

            // --- Calculate Overall Summary for 'all' period ---
            if (currentPeriod === 'all' && records.length > 0) {
                const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
                const firstDate = sortedRecords[0].date;
                const lastDate = sortedRecords[sortedRecords.length - 1].date;

                const firstDateObj = new Date(firstDate);
                const lastDateObj = new Date(lastDate);
                const totalDays = Math.ceil((lastDateObj.getTime() - firstDateObj.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                let totalVomit = 0;
                let totalPoop = 0;
                let diarrheaDays = 0;

                records.forEach(r => {
                    totalVomit += r.vomitCount || 0;
                    totalPoop += r.poopCount || 0;
                    if ((r.diarrheaCount || 0) > 0) {
                        diarrheaDays++;
                    }
                });

                const avgPoop = records.length > 0 ? totalPoop / records.length : 0;

                let totalForce = 0;
                let totalFluid = 0;

                fluids.forEach(f => {
                    if (f.fluidType === 'force') {
                        totalForce += f.volume || 0;
                    } else {
                        totalFluid += f.volume || 0;
                    }
                });

                const recordedDays = records.length;
                const recordingRate = totalDays > 0 ? (recordedDays / totalDays) * 100 : 0;

                setOverallSummary({
                    firstRecordDate: firstDate,
                    lastRecordDate: lastDate,
                    totalDays,
                    totalVomit,
                    diarrheaDays,
                    avgPoop: Math.round(avgPoop * 10) / 10,
                    totalForce,
                    totalFluid,
                    recordedDays,
                    recordingRate: Math.round(recordingRate)
                });
            } else {
                setOverallSummary(null);
            }

            // --- Calculate Weekly Data for '3m' period ---
            if (currentPeriod === '3m') {
                const sortedRecords = [...records].sort((a, b) => a.date.localeCompare(b.date));
                const weeklyData: WeeklyChartData[] = [];
                const weeklyHydration: WeeklyHydrationData[] = [];

                const numWeeks = Math.min(Math.ceil(days / 7), 13);

                const todayDate = new Date();
                const startDate = new Date(todayDate);
                startDate.setDate(startDate.getDate() - days + 1);

                for (let i = 0; i < numWeeks; i++) {
                    // 해당 주의 시작일 계산
                    const weekStartDate = new Date(startDate);
                    weekStartDate.setDate(startDate.getDate() + (i * 7));

                    // 해당 월에서 몇째 주인지 계산
                    const year = weekStartDate.getFullYear() % 100; // 2자리 연도
                    const month = String(weekStartDate.getMonth() + 1).padStart(2, '0');
                    const dayOfMonth = weekStartDate.getDate();
                    const weekOfMonth = String(Math.ceil(dayOfMonth / 7)).padStart(2, '0');

                    const weekLabel = `${year}년\n${month}월 ${weekOfMonth}주`;

                    weeklyData.push({
                        weekLabel,
                        poop: 0,
                        diarrhea: 0,
                        vomit: 0
                    });
                    weeklyHydration.push({
                        weekLabel,
                        force: 0,
                        fluid: 0
                    });
                }

                sortedRecords.forEach(r => {
                    const recordDate = new Date(r.date);
                    const daysSinceStart = Math.floor((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const weekIndex = Math.min(Math.floor(daysSinceStart / 7), numWeeks - 1);

                    if (weekIndex >= 0 && weekIndex < numWeeks) {
                        weeklyData[weekIndex].poop += r.poopCount || 0;
                        weeklyData[weekIndex].diarrhea += r.diarrheaCount || 0;
                        weeklyData[weekIndex].vomit += r.vomitCount || 0;
                    }
                });

                fluids.forEach(f => {
                    const recordDate = new Date(f.date);
                    const daysSinceStart = Math.floor((recordDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
                    const weekIndex = Math.min(Math.floor(daysSinceStart / 7), numWeeks - 1);

                    if (weekIndex >= 0 && weekIndex < numWeeks) {
                        if (f.fluidType === 'force') {
                            weeklyHydration[weekIndex].force += f.volume || 0;
                        } else {
                            weeklyHydration[weekIndex].fluid += f.volume || 0;
                        }
                    }
                });

                setWeeklyChartData(weeklyData);
                setWeeklyHydrationData(weeklyHydration);
            } else {
                setWeeklyChartData([]);
                setWeeklyHydrationData([]);
            }

            // --- Calculate Monthly Data for '6m' period ---
            if (currentPeriod === '6m') {
                const monthlyData: MonthlyChartData[] = [];
                const monthlyHydration: MonthlyHydrationData[] = [];

                for (let i = 5; i >= 0; i--) {
                    const monthDate = new Date();
                    monthDate.setMonth(today.getMonth() - i);
                    const monthLabel = `${monthDate.getMonth() + 1}월`;

                    monthlyData.push({
                        monthLabel,
                        poop: 0,
                        diarrhea: 0,
                        vomit: 0
                    });

                    monthlyHydration.push({
                        monthLabel,
                        hasForce: false,
                        hasFluid: false
                    });
                }

                // Aggregate symptoms by month
                records.forEach(r => {
                    const recordDate = new Date(r.date);
                    const recordMonth = recordDate.getMonth();
                    const recordYear = recordDate.getFullYear();

                    for (let i = 0; i < 6; i++) {
                        const checkDate = new Date();
                        checkDate.setMonth(today.getMonth() - (5 - i));

                        if (recordMonth === checkDate.getMonth() && recordYear === checkDate.getFullYear()) {
                            monthlyData[i].poop += r.poopCount || 0;
                            monthlyData[i].diarrhea += r.diarrheaCount || 0;
                            monthlyData[i].vomit += r.vomitCount || 0;
                            break;
                        }
                    }
                });

                // Aggregate hydration by month (existence only)
                fluids.forEach(f => {
                    const recordDate = new Date(f.date);
                    const recordMonth = recordDate.getMonth();
                    const recordYear = recordDate.getFullYear();

                    for (let i = 0; i < 6; i++) {
                        const checkDate = new Date();
                        checkDate.setMonth(today.getMonth() - (5 - i));

                        if (recordMonth === checkDate.getMonth() && recordYear === checkDate.getFullYear()) {
                            if (f.fluidType === 'force') {
                                monthlyHydration[i].hasForce = true;
                            } else {
                                monthlyHydration[i].hasFluid = true;
                            }
                            break;
                        }
                    }
                });

                setMonthlyChartData(monthlyData);
                setMonthlyHydrationData(monthlyHydration);
            } else {
                setMonthlyChartData([]);
                setMonthlyHydrationData([]);
            }

            setIsLoading(false);

        } catch (error) {
            console.error('Error loading summary chart data:', error);
            setIsLoading(false);
        }
    }, [selectedPetId]);

    useFocusEffect(
        useCallback(() => {
            loadData(period);
        }, [period, loadData])
    );

    const handlePeriodChange = useCallback((newPeriod: Period) => {
        setPeriod(newPeriod);
    }, []);

    // Scroll to end when data loads
    useEffect(() => {
        if (chartData.length > 0 || weeklyChartData.length > 0) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
                scrollViewRef2.current?.scrollToEnd({ animated: false });
                scrollViewRef3.current?.scrollToEnd({ animated: false });
                scrollViewRef4.current?.scrollToEnd({ animated: false });

                scrollViewRef3m1.current?.scrollToEnd({ animated: false });
                scrollViewRef3m2.current?.scrollToEnd({ animated: false });
                scrollViewRef3m3.current?.scrollToEnd({ animated: false });
                scrollViewRef3m4.current?.scrollToEnd({ animated: false });
            }, 100);
        }
    }, [chartData, weeklyChartData]);

    return {
        // State
        period,
        isLoading,
        chartData,
        hydrationData,
        maxValue,
        maxVolValue,
        overallSummary,
        weeklyChartData,
        weeklyHydrationData,
        monthlyChartData,
        monthlyHydrationData,

        // Refs
        scrollViewRef,
        scrollViewRef2,
        scrollViewRef3,
        scrollViewRef4,
        scrollViewRef3m1,
        scrollViewRef3m2,
        scrollViewRef3m3,
        scrollViewRef3m4,

        // Handlers
        handlePeriodChange
    };
}

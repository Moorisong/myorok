
import React, { useMemo } from 'react';
import { ScrollView } from 'react-native';
import DotLineChart, { DotLineChartData } from './dot-line-chart';
import HydrationChart from './hydration-chart';
import { COLORS } from '../constants';
import type {
    Period,
    ChartData,
    HydrationData,
    WeeklyChartData,
    WeeklyHydrationData,
    MonthlyChartData,
    MonthlyHydrationData
} from '../types/chart-types';

interface SummaryChartsProps {
    period: Period;

    // Daily (15d, 1m) Data
    chartData?: ChartData[];
    hydrationData?: HydrationData[];
    maxValue?: number;
    maxVolValue?: number;

    // Weekly (3m) Data
    weeklyChartData?: WeeklyChartData[];
    weeklyHydrationData?: WeeklyHydrationData[];

    // Monthly (6m) Data
    monthlyChartData?: MonthlyChartData[];
    monthlyHydrationData?: MonthlyHydrationData[];

    // Scroll Refs
    scrollViewRefs?: {
        daily: React.RefObject<ScrollView | null>[];
        weekly: React.RefObject<ScrollView | null>[];
    };
}

export default function SummaryCharts({
    period,
    chartData = [],
    hydrationData = [],
    maxValue = 0,
    maxVolValue = 0,
    weeklyChartData = [],
    weeklyHydrationData = [],
    monthlyChartData = [],
    monthlyHydrationData = [],
    scrollViewRefs
}: SummaryChartsProps) {

    // Determine configuration based on period
    const config = useMemo(() => {
        if (period === '3m') {
            return {
                columnWidth: 56,
                minMaxValue: 5,
                hydrationMinMax: 500,
                hydrationColumnWidth: 56,
                hydrationBarWidth: 24,
                refs: scrollViewRefs?.weekly || []
            };
        } else if (period === '6m') {
            return {
                columnWidth: 60,
                minMaxValue: 10,
                hydrationMinMax: 10,
                hydrationColumnWidth: 60,
                hydrationBarWidth: 28,
                refs: [] // 6개월은 스크롤 안 함 or refs 필요 없음
            };
        } else {
            // 15d, 1m (Daily)
            return {
                columnWidth: 36,
                minMaxValue: 5,
                hydrationMinMax: 100,
                hydrationColumnWidth: 44,
                hydrationBarWidth: 20,
                refs: scrollViewRefs?.daily || []
            };
        }
    }, [period, scrollViewRefs]);

    // Data Processing
    const processedData = useMemo(() => {
        let poop: DotLineChartData[] = [];
        let diarrhea: DotLineChartData[] = [];
        let vomit: DotLineChartData[] = [];

        // Hydration Data Structure: { label, force, fluid, displayValue }
        let hydration: { label: string; force: number; fluid: number; displayValue: string }[] = [];
        let hydrationMax = 0;

        if (period === '3m') {
            // Weekly Data Processing
            poop = weeklyChartData.map(d => ({ label: d.weekLabel, value: d.poop }));
            diarrhea = weeklyChartData.map(d => ({ label: d.weekLabel, value: d.diarrhea }));
            vomit = weeklyChartData.map(d => ({ label: d.weekLabel, value: d.vomit }));

            hydration = weeklyHydrationData.map(w => ({
                label: w.weekLabel,
                force: w.force,
                fluid: w.fluid,
                displayValue: (w.force + w.fluid) > 0 ? `${w.force + w.fluid}ml` : ''
            }));
            hydrationMax = Math.max(...weeklyHydrationData.map(w => w.force + w.fluid), config.hydrationMinMax);

        } else if (period === '6m') {
            // Monthly Data Processing
            poop = monthlyChartData.map(m => ({ label: m.monthLabel, value: m.poop }));
            diarrhea = monthlyChartData.map(m => ({ label: m.monthLabel, value: m.diarrhea }));
            vomit = monthlyChartData.map(m => ({ label: m.monthLabel, value: m.vomit }));

            hydration = monthlyHydrationData.map(m => ({
                label: m.monthLabel,
                force: m.force,
                fluid: m.fluid,
                displayValue: (m.force + m.fluid) > 0 ? `${m.force + m.fluid}ml` : ''
            }));
            hydrationMax = Math.max(...monthlyHydrationData.map(m => m.force + m.fluid), config.hydrationMinMax);

        } else {
            // Daily Data Processing (15d, 1m)
            poop = chartData.map(d => ({ label: d.date, value: d.poop }));
            diarrhea = chartData.map(d => ({ label: d.date, value: d.diarrhea }));
            vomit = chartData.map(d => ({ label: d.date, value: d.vomit }));

            hydration = hydrationData.map(d => ({
                label: d.date,
                force: d.force,
                fluid: d.fluid,
                displayValue: (d.force + d.fluid) > 0 ? `${d.force + d.fluid}ml` : ''
            }));
            hydrationMax = Math.max(maxVolValue, config.hydrationMinMax);
        }

        // Calculate max values for DotLineCharts
        const defaultMax = period === '6m' ? 10 : 5;

        let maxPoop = 0;
        let maxDiarrhea = 0;
        let maxVomit = 0;

        if (period === '3m') {
            // Weekly는 maxValue prop을 안 받고 자체 계산 (기존 로직)
            maxPoop = Math.max(...weeklyChartData.map(d => d.poop), defaultMax);
            maxDiarrhea = Math.max(...weeklyChartData.map(d => d.diarrhea), defaultMax);
            maxVomit = Math.max(...weeklyChartData.map(d => d.vomit), defaultMax);
        } else if (period === '6m') {
            maxPoop = Math.max(...monthlyChartData.map(d => d.poop), defaultMax);
            maxDiarrhea = Math.max(...monthlyChartData.map(d => d.diarrhea), defaultMax);
            maxVomit = Math.max(...monthlyChartData.map(d => d.vomit), defaultMax);
        } else {
            // Daily는 maxValue prop 사용 (기존 로직)
            // 하지만 prop maxValue는 전체 max일 수 있음. 개별 max가 나을 수도?
            // 기존 summary-daily-charts에서는 poop/diarrhea/vomit 모두 같은 maxValue를 썼음.
            // maxValue = Math.max(...allValues)
            // 여기서도 maxValue prop을 그대로 씁니다.
            maxPoop = Math.max(maxValue, defaultMax);
            maxDiarrhea = Math.max(maxValue, defaultMax);
            maxVomit = Math.max(maxValue, defaultMax);
        }

        return {
            poop,
            diarrhea,
            vomit,
            hydration,
            maxPoop,
            maxDiarrhea,
            maxVomit,
            hydrationMax
        };
    }, [period, chartData, hydrationData, weeklyChartData, weeklyHydrationData, monthlyChartData, monthlyHydrationData, maxValue, maxVolValue, config]);

    return (
        <>
            {/* 배변 횟수 */}
            <DotLineChart
                title={period === '3m' ? "배변 횟수 (주간)" : period === '6m' ? "배변 횟수 (월간)" : "배변 횟수"}
                data={processedData.poop}
                maxValue={processedData.maxPoop}
                color={COLORS.primary}
                columnWidth={config.columnWidth}
                scrollViewRef={config.refs[0]}
            />

            {/* 설사 횟수 */}
            <DotLineChart
                title={period === '3m' ? "설사 횟수 (주간)" : period === '6m' ? "설사 횟수 (월간)" : "설사 횟수"}
                data={processedData.diarrhea}
                maxValue={processedData.maxDiarrhea}
                color="#D4915C" // Amber-like color
                columnWidth={config.columnWidth}
                scrollViewRef={config.refs[1]}
            />

            {/* 구토 횟수 */}
            <DotLineChart
                title={period === '3m' ? "구토 횟수 (주간)" : period === '6m' ? "구토 횟수 (월간)" : "구토 횟수"}
                data={processedData.vomit}
                maxValue={processedData.maxVomit}
                color={COLORS.error}
                columnWidth={config.columnWidth}
                scrollViewRef={config.refs[2]}
            />

            {/* 강수 / 수액 */}
            <HydrationChart
                key={`hydration-${period}`}
                title={period === '3m' ? "강수 / 수액 (주간)" : period === '6m' ? "강수 / 수액 (월간)" : "강수 / 수액"}
                data={processedData.hydration}
                maxValue={processedData.hydrationMax}
                columnWidth={config.hydrationColumnWidth}
                barWidth={config.hydrationBarWidth}
                scrollViewRef={config.refs[3]}
            />
        </>
    );
}


import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '../../constants';
import { getMonthRecords, getDayDetail, CalendarDayData, getTodayDateString } from '../../services';

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const FREE_DAYS_LIMIT = 15;

export default function CalendarScreen() {
    const router = useRouter();
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [monthData, setMonthData] = useState<Map<string, CalendarDayData>>(new Map());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | null>(null);
    const [loading, setLoading] = useState(true);
    const isPremium = false; // TODO: 유료 상태 연동

    useFocusEffect(
        useCallback(() => {
            loadMonthData();
        }, [currentYear, currentMonth])
    );

    const loadMonthData = async () => {
        setLoading(true);
        try {
            const data = await getMonthRecords(currentYear, currentMonth);
            setMonthData(data);
        } catch (error) {
            console.error('Failed to load calendar data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (currentMonth === 1) {
            setCurrentYear(currentYear - 1);
            setCurrentMonth(12);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
        setSelectedDate(null);
        setSelectedDayData(null);
    };

    const handleNextMonth = () => {
        if (currentMonth === 12) {
            setCurrentYear(currentYear + 1);
            setCurrentMonth(1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
        setSelectedDate(null);
        setSelectedDayData(null);
    };

    const handleDateSelect = async (dateStr: string) => {
        setSelectedDate(dateStr);
        try {
            const detail = await getDayDetail(dateStr);
            setSelectedDayData(detail);
        } catch (error) {
            console.error('Failed to load day detail:', error);
        }
    };

    const isWithinFreeLimit = (dateStr: string): boolean => {
        const today = new Date();
        const targetDate = new Date(dateStr);
        const diffTime = today.getTime() - targetDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= FREE_DAYS_LIMIT;
    };

    const isToday = (dateStr: string): boolean => {
        return dateStr === getTodayDateString();
    };

    const getDaysInMonth = (year: number, month: number): number => {
        return new Date(year, month, 0).getDate();
    };

    const getFirstDayOfMonth = (year: number, month: number): number => {
        return new Date(year, month - 1, 1).getDay();
    };

    const formatDateStr = (day: number): string => {
        return `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    };

    const getDayName = (dateStr: string): string => {
        const date = new Date(dateStr);
        return DAY_NAMES[date.getDay()];
    };

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const rows: React.ReactNode[] = [];
        let cells: React.ReactNode[] = [];

        // Empty cells for days before start
        for (let i = 0; i < firstDay; i++) {
            cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
        }

        // Day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = formatDateStr(day);
            const dayData = monthData.get(dateStr);
            const isSelected = selectedDate === dateStr;
            const isTodayDate = isToday(dateStr);

            cells.push(
                <Pressable
                    key={day}
                    style={[
                        styles.dayCell,
                        isSelected && styles.dayCellSelected,
                        isTodayDate && styles.dayCellToday,
                    ]}
                    onPress={() => handleDateSelect(dateStr)}
                >
                    <Text
                        style={[
                            styles.dayText,
                            isSelected && styles.dayTextSelected,
                            isTodayDate && styles.dayTextToday,
                        ]}
                    >
                        {day}
                    </Text>
                    {dayData && (
                        <View style={styles.indicators}>
                            {dayData.hasDiarrheaOrVomit && (
                                <View style={[styles.dot, styles.dotWarning]} />
                            )}
                            {dayData.hasRecord && !dayData.hasDiarrheaOrVomit && (
                                <View style={[styles.dot, styles.dotNormal]} />
                            )}
                            {dayData.hasMedicine && <Text style={styles.miniIcon}>💊</Text>}
                            {dayData.hasFluid && <Text style={styles.miniIcon}>💧</Text>}
                        </View>
                    )}
                </Pressable>
            );

            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                rows.push(
                    <View key={`row-${rows.length}`} style={styles.weekRow}>
                        {cells}
                    </View>
                );
                cells = [];
            }
        }

        // Fill remaining cells
        while (cells.length > 0 && cells.length < 7) {
            cells.push(<View key={`empty-end-${cells.length}`} style={styles.dayCell} />);
        }
        if (cells.length > 0) {
            rows.push(
                <View key={`row-${rows.length}`} style={styles.weekRow}>
                    {cells}
                </View>
            );
        }

        return rows;
    };

    const renderDaySummary = () => {
        if (!selectedDate) return null;

        const canViewDetail = isPremium || isWithinFreeLimit(selectedDate);
        const isTodayDate = isToday(selectedDate);

        if (!selectedDayData) {
            return (
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryTitle}>
                        {selectedDate.split('-')[1]}/{selectedDate.split('-')[2]} ({getDayName(selectedDate)})
                    </Text>
                    <Text style={styles.noRecordText}>기록 없음</Text>
                </View>
            );
        }

        const { dailyRecord, supplements, fluidRecords } = selectedDayData;

        return (
            <View style={[styles.summaryCard, !canViewDetail && styles.summaryCardBlurred]}>
                <View style={styles.summaryHeader}>
                    <Text style={styles.summaryTitle}>
                        {selectedDate.split('-')[1]}/{selectedDate.split('-')[2]} ({getDayName(selectedDate)})
                    </Text>
                </View>

                {canViewDetail ? (
                    <>
                        {dailyRecord && (
                            <View style={styles.summarySection}>
                                {(dailyRecord.peeCount > 0 || dailyRecord.poopCount > 0) && (
                                    <Text style={styles.summaryItem}>
                                        💩 배변 {dailyRecord.poopCount}회
                                        {dailyRecord.diarrheaCount > 0 && ` (묽은 변 ${dailyRecord.diarrheaCount})`}
                                        {dailyRecord.peeCount > 0 && ` / 💧 소변 ${dailyRecord.peeCount}회`}
                                    </Text>
                                )}
                                {dailyRecord.vomitCount > 0 && (
                                    <Text style={styles.summaryItem}>
                                        🤮 구토 {dailyRecord.vomitCount}회
                                        {dailyRecord.vomitTypes && ` (${JSON.parse(dailyRecord.vomitTypes).join(', ')})`}
                                    </Text>
                                )}
                                {dailyRecord.memo && (
                                    <View style={styles.memoBox}>
                                        <Text style={styles.memoLabel}>[메모]</Text>
                                        <Text style={styles.memoText}>{dailyRecord.memo}</Text>
                                    </View>
                                )}
                            </View>
                        )}

                        {supplements && supplements.length > 0 && (
                            <View style={styles.summarySection}>
                                {supplements.filter(s => s.taken).map((s, i) => (
                                    <Text key={i} style={styles.summaryItem}>💊 {s.name}</Text>
                                ))}
                            </View>
                        )}

                        {fluidRecords && fluidRecords.length > 0 && (
                            <View style={styles.summarySection}>
                                {fluidRecords.map((f, i) => (
                                    <Text key={i} style={styles.summaryItem}>
                                        💧 {f.fluidType === 'subcutaneous' ? '피하수액' : '정맥수액'}
                                        {f.volume && ` ${f.volume}ml`}
                                    </Text>
                                ))}
                            </View>
                        )}
                    </>
                ) : (
                    <View style={styles.premiumNotice}>
                        <Text style={styles.premiumText}>
                            프리미엄에서 상세 기록을 확인할 수 있어요
                        </Text>
                        <Pressable
                            style={styles.premiumButton}
                            onPress={() => router.push('/pro')}
                        >
                            <Text style={styles.premiumButtonText}>프리미엄 알아보기</Text>
                        </Pressable>
                    </View>
                )}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable onPress={handlePrevMonth} style={styles.navButton}>
                    <Text style={styles.navButtonText}>◀</Text>
                </Pressable>
                <Text style={styles.monthTitle}>
                    {currentYear}년 {currentMonth}월
                </Text>
                <Pressable onPress={handleNextMonth} style={styles.navButton}>
                    <Text style={styles.navButtonText}>▶</Text>
                </Pressable>
            </View>

            <View style={styles.weekHeader}>
                {DAY_NAMES.map((day, i) => (
                    <Text
                        key={day}
                        style={[
                            styles.weekDayText,
                            i === 0 && styles.sundayText,
                            i === 6 && styles.saturdayText,
                        ]}
                    >
                        {day}
                    </Text>
                ))}
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.calendarGrid}>
                    {renderCalendarGrid()}
                </View>

                {renderDaySummary()}

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 40,
        paddingBottom: 16,
    },
    navButton: {
        padding: 8,
    },
    navButtonText: {
        fontSize: 18,
        color: COLORS.primary,
    },
    monthTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    weekHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 8,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    sundayText: {
        color: COLORS.error,
    },
    saturdayText: {
        color: COLORS.primary,
    },
    scrollView: {
        flex: 1,
    },
    calendarGrid: {
        paddingHorizontal: 12,
    },
    weekRow: {
        flexDirection: 'row',
    },
    dayCell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        margin: 2,
        borderRadius: 8,
        backgroundColor: COLORS.surface,
    },
    dayCellSelected: {
        backgroundColor: COLORS.primaryLight,
        borderWidth: 2,
        borderColor: COLORS.primary,
    },
    dayCellToday: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    dayTextSelected: {
        fontWeight: '600',
        color: COLORS.primary,
    },
    dayTextToday: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    indicators: {
        flexDirection: 'row',
        marginTop: 2,
        gap: 2,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    dotNormal: {
        backgroundColor: COLORS.primary,
    },
    dotWarning: {
        backgroundColor: COLORS.error,
    },
    miniIcon: {
        fontSize: 8,
    },
    summaryCard: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
    },
    summaryCardBlurred: {
        opacity: 0.6,
    },
    summaryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    editButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
    },
    editButtonText: {
        fontSize: 14,
        color: COLORS.surface,
        fontWeight: '500',
    },
    noRecordText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    summarySection: {
        paddingVertical: 8,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    summaryItem: {
        fontSize: 15,
        color: COLORS.textPrimary,
        paddingVertical: 4,
    },
    memoBox: {
        marginTop: 8,
        padding: 12,
        backgroundColor: COLORS.background,
        borderRadius: 8,
    },
    memoLabel: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    memoText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    premiumNotice: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    premiumText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    premiumButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        backgroundColor: COLORS.primary,
        borderRadius: 20,
    },
    premiumButtonText: {
        fontSize: 14,
        color: COLORS.surface,
        fontWeight: '600',
    },
    bottomPadding: {
        height: 32,
    },
});

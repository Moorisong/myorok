import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import { Feather } from '@expo/vector-icons';
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
    const fadeAnim = React.useRef(new Animated.Value(1)).current;

    const animateTransition = (callback: () => void) => {
        Animated.timing(fadeAnim, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
            easing: Easing.ease,
        }).start(() => {
            callback();
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
                easing: Easing.ease,
            }).start();
        });
    };

    const isPremium = false; // TODO: 유료 상태 연동

    useFocusEffect(
        useCallback(() => {
            loadMonthData();
            if (selectedDate) {
                getDayDetail(selectedDate).then(detail => {
                    setSelectedDayData(detail);
                });
            }
        }, [currentYear, currentMonth, selectedDate])
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
        animateTransition(() => {
            if (currentMonth === 1) {
                setCurrentYear(currentYear - 1);
                setCurrentMonth(12);
            } else {
                setCurrentMonth(currentMonth - 1);
            }
            setSelectedDate(null);
            setSelectedDayData(null);
        });
    };

    const handleNextMonth = () => {
        animateTransition(() => {
            if (currentMonth === 12) {
                setCurrentYear(currentYear + 1);
                setCurrentMonth(1);
            } else {
                setCurrentMonth(currentMonth + 1);
            }
            setSelectedDate(null);
            setSelectedDayData(null);
        });
    };

    const handleToday = () => {
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth() + 1;
        const dateStr = getTodayDateString();

        animateTransition(() => {
            setCurrentYear(year);
            setCurrentMonth(month);
            handleDateSelect(dateStr);
        });
    };

    const handlePrevDay = () => {
        if (!selectedDate) return;
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - 1);

        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        animateTransition(() => {
            if (year !== currentYear || month !== currentMonth) {
                setCurrentYear(year);
                setCurrentMonth(month);
            }
            handleDateSelect(dateStr);
        });
    };

    const handleNextDay = () => {
        if (!selectedDate) return;
        const d = new Date(selectedDate);
        d.setDate(d.getDate() + 1);

        const year = d.getFullYear();
        const month = d.getMonth() + 1;
        const day = d.getDate();
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

        animateTransition(() => {
            if (year !== currentYear || month !== currentMonth) {
                setCurrentYear(year);
                setCurrentMonth(month);
            }
            handleDateSelect(dateStr);
        });
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

    const flingLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .runOnJS(true)
        .onEnd(() => {
            handleNextMonth();
        });

    const flingRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .runOnJS(true)
        .onEnd(() => {
            handlePrevMonth();
        });

    const gestures = Gesture.Simultaneous(flingLeft, flingRight);

    const dayFlingLeft = Gesture.Fling()
        .direction(Directions.LEFT)
        .runOnJS(true)
        .onEnd(() => {
            handleNextDay();
        });

    const dayFlingRight = Gesture.Fling()
        .direction(Directions.RIGHT)
        .runOnJS(true)
        .onEnd(() => {
            handlePrevDay();
        });

    const dayGestures = Gesture.Simultaneous(dayFlingLeft, dayFlingRight);

    // Auto-select today on mount
    useEffect(() => {
        const todayStr = getTodayDateString();
        setSelectedDate(todayStr);
        // Load initial detail
        getDayDetail(todayStr).then(detail => {
            setSelectedDayData(detail);
        });
    }, []);

    const renderCalendarGrid = () => {
        const daysInMonth = getDaysInMonth(currentYear, currentMonth);
        const firstDay = getFirstDayOfMonth(currentYear, currentMonth);
        const rows: React.ReactNode[] = [];
        let cells: React.ReactNode[] = [];

        // Empty cells for days before start
        for (let i = 0; i < firstDay; i++) {
            cells.push(<View key={`empty-${i}`} style={[styles.dayCell, styles.emptyCell]} />);
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
                    style={[styles.dayCell]}
                    onPress={() => handleDateSelect(dateStr)}
                >
                    <View style={[
                        styles.dateNumberContainer,
                        isSelected && styles.selectedDateContainer,
                        isTodayDate && !isSelected && styles.todayDateContainer
                    ]}>
                        <Text
                            style={[
                                styles.dayText,
                                isSelected && styles.selectedDayText,
                                isTodayDate && !isSelected && styles.todayDayText,
                            ]}
                        >
                            {day}
                        </Text>
                    </View>

                    {dayData && (
                        <View style={styles.indicators}>
                            {dayData.hasDiarrheaOrVomit && (
                                <View style={[styles.dot, styles.dotWarning]} />
                            )}
                            {dayData.hasRecord && !dayData.hasDiarrheaOrVomit && (
                                <View style={[styles.dot, styles.dotNormal]} />
                            )}
                            {/* Icons */}
                            {dayData.hasMedicine && <Text style={styles.miniIconText}>💊</Text>}
                            {dayData.hasFluid && <Feather name="activity" size={10} color={COLORS.primary} style={styles.miniIcon} />}
                        </View>
                    )}
                </Pressable>
            );

            if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
                // If it's the end of the month, fill the remaining cells
                if (day === daysInMonth) {
                    while (cells.length < 7) {
                        cells.push(<View key={`empty-end-${cells.length}`} style={[styles.dayCell, styles.emptyCell]} />);
                    }
                }

                rows.push(
                    <View key={`row-${rows.length}`} style={styles.weekRow}>
                        {cells}
                    </View>
                );
                cells = [];
            }
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
                                        {dailyRecord.diarrheaCount > 0 && ` / 🚨 묽은 변 ${dailyRecord.diarrheaCount}회`}
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
                                        <Feather name="activity" size={14} color={COLORS.primary} /> {f.fluidType === 'subcutaneous' ? '피하수액' : '정맥수액'}
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
                <View style={styles.monthNav}>
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

                <Pressable onPress={handleToday} style={styles.todayButton}>
                    <Text style={styles.todayButtonText}>오늘</Text>
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
                <GestureDetector gesture={gestures}>
                    <View>
                        <Animated.View style={[styles.calendarGrid, { opacity: fadeAnim }]}>
                            {renderCalendarGrid()}
                        </Animated.View>

                        {/* Legend included in Month Swipe Zone */}
                        <View style={styles.legendContainer}>
                            <View style={styles.legendItem}>
                                <View style={[styles.dot, styles.dotWarning]} />
                                <Text style={styles.legendText}>구토/묽은변</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.dot, styles.dotNormal]} />
                                <Text style={styles.legendText}>배변/소변</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <Text style={styles.miniIconText}>💊</Text>
                                <Text style={styles.legendText}>약</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <Feather name="activity" size={10} color={COLORS.primary} />
                                <Text style={styles.legendText}>수액</Text>
                            </View>
                        </View>
                    </View>
                </GestureDetector>

                <View style={styles.zoneDivider} />



                <GestureDetector gesture={dayGestures}>
                    <Animated.View style={{ opacity: fadeAnim, minHeight: 400 }}>
                        {renderDaySummary()}
                        <View style={styles.bottomPadding} />
                    </Animated.View>
                </GestureDetector>
            </ScrollView>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center', // Center the nav
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 30,
        paddingBottom: 10,
        position: 'relative', // For absolute positioning of today button
    },
    // headerLeftSpacer removed
    monthNav: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    navButton: {
        padding: 8,
    },
    todayButton: {
        position: 'absolute',
        right: 16,
        bottom: 12, // Align vertically with month nav
        paddingHorizontal: 10,
        paddingVertical: 5,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 14,
    },
    todayButtonText: {
        fontSize: 11,
        color: COLORS.primary,
        fontWeight: '600',
    },
    navButtonText: {
        fontSize: 16,
        color: COLORS.primary,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    weekHeader: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingBottom: 4,
    },
    weekDayText: {
        flex: 1,
        textAlign: 'center',
        fontSize: 13,
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
        paddingHorizontal: 0,
        marginBottom: 10,
    },
    weekRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 0, // Removed gap
    },
    dayCell: {
        width: '14.28%',
        height: 52, // Reduced from 60
        alignItems: 'center',
        paddingTop: 4,
    },
    emptyCell: {
    },
    dateNumberContainer: {
        width: 28, // Reduced from 32
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 2,
    },
    selectedDateContainer: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    todayDateContainer: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    dayText: {
        fontSize: 14, // Reduced from 16
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    selectedDayText: {
        color: COLORS.surface,
        fontWeight: '700',
    },
    todayDayText: {
        color: COLORS.primary,
        fontWeight: '700',
    },
    indicators: {
        flexDirection: 'row',
        gap: 3,
        height: 10,
        alignItems: 'center',
    },
    dot: {
        width: 5,
        height: 5,
        borderRadius: 2.5,
    },
    dotNormal: {
        backgroundColor: COLORS.primary,
    },
    dotWarning: {
        backgroundColor: COLORS.error,
    },
    miniIcon: {
        // Icon style adjustment
        marginTop: 1,
    },
    miniIconText: {
        fontSize: 10,
        lineHeight: 12,
    },
    legendContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    legendText: {
        fontSize: 12,
        color: COLORS.textSecondary,
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
        color: COLORS.surface,
        fontSize: 12,
        fontWeight: '600',
    },
    zoneDivider: {
        height: 1,
        backgroundColor: COLORS.border,
        marginHorizontal: 16,
        marginVertical: 10,
    },
    bottomPadding: {
        height: 100,
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

});

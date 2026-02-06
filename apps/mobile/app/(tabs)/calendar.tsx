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
import { CalendarGrid, DaySummaryCard } from '../../components';
import { useToast } from '../../components/ToastContext';
import { getMonthRecords, getDayDetail, CalendarDayData, getTodayDateString, getSubscriptionStatus } from '../../services';
import { useSelectedPet } from '../../hooks/use-selected-pet';



const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
const FREE_DAYS_LIMIT = 15;

export default function CalendarScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const { selectedPetId, selectedPet } = useSelectedPet();
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
    const [monthData, setMonthData] = useState<Map<string, CalendarDayData>>(new Map());
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedDayData, setSelectedDayData] = useState<CalendarDayData | null>(null);
    const [loading, setLoading] = useState(true);
    const [isPremium, setIsPremium] = useState(false);
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

    useFocusEffect(
        useCallback(() => {
            // Load subscription status
            getSubscriptionStatus().then(status => {
                const hasAccess = status.status === 'trial' || status.status === 'subscribed';
                setIsPremium(hasAccess);
            });

            loadMonthData();
            if (selectedDate) {
                getDayDetail(selectedDate).then(detail => {
                    setSelectedDayData(detail);
                });
            }
        }, [currentYear, currentMonth, selectedDate, selectedPetId])
    );

    const loadMonthData = async () => {
        setLoading(true);
        try {
            const data = await getMonthRecords(currentYear, currentMonth);
            setMonthData(data);
        } catch (error) {
            // Error handled silently
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

        if (!isPremium && !isWithinFreeLimit(dateStr)) {
            showToast('프리미엄에서 전체 기록을 확인할 수 있어요.');
        }

        try {
            const detail = await getDayDetail(dateStr);
            setSelectedDayData(detail);
        } catch (error) {
            // Error handled silently
        }
    };

    const isWithinFreeLimit = (dateStr: string): boolean => {
        const today = new Date();
        const targetDate = new Date(dateStr);
        const diffTime = today.getTime() - targetDate.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= FREE_DAYS_LIMIT;
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Pet Indicator */}
            <View style={styles.petIndicatorRow}>
                <Pressable
                    style={styles.petIndicator}
                    onPress={() => router.push('/(tabs)/settings/pets')}
                >
                    <Text style={styles.petName} numberOfLines={1} pointerEvents="none">{selectedPet?.name || ''}</Text>
                </Pressable>
            </View>

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
                            <CalendarGrid
                                year={currentYear}
                                month={currentMonth}
                                monthData={monthData}
                                selectedDate={selectedDate}
                                onDateSelect={handleDateSelect}
                            />
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
                    <Animated.View style={[styles.daySummaryContainer, { opacity: fadeAnim }]}>
                        <DaySummaryCard
                            selectedDate={selectedDate}
                            selectedDayData={selectedDayData}
                            isPremium={isPremium}
                            canViewDetail={isPremium || (selectedDate ? isWithinFreeLimit(selectedDate) : false)}
                            onUpgrade={() => router.push('/pro')}
                            getDayName={getDayName}
                        />
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
        paddingTop: 8,
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
    daySummaryContainer: {
        minHeight: 400,
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
    petEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },

});

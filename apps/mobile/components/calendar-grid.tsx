import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { CalendarDayData, getTodayDateString } from '../services';

interface CalendarGridProps {
    year: number;
    month: number;
    monthData: Map<string, CalendarDayData>;
    selectedDate: string | null;
    onDateSelect: (dateStr: string) => void;
}

const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month, 0).getDate();
};

const getFirstDayOfMonth = (year: number, month: number): number => {
    return new Date(year, month - 1, 1).getDay();
};

const formatDateStr = (year: number, month: number, day: number): string => {
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const isToday = (dateStr: string): boolean => {
    return dateStr === getTodayDateString();
};

export default function CalendarGrid({
    year,
    month,
    monthData,
    selectedDate,
    onDateSelect,
}: CalendarGridProps) {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const rows: React.ReactNode[] = [];
    let cells: React.ReactNode[] = [];

    // Empty cells for days before start
    for (let i = 0; i < firstDay; i++) {
        cells.push(<View key={`empty-${i}`} style={[styles.dayCell, styles.emptyCell]} />);
    }

    // Day cells
    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = formatDateStr(year, month, day);
        const dayData = monthData.get(dateStr);
        const isSelected = selectedDate === dateStr;
        const isTodayDate = isToday(dateStr);

        cells.push(
            <Pressable
                key={day}
                style={[styles.dayCell]}
                onPress={() => onDateSelect(dateStr)}
            >
                <View style={[
                    styles.dateNumberContainer,
                    isSelected && styles.selectedDateContainer,
                    isTodayDate && !isSelected && styles.todayDateContainer,
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

    return <>{rows}</>;
}

const styles = StyleSheet.create({
    weekRow: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
        marginBottom: 0,
    },
    dayCell: {
        width: '14.28%',
        height: 52,
        alignItems: 'center',
        paddingTop: 4,
    },
    emptyCell: {
    },
    dateNumberContainer: {
        width: 28,
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
        fontSize: 14,
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
        marginTop: 1,
    },
    miniIconText: {
        fontSize: 10,
        lineHeight: 12,
    },
});

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../constants';
import { CalendarDayData } from '../services';

interface DaySummaryCardProps {
    selectedDate: string | null;
    selectedDayData: CalendarDayData | null;
    isPremium: boolean;
    canViewDetail: boolean;
    onUpgrade: () => void;
    getDayName: (dateStr: string) => string;
}

export default function DaySummaryCard({
    selectedDate,
    selectedDayData,
    isPremium,
    canViewDetail,
    onUpgrade,
    getDayName,
}: DaySummaryCardProps) {
    if (!selectedDate) return null;

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
                        onPress={onUpgrade}
                    >
                        <Text style={styles.premiumButtonText}>프리미엄 알아보기</Text>
                    </Pressable>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
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

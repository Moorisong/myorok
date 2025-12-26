import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Header, Card } from '../../../components';

// 임시 데이터 (나중에 DB 연동)
const MOCK_DATA = [
    { date: '12/20', poop: 2, diarrhea: 0, vomit: 0 },
    { date: '12/21', poop: 3, diarrhea: 1, vomit: 1 },
    { date: '12/22', poop: 2, diarrhea: 0, vomit: 0 },
    { date: '12/23', poop: 2, diarrhea: 0, vomit: 0 },
    { date: '12/24', poop: 3, diarrhea: 0, vomit: 0 },
    { date: '12/25', poop: 2, diarrhea: 0, vomit: 0 },
    { date: '12/26', poop: 0, diarrhea: 0, vomit: 0 },
];

const MOCK_MEDICINE = [
    { name: '위장약', startDate: '12/20', endDate: '12/25' },
];

export default function SummaryChartScreen() {
    const maxValue = Math.max(...MOCK_DATA.map(d => d.poop + d.diarrhea + d.vomit), 5);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="병원용 요약 차트" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>최근 7일 기록</Text>

                    {/* 간단한 바 차트 */}
                    <View style={styles.chart}>
                        {MOCK_DATA.map((day, index) => (
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
                                    <View
                                        style={[
                                            styles.bar,
                                            styles.barPoop,
                                            { height: (day.poop / maxValue) * 100 },
                                        ]}
                                    />
                                </View>
                                <Text style={styles.barLabel}>{day.date}</Text>
                            </View>
                        ))}
                    </View>

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
                    <Text style={styles.sectionTitle}>약 복용 기간</Text>
                    {MOCK_MEDICINE.map((med, index) => (
                        <View key={index} style={styles.medicineItem}>
                            <Text style={styles.medicineName}>💊 {med.name}</Text>
                            <Text style={styles.medicinePeriod}>
                                {med.startDate} ~ {med.endDate}
                            </Text>
                        </View>
                    ))}
                </Card>

                <Text style={styles.hint}>
                    💡 이 화면을 병원에서 보여주세요. 수의사 선생님이 증상 추이를 한눈에 파악할 수 있습니다.
                </Text>

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
    barLabel: {
        fontSize: 11,
        color: COLORS.textSecondary,
        marginTop: 8,
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
});

import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS, ALERT_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '../../../constants';
import { Button, Header } from '../../../components';
import { addHospitalRecord, getHospitalRecords, HospitalRecord, getTodayDateString } from '../../../services';

export default function HospitalScreen() {
    const router = useRouter();
    const [date, setDate] = useState(getTodayDateString());
    const [memo, setMemo] = useState('');
    const [recentRecords, setRecentRecords] = useState<HospitalRecord[]>([]);
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadRecords();
        }, [])
    );

    const loadRecords = async () => {
        try {
            const records = await getHospitalRecords(10);
            setRecentRecords(records);
        } catch (error) {
            // Error handled silently
        }
    };

    const handleSave = async () => {
        if (!date) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_DATE);
            return;
        }

        setSaving(true);
        try {
            await addHospitalRecord(date, memo || undefined);
            Alert.alert(ALERT_TITLES.SAVE_COMPLETE, SUCCESS_MESSAGES.HOSPITAL_SAVED, [
                { text: '확인', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.SAVE_FAILED);
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const [year, month, day] = dateStr.split('-');
        return `${month}월 ${day}일`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="병원 기록" showBack />
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>방문일</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={COLORS.textSecondary}
                        value={date}
                        onChangeText={setDate}
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>진단/처방 메모</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="진단 내용, 처방약, 검사 결과 등"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </View>

                <Button
                    title={saving ? '저장 중...' : '저장하기'}
                    onPress={handleSave}
                    disabled={saving}
                    style={styles.saveButton}
                />

                {recentRecords.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>최근 방문 기록</Text>
                        {recentRecords.map(record => (
                            <View key={record.id} style={styles.recordItem}>
                                <Text style={styles.recordDate}>{formatDate(record.date)}</Text>
                                {record.memo && (
                                    <Text style={styles.recordMemo}>{record.memo}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

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
    scrollView: {
        flex: 1,
    },
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    memoInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        minHeight: 150,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    recordItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    recordDate: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
    },
    recordMemo: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    bottomPadding: {
        height: 32,
    },
});

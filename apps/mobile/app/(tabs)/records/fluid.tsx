import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS } from '../../../constants';
import { Button, Header } from '../../../components';
import { addFluidRecord, getTodayFluidRecords, FluidRecord } from '../../../services';

const FLUID_TYPES = [
    { key: 'subcutaneous', label: '피하수액', emoji: '💉' },
    { key: 'iv', label: '정맥수액', emoji: '🏥' },
];

export default function FluidScreen() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [volume, setVolume] = useState('');
    const [memo, setMemo] = useState('');
    const [todayRecords, setTodayRecords] = useState<FluidRecord[]>([]);
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadTodayRecords();
        }, [])
    );

    const loadTodayRecords = async () => {
        try {
            const records = await getTodayFluidRecords();
            setTodayRecords(records);
        } catch (error) {
            console.error('Failed to load fluid records:', error);
        }
    };

    const handleSave = async () => {
        if (!selectedType) {
            Alert.alert('알림', '수액 종류를 선택해주세요.');
            return;
        }

        setSaving(true);
        try {
            await addFluidRecord(
                selectedType,
                volume ? parseInt(volume, 10) : undefined,
                memo || undefined
            );
            Alert.alert('저장 완료', '수액 기록이 저장되었습니다.', [
                { text: '확인', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const getTypeLabel = (type: string) =>
        FLUID_TYPES.find(t => t.key === type)?.label || type;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="수액 기록" showBack />
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>수액 종류</Text>
                    <View style={styles.optionGrid}>
                        {FLUID_TYPES.map(type => (
                            <Pressable
                                key={type.key}
                                style={[
                                    styles.optionCard,
                                    selectedType === type.key && styles.optionCardSelected,
                                ]}
                                onPress={() => setSelectedType(type.key)}
                            >
                                <Text style={styles.optionEmoji}>{type.emoji}</Text>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        selectedType === type.key && styles.optionLabelSelected,
                                    ]}
                                >
                                    {type.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>용량 (ml)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="예: 100"
                        placeholderTextColor={COLORS.textSecondary}
                        value={volume}
                        onChangeText={setVolume}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모 (선택)</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="반응, 특이사항 등"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </View>

                {todayRecords.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>오늘 기록</Text>
                        {todayRecords.map(record => (
                            <View key={record.id} style={styles.recordItem}>
                                <Text style={styles.recordText}>
                                    {getTypeLabel(record.fluidType)}
                                    {record.volume && ` - ${record.volume}ml`}
                                </Text>
                                {record.memo && (
                                    <Text style={styles.recordMemo}>{record.memo}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <Button
                    title={saving ? '저장 중...' : '저장하기'}
                    onPress={handleSave}
                    disabled={saving || !selectedType}
                    style={styles.saveButton}
                />

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
    optionGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    optionCard: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    optionCardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primaryLight,
    },
    optionEmoji: {
        fontSize: 32,
        marginBottom: 8,
    },
    optionLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    optionLabelSelected: {
        color: COLORS.primary,
        fontWeight: '600',
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
        minHeight: 80,
    },
    recordItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    recordText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    recordMemo: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    bottomPadding: {
        height: 32,
    },
});

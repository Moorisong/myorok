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

import { COLORS, ALERT_TITLES, ERROR_MESSAGES, SUCCESS_MESSAGES, VALIDATION_MESSAGES } from '../../../constants';
import { Button, Header } from '../../../components';
import { addFoodRecord, getTodayFoodRecords, FoodRecord } from '../../../services';

type FoodType = 'can' | 'dry' | 'etc';
type Preference = 'good' | 'normal' | 'reject';

const FOOD_TYPES: { key: FoodType; label: string; emoji: string }[] = [
    { key: 'can', label: '캔/습식', emoji: '🥫' },
    { key: 'dry', label: '건식', emoji: '🍚' },
    { key: 'etc', label: '기타', emoji: '🍽️' },
];

const PREFERENCES: { key: Preference; label: string; emoji: string }[] = [
    { key: 'good', label: '잘 먹음', emoji: '😋' },
    { key: 'normal', label: '보통', emoji: '😐' },
    { key: 'reject', label: '거부', emoji: '🙅' },
];

export default function FoodScreen() {
    const router = useRouter();
    const [selectedType, setSelectedType] = useState<FoodType | null>(null);
    const [selectedPreference, setSelectedPreference] = useState<Preference | null>(null);
    const [comment, setComment] = useState('');
    const [todayRecords, setTodayRecords] = useState<FoodRecord[]>([]);
    const [saving, setSaving] = useState(false);

    useFocusEffect(
        useCallback(() => {
            loadTodayRecords();
        }, [])
    );

    const loadTodayRecords = async () => {
        try {
            const records = await getTodayFoodRecords();
            setTodayRecords(records);
        } catch (error) {
            // Error handled silently
        }
    };

    const handleSave = async () => {
        if (!selectedType || !selectedPreference) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.SELECT_FOOD);
            return;
        }

        setSaving(true);
        try {
            await addFoodRecord(selectedType, selectedPreference, comment || undefined);
            Alert.alert(ALERT_TITLES.SAVE_COMPLETE, SUCCESS_MESSAGES.FOOD_SAVED, [
                { text: '확인', onPress: () => router.back() },
            ]);
        } catch (error) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.SAVE_FAILED);
        } finally {
            setSaving(false);
        }
    };

    const getTypeLabel = (type: FoodType) => FOOD_TYPES.find(t => t.key === type)?.label || type;
    const getPrefLabel = (pref: Preference) => PREFERENCES.find(p => p.key === pref)?.label || pref;

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="사료 기호성" showBack />
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>사료 종류</Text>
                    <View style={styles.optionGrid}>
                        {FOOD_TYPES.map(type => (
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
                    <Text style={styles.sectionTitle}>기호성</Text>
                    <View style={styles.optionGrid}>
                        {PREFERENCES.map(pref => (
                            <Pressable
                                key={pref.key}
                                style={[
                                    styles.optionCard,
                                    selectedPreference === pref.key && styles.optionCardSelected,
                                ]}
                                onPress={() => setSelectedPreference(pref.key)}
                            >
                                <Text style={styles.optionEmoji}>{pref.emoji}</Text>
                                <Text
                                    style={[
                                        styles.optionLabel,
                                        selectedPreference === pref.key && styles.optionLabelSelected,
                                    ]}
                                >
                                    {pref.label}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>메모 (선택)</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="사료명이나 특이사항"
                        placeholderTextColor={COLORS.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                    />
                </View>

                {todayRecords.length > 0 && (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>오늘 기록</Text>
                        {todayRecords.map(record => (
                            <View key={record.id} style={styles.recordItem}>
                                <Text style={styles.recordText}>
                                    {getTypeLabel(record.foodType as FoodType)} - {getPrefLabel(record.preference as Preference)}
                                </Text>
                                {record.comment && (
                                    <Text style={styles.recordComment}>{record.comment}</Text>
                                )}
                            </View>
                        ))}
                    </View>
                )}

                <Button
                    title={saving ? '저장 중...' : '저장하기'}
                    onPress={handleSave}
                    disabled={saving || !selectedType || !selectedPreference}
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
        padding: 16,
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
        fontSize: 28,
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
    recordItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    recordText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    recordComment: {
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

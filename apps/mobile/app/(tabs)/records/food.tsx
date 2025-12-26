import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card, Button } from '../../../components';

type FoodType = '건사료' | '캔' | '기타';
type Preference = '잘먹음' | '보통' | '거부';

const FOOD_TYPES: FoodType[] = ['건사료', '캔', '기타'];
const PREFERENCES: Preference[] = ['잘먹음', '보통', '거부'];

export default function FoodScreen() {
    const [selectedType, setSelectedType] = useState<FoodType | null>(null);
    const [selectedPreference, setSelectedPreference] = useState<Preference | null>(null);
    const [comment, setComment] = useState('');

    const handleSave = () => {
        // TODO: DB 저장
    };

    return (
        <View style={styles.container}>
            <Header title="사료 기호성" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>사료 종류</Text>
                    <View style={styles.optionGroup}>
                        {FOOD_TYPES.map(type => (
                            <Pressable
                                key={type}
                                style={[
                                    styles.option,
                                    selectedType === type && styles.optionSelected,
                                ]}
                                onPress={() => setSelectedType(type)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedType === type && styles.optionTextSelected,
                                    ]}
                                >
                                    {type}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>기호성</Text>
                    <View style={styles.optionGroup}>
                        {PREFERENCES.map(pref => (
                            <Pressable
                                key={pref}
                                style={[
                                    styles.option,
                                    selectedPreference === pref && styles.optionSelected,
                                    pref === '거부' && selectedPreference === pref && styles.optionDanger,
                                ]}
                                onPress={() => setSelectedPreference(pref)}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedPreference === pref && styles.optionTextSelected,
                                    ]}
                                >
                                    {pref === '잘먹음' && '😋 '}
                                    {pref === '보통' && '😐 '}
                                    {pref === '거부' && '😾 '}
                                    {pref}
                                </Text>
                            </Pressable>
                        ))}
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>코멘트</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="사료에 대한 메모 (선택)"
                        placeholderTextColor={COLORS.textSecondary}
                        value={comment}
                        onChangeText={setComment}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </Card>

                <Button
                    title="저장하기"
                    onPress={handleSave}
                    disabled={!selectedType || !selectedPreference}
                    style={styles.saveButton}
                />

                <View style={styles.bottomPadding} />
            </ScrollView>
        </View>
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
        marginBottom: 12,
    },
    optionGroup: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    option: {
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
        backgroundColor: COLORS.surface,
    },
    optionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    optionDanger: {
        borderColor: COLORS.error,
        backgroundColor: COLORS.error,
    },
    optionText: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    optionTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        minHeight: 80,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    bottomPadding: {
        height: 32,
    },
});

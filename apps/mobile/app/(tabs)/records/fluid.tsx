import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card, Button } from '../../../components';

const FLUID_TYPES = ['링거', '하트만', '생리식염수', '기타'];

export default function FluidScreen() {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [volume, setVolume] = useState('');
    const [memo, setMemo] = useState('');

    const today = new Date();
    const dateString = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

    const handleSave = () => {
        // TODO: DB 저장
    };

    return (
        <View style={styles.container}>
            <Header title="수액 기록" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>날짜</Text>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateText}>{dateString}</Text>
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>수액 종류</Text>
                    <View style={styles.optionGroup}>
                        {FLUID_TYPES.map(type => (
                            <View
                                key={type}
                                style={[
                                    styles.option,
                                    selectedType === type && styles.optionSelected,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.optionText,
                                        selectedType === type && styles.optionTextSelected,
                                    ]}
                                    onPress={() => setSelectedType(type)}
                                >
                                    {type}
                                </Text>
                            </View>
                        ))}
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>용량 (ml)</Text>
                    <TextInput
                        style={styles.volumeInput}
                        placeholder="예: 100"
                        placeholderTextColor={COLORS.textSecondary}
                        value={volume}
                        onChangeText={setVolume}
                        keyboardType="numeric"
                    />
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>반응 / 메모</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="수액 후 반응, 특이사항 등"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={3}
                        textAlignVertical="top"
                    />
                </Card>

                <Button
                    title="저장하기"
                    onPress={handleSave}
                    disabled={!selectedType}
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
    dateBox: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    dateText: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
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
    optionText: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
    optionTextSelected: {
        color: COLORS.surface,
        fontWeight: '600',
    },
    volumeInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        color: COLORS.textPrimary,
        textAlign: 'center',
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

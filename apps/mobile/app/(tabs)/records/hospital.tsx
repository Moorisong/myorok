import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card, Button } from '../../../components';

export default function HospitalScreen() {
    const [memo, setMemo] = useState('');

    const today = new Date();
    const dateString = `${today.getFullYear()}.${today.getMonth() + 1}.${today.getDate()}`;

    const handleSave = () => {
        // TODO: DB 저장
    };

    return (
        <View style={styles.container}>
            <Header title="병원 기록" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>방문 날짜</Text>
                    <View style={styles.dateBox}>
                        <Text style={styles.dateText}>{dateString}</Text>
                    </View>
                </Card>

                <Card style={styles.card}>
                    <Text style={styles.sectionTitle}>진단 / 처방 요약</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="진단 내용, 처방받은 약, 치료 내용 등"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                    />
                </Card>

                <Text style={styles.hint}>
                    💡 병원 기록은 차트 화면에서 약 복용 기간과 함께 확인할 수 있습니다.
                </Text>

                <Button
                    title="저장하기"
                    onPress={handleSave}
                    disabled={!memo.trim()}
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
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        minHeight: 150,
    },
    hint: {
        marginHorizontal: 16,
        marginTop: 16,
        fontSize: 14,
        color: COLORS.textSecondary,
        lineHeight: 20,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    bottomPadding: {
        height: 32,
    },
});

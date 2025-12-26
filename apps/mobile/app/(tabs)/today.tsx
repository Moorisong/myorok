import React, { useState, useCallback } from 'react';
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
import { useFocusEffect } from 'expo-router';

import { COLORS } from '../../constants';
import { Button } from '../../components';
import { getTodayRecord, updateDailyRecord, DailyRecord } from '../../services';

type VomitColor = '투명' | '흰색' | '사료토' | '노란색' | '갈색' | '혈색';

const VOMIT_COLORS: VomitColor[] = [
    '투명',
    '흰색',
    '사료토',
    '노란색',
    '갈색',
    '혈색',
];

export default function TodayScreen() {
    const [peeCount, setPeeCount] = useState(0);
    const [poopCount, setPoopCount] = useState(0);
    const [diarrheaCount, setDiarrheaCount] = useState(0);
    const [vomitCount, setVomitCount] = useState(0);
    const [vomitColors, setVomitColors] = useState<VomitColor[]>([]);
    const [memo, setMemo] = useState('');
    const [showVomitColors, setShowVomitColors] = useState(false);
    const [loading, setLoading] = useState(true);

    useFocusEffect(
        useCallback(() => {
            loadTodayRecord();
        }, [])
    );

    const loadTodayRecord = async () => {
        try {
            const todayRecord = await getTodayRecord();
            setPeeCount(todayRecord.peeCount);
            setPoopCount(todayRecord.poopCount);
            setDiarrheaCount(todayRecord.diarrheaCount);
            setVomitCount(todayRecord.vomitCount);
            setMemo(todayRecord.memo || '');

            if (todayRecord.vomitTypes) {
                try {
                    setVomitColors(JSON.parse(todayRecord.vomitTypes));
                } catch {
                    setVomitColors([]);
                }
            }
        } catch (error) {
            // Error handled silently
        } finally {
            setLoading(false);
        }
    };

    const handlePeeAdd = async () => {
        const newCount = peeCount + 1;
        setPeeCount(newCount);
        await updateDailyRecord({ peeCount: newCount });
    };

    const handlePoopAdd = async () => {
        const newCount = poopCount + 1;
        setPoopCount(newCount);
        await updateDailyRecord({ poopCount: newCount });
    };

    const handleDiarrheaAdd = async () => {
        const newCount = diarrheaCount + 1;
        setDiarrheaCount(newCount);
        await updateDailyRecord({ diarrheaCount: newCount });
    };

    const handleVomitAdd = () => {
        setShowVomitColors(true);
    };

    const handleVomitColorSelect = async (color: VomitColor) => {
        const newColors = [...vomitColors, color];
        const newCount = vomitCount + 1;
        setVomitColors(newColors);
        setVomitCount(newCount);
        setShowVomitColors(false);

        await updateDailyRecord({
            vomitCount: newCount,
            vomitTypes: JSON.stringify(newColors),
        });
    };

    const handleSave = async () => {
        try {
            await updateDailyRecord({ memo: memo || null });
            Alert.alert('저장 완료', '오늘의 기록이 저장되었습니다.');
        } catch (error) {
            Alert.alert('오류', '저장 중 문제가 발생했습니다.');
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>로딩 중...</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>배변/배뇨</Text>

                    <View style={styles.counterRow}>
                        <View style={styles.counterInfo}>
                            <Text style={styles.counterEmoji}>💧</Text>
                            <Text style={styles.counterLabel}>소변</Text>
                        </View>
                        <View style={styles.counterControls}>
                            <Text style={styles.counterValue}>{peeCount}회</Text>
                            <Pressable style={styles.addButton} onPress={handlePeeAdd}>
                                <Text style={styles.addButtonText}>+1</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.counterRow}>
                        <View style={styles.counterInfo}>
                            <Text style={styles.counterEmoji}>💩</Text>
                            <Text style={styles.counterLabel}>배변</Text>
                        </View>
                        <View style={styles.counterControls}>
                            <Text style={styles.counterValue}>{poopCount}회</Text>
                            <Pressable style={styles.addButton} onPress={handlePoopAdd}>
                                <Text style={styles.addButtonText}>+1</Text>
                            </Pressable>
                        </View>
                    </View>

                    <View style={styles.counterRow}>
                        <View style={styles.counterInfo}>
                            <Text style={styles.counterEmoji}>🚨</Text>
                            <Text style={styles.counterLabel}>묽은 변</Text>
                        </View>
                        <View style={styles.counterControls}>
                            <Text style={styles.counterValue}>{diarrheaCount}회</Text>
                            <Pressable
                                style={[styles.addButton, styles.warningButton]}
                                onPress={handleDiarrheaAdd}
                            >
                                <Text style={styles.addButtonText}>+1</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>구토</Text>

                    <View style={styles.counterRow}>
                        <View style={styles.counterInfo}>
                            <Text style={styles.counterEmoji}>🤮</Text>
                            <Text style={styles.counterLabel}>구토</Text>
                        </View>
                        <View style={styles.counterControls}>
                            <Text style={styles.counterValue}>{vomitCount}회</Text>
                            <Pressable
                                style={[styles.addButton, styles.warningButton]}
                                onPress={handleVomitAdd}
                            >
                                <Text style={styles.addButtonText}>+1</Text>
                            </Pressable>
                        </View>
                    </View>

                    {showVomitColors && (
                        <View style={styles.colorSelector}>
                            <Text style={styles.colorSelectorTitle}>구토 색상 선택</Text>
                            <View style={styles.colorOptions}>
                                {VOMIT_COLORS.map(color => (
                                    <Pressable
                                        key={color}
                                        style={[
                                            styles.colorOption,
                                            color === '혈색' && styles.dangerOption,
                                        ]}
                                        onPress={() => handleVomitColorSelect(color)}
                                    >
                                        <Text
                                            style={[
                                                styles.colorOptionText,
                                                color === '혈색' && styles.dangerText,
                                            ]}
                                        >
                                            {color}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    )}

                    {vomitColors.length > 0 && (
                        <View style={styles.vomitColorList}>
                            <Text style={styles.vomitColorListLabel}>기록된 구토 색상:</Text>
                            <Text style={styles.vomitColorListValue}>
                                {vomitColors.join(', ')}
                            </Text>
                        </View>
                    )}
                </View>

                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>특이사항</Text>
                    <TextInput
                        style={styles.memoInput}
                        placeholder="특이사항을 입력하세요"
                        placeholderTextColor={COLORS.textSecondary}
                        value={memo}
                        onChangeText={setMemo}
                        multiline
                        numberOfLines={4}
                        textAlignVertical="top"
                    />
                </View>

                <Button
                    title="저장하기"
                    onPress={handleSave}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 16,
    },
    counterRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    counterInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    counterLabel: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    counterControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    counterValue: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginRight: 16,
        minWidth: 50,
        textAlign: 'right',
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    warningButton: {
        backgroundColor: COLORS.warning,
    },
    addButtonText: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: '600',
    },
    colorSelector: {
        marginTop: 16,
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 12,
    },
    colorSelectorTitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 12,
    },
    colorOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    colorOption: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        backgroundColor: COLORS.surface,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    dangerOption: {
        borderColor: COLORS.error,
        backgroundColor: '#FFF5F5',
    },
    colorOptionText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    dangerText: {
        color: COLORS.error,
    },
    vomitColorList: {
        marginTop: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    vomitColorListLabel: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginRight: 8,
    },
    vomitColorListValue: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    memoInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        minHeight: 100,
    },
    saveButton: {
        marginHorizontal: 16,
        marginTop: 24,
    },
    bottomPadding: {
        height: 32,
    },
});

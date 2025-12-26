import { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    ScrollView,
    TextInput,
} from 'react-native';

import { COLORS } from '../../constants';

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

    const handleVomitAdd = () => {
        setVomitCount(prev => prev + 1);
        setShowVomitColors(true);
    };

    const handleVomitColorSelect = (color: VomitColor) => {
        setVomitColors(prev => [...prev, color]);
        setShowVomitColors(false);
    };

    return (
        <ScrollView style={styles.container}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>배변/배뇨</Text>

                <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                        <Text style={styles.counterEmoji}>💧</Text>
                        <Text style={styles.counterLabel}>오줌</Text>
                    </View>
                    <View style={styles.counterControls}>
                        <Text style={styles.counterValue}>{peeCount}회</Text>
                        <Pressable
                            style={styles.addButton}
                            onPress={() => setPeeCount(prev => prev + 1)}
                        >
                            <Text style={styles.addButtonText}>+1</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                        <Text style={styles.counterEmoji}>💩</Text>
                        <Text style={styles.counterLabel}>똥</Text>
                    </View>
                    <View style={styles.counterControls}>
                        <Text style={styles.counterValue}>{poopCount}회</Text>
                        <Pressable
                            style={styles.addButton}
                            onPress={() => setPoopCount(prev => prev + 1)}
                        >
                            <Text style={styles.addButtonText}>+1</Text>
                        </Pressable>
                    </View>
                </View>

                <View style={styles.counterRow}>
                    <View style={styles.counterInfo}>
                        <Text style={styles.counterEmoji}>🚨</Text>
                        <Text style={styles.counterLabel}>설사</Text>
                    </View>
                    <View style={styles.counterControls}>
                        <Text style={styles.counterValue}>{diarrheaCount}회</Text>
                        <Pressable
                            style={[styles.addButton, styles.warningButton]}
                            onPress={() => setDiarrheaCount(prev => prev + 1)}
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
                        {vomitColors.includes('혈색') && (
                            <Text style={styles.warningText}>
                                ⚠️ 혈액이 의심되는 경우 병원 상담을 권장합니다.
                            </Text>
                        )}
                    </View>
                )}

                {vomitColors.length > 0 && (
                    <View style={styles.vomitColorList}>
                        <Text style={styles.vomitColorListLabel}>기록된 색상:</Text>
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

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
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
    warningText: {
        marginTop: 12,
        padding: 12,
        backgroundColor: '#FFF5F5',
        borderRadius: 8,
        color: COLORS.error,
        fontSize: 14,
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
    bottomPadding: {
        height: 32,
    },
});

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
import { useFocusEffect } from 'expo-router';

import { COLORS, ALERT_TITLES, ERROR_MESSAGES, VALIDATION_MESSAGES, UI_LABELS } from '../../../constants';
import { Button, Header } from '../../../components';
import { useToast } from '../../../components/ToastContext';
import {
    addSupplement,
    getSupplements,
    deleteSupplement,
    toggleSupplementTaken,
    getTodaySupplementStatus,
    Supplement
} from '../../../services';

export default function MedicineScreen() {
    const [supplements, setSupplements] = useState<Supplement[]>([]);
    const [takenStatus, setTakenStatus] = useState<Map<string, boolean>>(new Map());
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState<'supplement' | 'medicine'>('medicine');
    const [loading, setLoading] = useState(true);
    const { showToast } = useToast();

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            const [suppList, status] = await Promise.all([
                getSupplements(),
                getTodaySupplementStatus(),
            ]);
            setSupplements(suppList);
            setTakenStatus(status);
        } catch (error) {
            // Error handled silently
        } finally {
            setLoading(false);
        }
    };

    const handleToggle = async (supplementId: string) => {
        try {
            const newState = await toggleSupplementTaken(supplementId);
            setTakenStatus(prev => {
                const newMap = new Map(prev);
                newMap.set(supplementId, newState);
                return newMap;
            });
        } catch (error) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.STATUS_CHANGE_FAILED);
        }
    };

    const handleDelete = (supplement: Supplement) => {
        Alert.alert(
            '약/영양제 삭제',
            `${supplement.name}을(를) 삭제하시겠습니까?\n\n과거 복용 기록은 유지되며, 차트와 캘린더에서 '삭제됨'으로 표시됩니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '삭제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteSupplement(supplement.id);
                            await loadData(); // Refresh list
                            showToast(`${supplement.name}이(가) 삭제되었습니다.`);
                        } catch (error) {
                            Alert.alert(ALERT_TITLES.ERROR, '삭제에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleAdd = async () => {
        if (!newName.trim()) {
            Alert.alert(ALERT_TITLES.ALERT, VALIDATION_MESSAGES.ENTER_NAME);
            return;
        }

        try {
            const newSupplement = await addSupplement(newName.trim(), newType);
            setSupplements(prev => [...prev, newSupplement]);
            setNewName('');
            setShowAddForm(false);
            showToast(`${newName}이(가) 추가되었습니다.`);
        } catch (error) {
            Alert.alert(ALERT_TITLES.ERROR, ERROR_MESSAGES.ADD_FAILED);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header title="약/영양제" showBack />
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>{UI_LABELS.LOADING}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="약/영양제" showBack />
            <ScrollView style={styles.scrollView}>
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>오늘 복용 체크</Text>

                    {supplements.length === 0 ? (
                        <Text style={styles.emptyText}>등록된 약/영양제가 없습니다.</Text>
                    ) : (
                        supplements.map(supplement => (
                            <Pressable
                                key={supplement.id}
                                style={styles.checkItem}
                                onPress={() => handleToggle(supplement.id)}
                                onLongPress={() => handleDelete(supplement)}
                            >
                                <View style={styles.checkInfo}>
                                    <Text style={styles.checkEmoji}>
                                        {supplement.type === 'medicine' ? '💊' : '💉'}
                                    </Text>
                                    <View>
                                        <Text style={styles.checkName}>{supplement.name}</Text>
                                        <Text style={styles.checkType}>
                                            {supplement.type === 'medicine' ? '약' : '영양제'}
                                        </Text>
                                    </View>
                                </View>
                                <View
                                    style={[
                                        styles.checkbox,
                                        takenStatus.get(supplement.id) && styles.checkboxChecked,
                                    ]}
                                >
                                    {takenStatus.get(supplement.id) && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>
                            </Pressable>
                        ))
                    )}
                </View>

                {showAddForm ? (
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>새로 추가</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="이름 (예: 유산균)"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newName}
                            onChangeText={setNewName}
                        />
                        <View style={styles.typeSelector}>
                            <Pressable
                                style={[
                                    styles.typeOption,
                                    newType === 'medicine' && styles.typeOptionSelected,
                                ]}
                                onPress={() => setNewType('medicine')}
                            >
                                <Text style={styles.typeText}>💊 약</Text>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.typeOption,
                                    newType === 'supplement' && styles.typeOptionSelected,
                                ]}
                                onPress={() => setNewType('supplement')}
                            >
                                <Text style={styles.typeText}>💉 영양제</Text>
                            </Pressable>
                        </View>
                        <View style={styles.formButtons}>
                            <Button
                                title="취소"
                                variant="secondary"
                                onPress={() => setShowAddForm(false)}
                                style={styles.formButton}
                            />
                            <Button
                                title="추가"
                                onPress={handleAdd}
                                style={styles.formButton}
                            />
                        </View>
                    </View>
                ) : (
                    <Pressable
                        style={styles.addButton}
                        onPress={() => setShowAddForm(true)}
                    >
                        <Text style={styles.addButtonText}>+ 약/영양제 추가</Text>
                    </Pressable>
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
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    checkItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkEmoji: {
        fontSize: 24,
        marginRight: 12,
    },
    checkName: {
        fontSize: 16,
        color: COLORS.textPrimary,
        fontWeight: '500',
    },
    checkType: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    checkbox: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: COLORS.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.surface,
        fontSize: 16,
        fontWeight: 'bold',
    },
    addButton: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 16,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: 'dashed',
        alignItems: 'center',
    },
    addButtonText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    input: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    typeSelector: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    typeOption: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
        backgroundColor: COLORS.background,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    typeOptionSelected: {
        borderColor: COLORS.primary,
    },
    typeText: {
        fontSize: 14,
        color: COLORS.textPrimary,
    },
    formButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    formButton: {
        flex: 1,
    },
    bottomPadding: {
        height: 32,
    },
});

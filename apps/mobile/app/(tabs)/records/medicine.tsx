import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput } from 'react-native';

import { COLORS } from '../../../constants';
import { Header, Card, Button } from '../../../components';

interface Supplement {
    id: string;
    name: string;
    type: 'medicine' | 'supplement';
    taken: boolean;
}

export default function MedicineScreen() {
    const [supplements, setSupplements] = useState<Supplement[]>([
        { id: '1', name: '유산균', type: 'supplement', taken: false },
        { id: '2', name: '오메가3', type: 'supplement', taken: false },
    ]);
    const [newItemName, setNewItemName] = useState('');
    const [showAddForm, setShowAddForm] = useState(false);

    const toggleTaken = (id: string) => {
        setSupplements(prev =>
            prev.map(item =>
                item.id === id ? { ...item, taken: !item.taken } : item
            )
        );
    };

    const addItem = () => {
        if (!newItemName.trim()) return;

        const newItem: Supplement = {
            id: Date.now().toString(),
            name: newItemName.trim(),
            type: 'supplement',
            taken: false,
        };
        setSupplements(prev => [...prev, newItem]);
        setNewItemName('');
        setShowAddForm(false);
    };

    return (
        <View style={styles.container}>
            <Header title="약 / 영양제" showBack />

            <ScrollView style={styles.content}>
                <Card style={styles.card}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.sectionTitle}>오늘 복용</Text>
                        <Pressable onPress={() => setShowAddForm(true)}>
                            <Text style={styles.addButton}>+ 추가</Text>
                        </Pressable>
                    </View>

                    {supplements.length === 0 ? (
                        <Text style={styles.emptyText}>등록된 약/영양제가 없습니다.</Text>
                    ) : (
                        supplements.map(item => (
                            <Pressable
                                key={item.id}
                                style={styles.item}
                                onPress={() => toggleTaken(item.id)}
                            >
                                <View style={styles.checkbox}>
                                    {item.taken && <Text style={styles.checkmark}>✓</Text>}
                                </View>
                                <Text style={[styles.itemName, item.taken && styles.itemNameTaken]}>
                                    {item.name}
                                </Text>
                            </Pressable>
                        ))
                    )}
                </Card>

                {showAddForm && (
                    <Card style={styles.card}>
                        <Text style={styles.sectionTitle}>새 항목 추가</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="약/영양제 이름"
                            placeholderTextColor={COLORS.textSecondary}
                            value={newItemName}
                            onChangeText={setNewItemName}
                            autoFocus
                        />
                        <View style={styles.formButtons}>
                            <Button
                                title="취소"
                                variant="secondary"
                                onPress={() => {
                                    setShowAddForm(false);
                                    setNewItemName('');
                                }}
                                style={styles.formButton}
                            />
                            <Button
                                title="추가"
                                onPress={addItem}
                                disabled={!newItemName.trim()}
                                style={styles.formButton}
                            />
                        </View>
                    </Card>
                )}

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
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    addButton: {
        fontSize: 15,
        color: COLORS.primary,
        fontWeight: '600',
    },
    emptyText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        paddingVertical: 20,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: COLORS.primary,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkmark: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: 'bold',
    },
    itemName: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    itemNameTaken: {
        textDecorationLine: 'line-through',
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

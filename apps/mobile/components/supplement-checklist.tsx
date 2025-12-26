import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

import { COLORS } from '../constants';
import { Supplement } from '../services';

interface SupplementChecklistProps {
    supplements: Supplement[];
    takenStatus: Map<string, boolean>;
    onToggle: (supplementId: string) => void;
}

export default function SupplementChecklist({
    supplements,
    takenStatus,
    onToggle,
}: SupplementChecklistProps) {
    if (supplements.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>약 / 영양제</Text>
            {supplements.map(supp => (
                <Pressable
                    key={supp.id}
                    style={styles.checkItem}
                    onPress={() => onToggle(supp.id)}
                >
                    <View style={[styles.checkbox, takenStatus.get(supp.id) && styles.checkboxChecked]}>
                        {takenStatus.get(supp.id) && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkLabel}>{supp.name}</Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    checkItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: COLORS.border,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    checkmark: {
        color: COLORS.surface,
        fontWeight: 'bold',
    },
    checkLabel: {
        fontSize: 15,
        color: COLORS.textPrimary,
    },
});

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '../constants';

interface HeaderProps {
    title: string;
    showBack?: boolean;
}

export default function Header({ title, showBack = false }: HeaderProps) {
    const router = useRouter();

    return (
        <View style={styles.header}>
            {showBack ? (
                <Pressable style={styles.backButton} onPress={() => router.back()}>
                    <Text style={styles.backText}>←</Text>
                </Pressable>
            ) : (
                <View style={styles.placeholder} />
            )}
            <Text style={styles.title}>{title}</Text>
            <View style={styles.placeholder} />
        </View>
    );
}

const styles = StyleSheet.create({
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backText: {
        fontSize: 24,
        color: COLORS.textPrimary,
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 40,
    },
});

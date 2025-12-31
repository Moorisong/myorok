import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';

interface MenuItemProps {
    emoji: string;
    title: string;
    description: string;
    onPress: () => void;
}

function MenuItem({ emoji, title, description, onPress }: MenuItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.menuItem, pressed && styles.menuItemPressed]}
            onPress={onPress}
        >
            <Text style={styles.menuEmoji}>{emoji}</Text>
            <View style={styles.menuContent}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuDescription}>{description}</Text>
            </View>
            <Text style={styles.menuArrow}>›</Text>
        </Pressable>
    );
}

export default function RecordsScreen() {
    const router = useRouter();

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>기록</Text>
                <Text style={styles.headerSubtitle}>카테고리별 상세 기록을 관리하세요</Text>
            </View>

            <Card style={styles.card}>

                <MenuItem
                    emoji="💊"
                    title="약 / 영양제"
                    description="복용 기록 관리"
                    onPress={() => router.push('/(tabs)/records/medicine')}
                />

                <MenuItem
                    emoji="💉"
                    title="수액 기록"
                    description="수액 투여 기록"
                    onPress={() => router.push('/(tabs)/records/fluid')}
                />
                <MenuItem
                    emoji="📈"
                    title="커스텀 수치"
                    description="혈액검사 등 사용자 정의 수치"
                    onPress={() => router.push('/(tabs)/records/custom-metrics')}
                />
            </Card>

            <View style={styles.bottomPadding} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        padding: 20,
        paddingTop: 60,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    card: {
        marginHorizontal: 16,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    menuItemPressed: {
        opacity: 0.7,
    },
    menuEmoji: {
        fontSize: 28,
        marginRight: 16,
    },
    menuContent: {
        flex: 1,
    },
    menuTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 2,
    },
    menuDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    menuArrow: {
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    bottomPadding: {
        height: 32,
    },
});

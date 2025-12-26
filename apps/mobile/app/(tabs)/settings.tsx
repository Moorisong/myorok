import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants';
import { Card } from '../../components';

interface SettingItemProps {
    emoji: string;
    title: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
}

function SettingItem({ emoji, title, description, onPress, danger }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [styles.settingItem, pressed && styles.settingItemPressed]}
            onPress={onPress}
        >
            <Text style={styles.settingEmoji}>{emoji}</Text>
            <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
                {description && <Text style={styles.settingDescription}>{description}</Text>}
            </View>
            <Text style={styles.arrow}>›</Text>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();

    const handlePinSetup = () => {
        Alert.alert('잠금 설정', '잠금 기능은 추후 업데이트에서 제공될 예정입니다.');
    };

    const handleBackup = () => {
        Alert.alert('백업', '백업 기능은 추후 업데이트에서 제공될 예정입니다.');
    };

    const handleRestore = () => {
        Alert.alert('복원', '복원 기능은 추후 업데이트에서 제공될 예정입니다.');
    };

    const handleReset = () => {
        Alert.alert(
            '데이터 초기화',
            '모든 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: () => { } },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>설정</Text>
                </View>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🔒"
                        title="잠금(PIN) 설정"
                        description="앱 접근 보호"
                        onPress={handlePinSetup}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="☁️"
                        title="데이터 백업"
                        description="기록을 안전하게 백업하세요"
                        onPress={handleBackup}
                    />
                    <SettingItem
                        emoji="⬇️"
                        title="데이터 복원"
                        description="백업한 기록을 복원합니다"
                        onPress={handleRestore}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="⭐"
                        title="Pro 업그레이드"
                        description="모든 기록을 무제한으로"
                        onPress={() => router.push('/pro')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="ℹ️"
                        title="앱 정보"
                        description="묘록 v1.0.0"
                        onPress={() => router.push('/about')}
                    />
                    <SettingItem
                        emoji="📄"
                        title="개인정보 처리방침"
                        onPress={() => { }}
                    />
                    <SettingItem
                        emoji="📋"
                        title="이용약관"
                        onPress={() => { }}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🗑️"
                        title="데이터 초기화"
                        description="모든 기록을 삭제합니다"
                        onPress={handleReset}
                        danger
                    />
                </Card>

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
    header: {
        padding: 20,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 12,
    },
    settingItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    settingItemPressed: {
        opacity: 0.7,
    },
    settingEmoji: {
        fontSize: 22,
        marginRight: 14,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    settingDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    arrow: {
        fontSize: 20,
        color: COLORS.textSecondary,
    },
    dangerText: {
        color: COLORS.error,
    },
    bottomPadding: {
        height: 32,
    },
});

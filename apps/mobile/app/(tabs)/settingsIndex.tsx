import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../constants';
import { Card } from '../../components';
import { useSelectedPet } from '../../hooks/use-selected-pet';
import { usePinLock } from '../../hooks/use-pin-lock';

interface SettingItemProps {
    emoji: string;
    title: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
    disabled?: boolean;
}

function SettingItem({ emoji, title, description, onPress, danger, disabled }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.settingItem,
                pressed && !disabled && styles.settingItemPressed,
                disabled && styles.settingItemDisabled,
            ]}
            onPress={disabled ? undefined : onPress}
            disabled={disabled}
        >
            <Text style={styles.settingEmoji}>{emoji}</Text>
            <View style={styles.settingContent}>
                <Text style={[
                    styles.settingTitle,
                    danger && styles.dangerText,
                    disabled && styles.disabledText,
                ]}>
                    {title}
                </Text>
                {description && (
                    <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
                        {description}
                    </Text>
                )}
            </View>
            <Text style={styles.arrow}>›</Text>
        </Pressable>
    );
}

export default function SettingsScreen() {
    const router = useRouter();
    const { selectedPet } = useSelectedPet();
    const { isPinSet, refreshPinStatus, resetInactivityTimer } = usePinLock();

    useFocusEffect(
        useCallback(() => {
            refreshPinStatus();
        }, [refreshPinStatus])
    );

    // 사용자 활동 시 무활동 타이머 리셋
    const handleUserActivity = useCallback(() => {
        resetInactivityTimer();
    }, [resetInactivityTimer]);

    const handleReset = () => {
        handleUserActivity();

        Alert.alert(
            '데이터 초기화',
            '모든 기록이 삭제됩니다. 이 작업은 되돌릴 수 없습니다.',
            [
                { text: '취소', style: 'cancel' },
                { text: '초기화', style: 'destructive', onPress: () => { } },
            ]
        );
    };

    const handleNavigate = (path: string) => {
        handleUserActivity();
        router.push(path as any);
    };

    const getPinDescription = () => {
        if (isPinSet) {
            return '설정됨';
        }
        return '앱 접근 보호';
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>

                {/* Pet Indicator */}
                <View style={styles.petIndicatorRow}>
                    <View style={styles.petIndicator}>
                        <Text style={styles.petName} numberOfLines={1}>{selectedPet?.name || ''}</Text>
                    </View>
                </View>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>설정</Text>
                </View>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🐱"
                        title="고양이 관리"
                        description="고양이 추가/편집/삭제"
                        onPress={() => handleNavigate('/settings/pets')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="🔒"
                        title="잠금(PIN) 설정"
                        description={getPinDescription()}
                        onPress={() => handleNavigate('/settings/pin')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="⭐"
                        title="Pro 업그레이드"
                        description="모든 기록을 무제한으로"
                        onPress={() => handleNavigate('/pro')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        emoji="ℹ️"
                        title="앱 정보"
                        description="묘록 v1.0.0"
                        onPress={() => handleNavigate('/about')}
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
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
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
    settingItemDisabled: {
        opacity: 0.5,
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
    disabledText: {
        color: COLORS.textSecondary,
    },
    bottomPadding: {
        height: 32,
    },
    petIndicatorRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingTop: 12,
    },
    petIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F0F0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        maxWidth: 100,
    },
    petEmoji: {
        fontSize: 12,
        marginRight: 4,
    },
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
});

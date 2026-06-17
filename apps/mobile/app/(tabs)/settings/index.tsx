import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';
import { useSelectedPet } from '../../../hooks/use-selected-pet';
import { useAuth } from '../../../hooks/useAuth';
import { getCurrentUser } from '../../../services/auth';
import type { User } from '../../../services/auth';

interface SettingItemProps {
    title: string;
    description?: string;
    onPress: () => void;
    danger?: boolean;
}

function SettingItem({ title, description, onPress, danger }: SettingItemProps) {
    return (
        <Pressable
            style={({ pressed }) => [
                styles.settingItem,
                pressed && styles.settingItemPressed,
            ]}
            onPress={onPress}
        >
            <View style={styles.settingContent}>
                <Text style={[
                    styles.settingTitle,
                    danger && styles.dangerText,
                ]}>
                    {title}
                </Text>
                {description && (
                    <Text style={styles.settingDescription}>
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
    const { logout: authLogout, isAdmin } = useAuth();


    const [currentUser, setCurrentUser] = useState<User | null>(null);


    useFocusEffect(
        useCallback(() => {
            loadCurrentUser();
        }, [])
    );

    const loadCurrentUser = async () => {
        const user = await getCurrentUser();
        setCurrentUser(user);
    };


    const handleLogout = async () => {
        Alert.alert(
            '로그아웃',
            '정말 로그아웃하시겠습니까?',
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '로그아웃',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await authLogout();
                            // Auth context will update isLoggedIn, triggering login screen
                        } catch (error) {
                            console.error('[Settings] Logout error:', error);
                            Alert.alert('오류', '로그아웃에 실패했습니다.');
                        }
                    },
                },
            ]
        );
    };

    const handleReset = () => {
        const petName = selectedPet?.name || '현재 고양이';
        Alert.alert(
            '⚠️ 데이터 초기화',
            `"${petName}"의 모든 기록이 삭제됩니다.\n\n다른 고양이의 기록은 영향을 받지 않습니다.\n\n삭제된 데이터는 복구할 수 없습니다.\n\n정말 초기화하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '확인',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { resetAllData } = await import('../../../services/database');
                            await resetAllData();
                            Alert.alert('완료', `"${petName}"의 모든 기록이 초기화되었습니다.`);
                        } catch (error) {
                            console.error('[Settings] Reset failed:', error);
                            Alert.alert('오류', '초기화에 실패했습니다. 다시 시도해 주세요.');
                        }
                    },
                },
            ]
        );
    };

    const handleNavigate = (path: string) => {
        router.navigate(path as any);
    };



    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* Pet Indicator */}
                <View style={styles.petIndicatorRow}>
                    <Pressable
                        style={styles.petIndicator}
                        onPress={() => router.push('/(tabs)/settings/pets')}
                    >
                        <Text style={styles.petName} numberOfLines={1} pointerEvents="none">{selectedPet?.name || ''}</Text>
                    </Pressable>
                </View>

                <View style={styles.header}>
                    <Text style={styles.headerTitle}>설정</Text>
                </View>

                {/* 계정 섹션 */}
                {currentUser && (
                    <Card style={styles.card}>
                        <View style={styles.accountSection}>
                            <View style={styles.accountInfo}>
                                <Text style={styles.accountLabel}>로그인 계정</Text>
                                <Text style={styles.accountNickname}>{currentUser.nickname}</Text>
                            </View>
                        </View>
                    </Card>
                )}

                <Card style={styles.card}>
                    <SettingItem
                        title="고양이 관리"
                        description="고양이 추가/편집/삭제"
                        onPress={() => handleNavigate('/settings/pets')}
                    />
                    <SettingItem
                        title="차단 목록 관리"
                        description="쉼터 차단 사용자 관리"
                        onPress={() => handleNavigate('/settings/block-list')}
                    />
                </Card>



                <Card style={styles.card}>
                    <SettingItem
                        title="알림 설정"
                        description="댓글, 미활동 알림 관리"
                        onPress={() => handleNavigate('/settings/notifications')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        title="참고용 메모 보관함 (베타)"
                        description="사료 기호성 / 약물 메모를 간단히 저장해둘 수 있어요"
                        onPress={() => handleNavigate('/settings/reference-memos')}
                    />
                </Card>

                {/* 운영자 전용 섹션 */}
                {isAdmin && (
                    <Card style={styles.card}>
                        <SettingItem
                            title="운영자 대시보드"
                            description="서비스 현황 확인"
                            onPress={() => handleNavigate('/admin/dashboard')}
                        />
                    </Card>
                )}


                {__DEV__ && (
                    <Card style={styles.card}>
                        <SettingItem
                            title="1년 테스트 데이터 생성 (Dev)"
                            description="365일치 무작위 기록 생성"
                            onPress={async () => {
                                Alert.alert(
                                    '테스트 데이터 생성',
                                    '1년(365일)치 무작위 데이터를 생성합니다. 기존 데이터가 없는 날짜에만 추가됩니다.',
                                    [
                                        { text: '취소', style: 'cancel' },
                                        {
                                            text: '생성',
                                            onPress: async () => {
                                                try {
                                                    const { generateTestData } = await import('../../../services/testDataGenerator');
                                                    const result = await generateTestData();
                                                    Alert.alert('완료', `${result.recordsCreated}개의 기록이 생성되었습니다.`);
                                                } catch (error) {
                                                    console.error('Test data generation failed:', error);
                                                    Alert.alert('오류', '데이터 생성에 실패했습니다.');
                                                }
                                            },
                                        },
                                    ]
                                );
                            }}
                        />
                    </Card>
                )}

                <Card style={styles.card}>
                    <SettingItem
                        title="앱 정보"
                        description="묘록 v1.0.0"
                        onPress={() => handleNavigate('/settings/about')}
                    />
                    <SettingItem
                        title="개인정보 처리방침"
                        onPress={() => Linking.openURL('https://myorok.vercel.app/privacy')}
                    />
                    <SettingItem
                        title="이용약관"
                        onPress={() => Linking.openURL('https://myorok.vercel.app/terms')}
                    />
                </Card>

                <Card style={styles.card}>
                    <SettingItem
                        title="데이터 초기화"
                        description={`${selectedPet?.name || '현재 고양이'}의 모든 기록 삭제`}
                        onPress={handleReset}
                        danger
                    />
                </Card>

                {/* 로그아웃 버튼 */}
                {currentUser ? (
                    <View style={styles.logoutContainer}>
                        <Pressable
                            style={styles.smallLogoutButton}
                            onPress={handleLogout}
                        >
                            <Text style={styles.smallLogoutText}>로그아웃</Text>
                        </Pressable>
                    </View>
                ) : null}

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
    testStatusBanner: {
        backgroundColor: '#FFF3CD',
        padding: 12,
        borderRadius: 8,
        marginBottom: 8,
    },
    testStatusText: {
        color: '#856404',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
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
    petName: {
        fontSize: 12,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    accountSection: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    accountInfo: {
        flex: 1,
    },
    accountLabel: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    accountNickname: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    logoutButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: COLORS.lightGray,
    },
    logoutButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.error,
    },
    logoutContainer: {
        alignItems: 'center',
        paddingTop: 25,
    },
    smallLogoutButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    smallLogoutText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        opacity: 0.5,
    },
});

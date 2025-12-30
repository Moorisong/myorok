import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

import { COLORS } from '../../../constants';
import { Card } from '../../../components';
import { getBlockedUsers, unblockUser } from '../../../services/comfort';

interface BlockedUser {
    blockedDeviceId: string;
    displayId: string;
    createdAt: string;
}

export default function BlockListScreen() {
    const router = useRouter();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [unblockingId, setUnblockingId] = useState<string | null>(null);

    const loadBlockedUsers = useCallback(async () => {
        try {
            const response = await getBlockedUsers();
            if (response.success && response.data) {
                setBlockedUsers(response.data.blockedDevices);
            }
        } catch (error) {
            console.error('Failed to load blocked users:', error);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadBlockedUsers();
        }, [loadBlockedUsers])
    );

    const handleRefresh = () => {
        setIsRefreshing(true);
        loadBlockedUsers();
    };

    const handleUnblock = (user: BlockedUser) => {
        Alert.alert(
            '차단 해제',
            `${user.displayId}님의 차단을 해제하시겠습니까?\n\n해제 후 이 사용자의 글과 댓글이 다시 표시됩니다.`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    style: 'destructive',
                    onPress: () => confirmUnblock(user),
                },
            ]
        );
    };

    const confirmUnblock = async (user: BlockedUser) => {
        setUnblockingId(user.blockedDeviceId);
        try {
            const response = await unblockUser(user.blockedDeviceId);
            if (response.success) {
                setBlockedUsers(prev =>
                    prev.filter(u => u.blockedDeviceId !== user.blockedDeviceId)
                );
                Alert.alert('완료', '차단이 해제되었습니다.');
            } else {
                Alert.alert('오류', response.error?.message || '차단 해제에 실패했습니다.');
            }
        } catch (error) {
            Alert.alert('오류', '차단 해제 중 오류가 발생했습니다.');
        } finally {
            setUnblockingId(null);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getDate().toString().padStart(2, '0')}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                    hitSlop={8}
                >
                    <Feather name="arrow-left" size={24} color={COLORS.textPrimary} />
                </Pressable>
                <Text style={styles.headerTitle}>차단 목록 관리</Text>
                <View style={styles.placeholder} />
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : blockedUsers.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Feather name="user-check" size={48} color={COLORS.textSecondary} />
                    <Text style={styles.emptyTitle}>차단한 사용자가 없습니다</Text>
                    <Text style={styles.emptyDescription}>
                        쉼터에서 차단한 사용자가 여기에 표시됩니다
                    </Text>
                </View>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            tintColor={COLORS.primary}
                        />
                    }
                >
                    <View style={styles.infoSection}>
                        <Text style={styles.infoText}>
                            차단된 사용자의 글과 댓글은 쉼터에서 보이지 않습니다.{'\n'}
                            차단을 해제하면 다시 표시됩니다.
                        </Text>
                    </View>

                    <Card style={styles.card}>
                        {blockedUsers.map((user, index) => (
                            <View
                                key={user.blockedDeviceId}
                                style={[
                                    styles.userItem,
                                    index < blockedUsers.length - 1 && styles.userItemBorder,
                                ]}
                            >
                                <View style={styles.userInfo}>
                                    <Text style={styles.displayId}>{user.displayId}</Text>
                                    <Text style={styles.blockedDate}>
                                        차단일: {formatDate(user.createdAt)}
                                    </Text>
                                </View>
                                <Pressable
                                    style={({ pressed }) => [
                                        styles.unblockButton,
                                        pressed && styles.unblockButtonPressed,
                                        unblockingId === user.blockedDeviceId && styles.unblockButtonDisabled,
                                    ]}
                                    onPress={() => handleUnblock(user)}
                                    disabled={unblockingId === user.blockedDeviceId}
                                >
                                    {unblockingId === user.blockedDeviceId ? (
                                        <ActivityIndicator size="small" color={COLORS.error} />
                                    ) : (
                                        <Text style={styles.unblockButtonText}>해제</Text>
                                    )}
                                </Pressable>
                            </View>
                        ))}
                    </Card>

                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: COLORS.surface,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    placeholder: {
        width: 32,
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginTop: 16,
    },
    emptyDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
    infoSection: {
        marginHorizontal: 16,
        marginTop: 16,
        padding: 12,
        backgroundColor: '#FFF8E1',
        borderRadius: 8,
    },
    infoText: {
        fontSize: 13,
        color: '#856404',
        lineHeight: 18,
    },
    card: {
        marginHorizontal: 16,
        marginTop: 16,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
    },
    userItemBorder: {
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    userInfo: {
        flex: 1,
    },
    displayId: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textPrimary,
    },
    blockedDate: {
        fontSize: 13,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    unblockButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.error,
        minWidth: 60,
        alignItems: 'center',
    },
    unblockButtonPressed: {
        backgroundColor: '#FFEBEE',
    },
    unblockButtonDisabled: {
        opacity: 0.5,
    },
    unblockButtonText: {
        fontSize: 14,
        fontWeight: '500',
        color: COLORS.error,
    },
    bottomPadding: {
        height: 32,
    },
});

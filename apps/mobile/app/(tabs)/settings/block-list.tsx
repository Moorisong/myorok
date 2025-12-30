import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Alert,
    Pressable,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { COLORS, COMFORT_MESSAGES, UI_LABELS } from '../../../constants';
import { Header } from '../../../components';
import { useToast } from '../../../components/ToastContext';
import { getBlockedUsers, unblockUser } from '../../../services';

interface BlockedUser {
    blockedDeviceId: string;
    displayId: string;
    createdAt: string;
}

export default function BlockListScreen() {
    const router = useRouter();
    const { showToast } = useToast();
    const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const loadBlockedUsers = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);
        try {
            const response = await getBlockedUsers();
            if (response.success && response.data) {
                setBlockedUsers(response.data.blockedDevices);
            } else {
                // Silently fail or minimal feedback
            }
        } catch (error) {
            console.error(error);
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

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadBlockedUsers(false);
    }, [loadBlockedUsers]);

    const handleUnblock = (user: BlockedUser) => {
        Alert.alert(
            COMFORT_MESSAGES.UNBLOCK,
            `${user.displayId} 님의 차단을 해제하시겠습니까?`,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: '해제',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const response = await unblockUser(user.blockedDeviceId);
                            if (response.success) {
                                setBlockedUsers(prev => prev.filter(u => u.blockedDeviceId !== user.blockedDeviceId));
                                showToast(COMFORT_MESSAGES.UNBLOCK_SUCCESS);
                            } else {
                                Alert.alert('오류', response.error?.message || '차단 해제에 실패했습니다.');
                            }
                        } catch (error) {
                            Alert.alert('오류', '차단 해제 중 문제가 발생했습니다.');
                        }
                    }
                }
            ]
        );
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.getFullYear()}.${date.getMonth() + 1}.${date.getDate()}`;
    };

    const renderItem = ({ item }: { item: BlockedUser }) => (
        <View style={styles.itemContainer}>
            <View style={styles.itemContent}>
                <Text style={styles.itemTitle}>{item.displayId}</Text>
                <Text style={styles.itemDate}>차단일: {formatDate(item.createdAt)}</Text>
            </View>
            <Pressable
                style={({ pressed }) => [
                    styles.unblockButton,
                    pressed && styles.unblockButtonPressed
                ]}
                onPress={() => handleUnblock(item)}
            >
                <Text style={styles.unblockButtonText}>해제</Text>
            </Pressable>
        </View>
    );

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <Feather name="shield" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>차단한 사용자가 없습니다</Text>
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top']}>
                <Header title="차단 목록 관리" showBack />
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <Header title="차단 목록 관리" showBack />
            <FlatList
                data={blockedUsers}
                renderItem={renderItem}
                keyExtractor={item => item.blockedDeviceId}
                contentContainerStyle={[
                    styles.listContent,
                    blockedUsers.length === 0 && styles.listContentEmpty
                ]}
                ListEmptyComponent={renderEmpty}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        tintColor={COLORS.primary}
                    />
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    listContentEmpty: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    itemContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: COLORS.surface,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    itemContent: {
        flex: 1,
        marginRight: 16,
    },
    itemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    itemDate: {
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    unblockButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: COLORS.background,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    unblockButtonPressed: {
        backgroundColor: COLORS.border,
    },
    unblockButtonText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    emptyText: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
});

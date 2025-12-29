import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    RefreshControl,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';

import { COLORS, COMFORT_MESSAGES } from '../../constants';
import { ComfortPost, getPosts, createPost, toggleLike, deletePost, blockUser, reportPost } from '../../services';
import { ComfortPostCard, ComfortComposeModal } from '../../components';

export default function ComfortScreen() {
    const [posts, setPosts] = useState<ComfortPost[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [serverAvailable, setServerAvailable] = useState(true);
    const [canPost, setCanPost] = useState(true);
    const [waitMinutes, setWaitMinutes] = useState<number | undefined>();
    const [showComposeModal, setShowComposeModal] = useState(false);
    const [skipCooldown, setSkipCooldown] = useState(false);

    const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const loadPosts = useCallback(async (showLoading = true) => {
        if (showLoading) setIsLoading(true);

        try {
            const response = await getPosts();

            if (response.success && response.data) {
                setPosts(response.data.posts);
                setCanPost(response.data.canPost);
                setWaitMinutes(response.data.waitMinutes);
                setServerAvailable(true);
            } else if (response.error?.code === 'NETWORK_ERROR') {
                setServerAvailable(false);
            }
        } catch {
            setServerAvailable(false);
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            loadPosts();

            // 30초마다 폴링
            pollingRef.current = setInterval(() => {
                loadPosts(false);
            }, 30000);

            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current);
                }
            };
        }, [loadPosts])
    );

    const handleRefresh = useCallback(() => {
        setIsRefreshing(true);
        loadPosts(false);
    }, [loadPosts]);

    const handleComposePress = () => {
        if (!canPost && waitMinutes) {
            Alert.alert(
                COMFORT_MESSAGES.POST_LIMIT_TITLE,
                COMFORT_MESSAGES.POST_LIMIT_MESSAGE(waitMinutes)
            );
            return;
        }
        setShowComposeModal(true);
    };

    const handlePostSubmit = async (content: string): Promise<{ success: boolean; error?: string }> => {
        const response = await createPost(content, skipCooldown);

        if (response.success && response.data) {
            setPosts(prev => [response.data!.post, ...prev]);
            setCanPost(false);
            setWaitMinutes(60);
            setSkipCooldown(false); // 한 번 사용 후 리셋
            return { success: true };
        }

        return { success: false, error: response.error?.message };
    };

    const handleLike = async (postId: string) => {
        const response = await toggleLike(postId);

        if (response.success && response.data) {
            setPosts(prev => prev.map(post =>
                post.id === postId
                    ? { ...post, isLiked: response.data!.isLiked, likeCount: response.data!.likeCount }
                    : post
            ));
        }
    };

    const handleDelete = async (postId: string) => {
        Alert.alert(
            COMFORT_MESSAGES.DELETE_CONFIRM,
            COMFORT_MESSAGES.DELETE_POST_DETAIL,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: COMFORT_MESSAGES.DELETE,
                    style: 'destructive',
                    onPress: async () => {
                        const response = await deletePost(postId);
                        if (response.success) {
                            setPosts(prev => prev.filter(post => post.id !== postId));
                        }
                    },
                },
            ]
        );
    };

    const handleBlock = async (postId: string, deviceId: string) => {
        Alert.alert(
            COMFORT_MESSAGES.BLOCK,
            COMFORT_MESSAGES.BLOCK_DETAIL,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: COMFORT_MESSAGES.BLOCK,
                    style: 'destructive',
                    onPress: async () => {
                        const response = await blockUser(deviceId);
                        if (response.success) {
                            setPosts(prev => prev.filter(post => post.deviceId !== deviceId));
                            Alert.alert('완료', COMFORT_MESSAGES.BLOCK_SUCCESS);
                        }
                    },
                },
            ]
        );
    };

    const handleReport = async (postId: string) => {
        Alert.alert(
            COMFORT_MESSAGES.REPORT,
            '신고 사유를 선택해주세요',
            [
                ...COMFORT_MESSAGES.REPORT_REASONS.map(reason => ({
                    text: reason,
                    onPress: async () => {
                        const response = await reportPost(postId, reason);
                        if (response.success) {
                            Alert.alert('완료', COMFORT_MESSAGES.REPORT_SUCCESS);
                        }
                    },
                })),
                { text: '취소', style: 'cancel' },
            ]
        );
    };

    const renderEmptyState = () => {
        if (!serverAvailable) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyIcon}>🐱</Text>
                    <Text style={styles.emptyTitle}>{COMFORT_MESSAGES.SERVER_PREPARING}</Text>
                    <Text style={styles.emptyDescription}>{COMFORT_MESSAGES.SERVER_PREPARING_DETAIL}</Text>
                </View>
            );
        }

        return (
            <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>💬</Text>
                <Text style={styles.emptyTitle}>{COMFORT_MESSAGES.EMPTY_STATE}</Text>
                <Text style={styles.emptyDescription}>{COMFORT_MESSAGES.EMPTY_STATE_DETAIL}</Text>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Spacer to match other tabs (petIndicatorRow height) */}
            <View style={styles.topSpacer} />

            <View style={styles.header}>
                <View style={styles.headerRow}>
                    <Text style={styles.headerTitle}>{COMFORT_MESSAGES.TAB_TITLE}</Text>
                    <Pressable
                        style={styles.devButton}
                        onPress={() => {
                            setCanPost(true);
                            setWaitMinutes(undefined);
                            setSkipCooldown(true);
                            Alert.alert('🧪 테스트', '글쓰기 쿨타임이 초기화되었습니다!');
                        }}
                    >
                        <Text style={styles.devButtonText}>🧪 쿨타임 리셋</Text>
                    </Pressable>
                </View>
                <Text style={styles.headerSubtitle}>{COMFORT_MESSAGES.TAB_SUBTITLE}</Text>
            </View>

            {/* 자정 삭제 안내 배너 */}
            <View style={styles.noticeBanner}>
                <Text style={styles.noticeText}>{COMFORT_MESSAGES.MIDNIGHT_NOTICE}</Text>
            </View>

            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
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
                    {posts.length === 0 ? (
                        renderEmptyState()
                    ) : (
                        posts.map(post => (
                            <ComfortPostCard
                                key={post.id}
                                post={post}
                                onLike={() => handleLike(post.id)}
                                onDelete={() => handleDelete(post.id)}
                                onBlock={() => handleBlock(post.id, post.deviceId)}
                                onReport={() => handleReport(post.id)}
                            />
                        ))
                    )}
                    <View style={styles.bottomPadding} />
                </ScrollView>
            )}

            {/* FAB 글쓰기 버튼 */}
            {serverAvailable && (
                <Pressable
                    style={({ pressed }) => [
                        styles.fab,
                        pressed && styles.fabPressed,
                        !canPost && styles.fabDisabled,
                    ]}
                    onPress={handleComposePress}
                >
                    <Feather name="edit-3" size={24} color="#FFF" />
                </Pressable>
            )}

            <ComfortComposeModal
                visible={showComposeModal}
                onClose={() => setShowComposeModal(false)}
                onSubmit={handlePostSubmit}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 12,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    devButton: {
        backgroundColor: '#FFE0B2',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    devButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#E65100',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
    },
    headerSubtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
    noticeBanner: {
        backgroundColor: '#E8F5E9',
        paddingVertical: 10,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        borderRadius: 8,
        marginBottom: 8,
    },
    noticeText: {
        fontSize: 13,
        color: '#2E7D32',
        textAlign: 'center',
    },
    scrollView: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 16,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    emptyDescription: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    bottomPadding: {
        height: 100,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    fabPressed: {
        opacity: 0.8,
        transform: [{ scale: 0.95 }],
    },
    fabDisabled: {
        backgroundColor: COLORS.textSecondary,
    },
    topSpacer: {
        height: 29, // Same as petIndicatorRow (paddingTop: 12 + paddingVertical: 5 + fontSize: 12 approximate)
    },
});

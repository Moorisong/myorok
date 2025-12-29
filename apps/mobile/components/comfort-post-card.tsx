import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, Keyboard, Platform, ActionSheetIOS } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, COMFORT_MESSAGES } from '../constants';
import { ComfortPost, ComfortComment, getComments, createComment, deleteComment } from '../services';

interface ComfortPostCardProps {
    post: ComfortPost;
    onLike: () => void;
    onDelete: () => void;
    onBlock: () => void;
    onReport: () => void;
    onUpdate?: () => void;
}

export function ComfortPostCard({
    post,
    onLike,
    onDelete,
    onBlock,
    onReport,
    onUpdate,
}: ComfortPostCardProps) {
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState<ComfortComment[]>([]);
    const [isLoadingComments, setIsLoadingComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMinutes = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMinutes < 1) return '방금 전';
        if (diffMinutes < 60) return `${diffMinutes}분 전`;
        if (diffHours < 24) return `${diffHours}시간 전`;
        return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    };

    const handleToggleComments = async () => {
        if (showComments) {
            setShowComments(false);
            return;
        }

        setIsLoadingComments(true);
        try {
            const response = await getComments(post.id);
            if (response.success && response.data) {
                setComments(response.data.comments);
            }
        } catch {
            // 조용히 처리
        } finally {
            setIsLoadingComments(false);
            setShowComments(true);
        }
    };

    const handleSubmitComment = async () => {
        if (!commentText.trim() || isSubmitting) return;

        Keyboard.dismiss();
        setIsSubmitting(true);
        try {
            const response = await createComment(post.id, commentText.trim());
            if (response.success && response.data) {
                setComments(prev => [...prev, response.data!.comment]);
                setCommentText('');
            } else if (response.error) {
                Alert.alert('알림', response.error.message || '댓글 작성에 실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        Alert.alert(
            COMFORT_MESSAGES.DELETE_CONFIRM,
            COMFORT_MESSAGES.DELETE_COMMENT_DETAIL,
            [
                { text: '취소', style: 'cancel' },
                {
                    text: COMFORT_MESSAGES.DELETE,
                    style: 'destructive',
                    onPress: async () => {
                        const response = await deleteComment(commentId);
                        if (response.success) {
                            setComments(prev => prev.filter(c => c.id !== commentId));
                        }
                    },
                },
            ]
        );
    };

    const handleShowMenu = () => {
        if (Platform.OS === 'ios') {
            if (post.isOwner) {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['수정', '삭제', '취소'],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 2,
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 0) onUpdate?.();
                        if (buttonIndex === 1) onDelete();
                    }
                );
            } else {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['신고', '차단', '취소'],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 2,
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 0) onReport();
                        if (buttonIndex === 1) onBlock();
                    }
                );
            }
        } else {
            if (post.isOwner) {
                Alert.alert(
                    '게시글 관리',
                    undefined,
                    [
                        { text: COMFORT_MESSAGES.EDIT, onPress: onUpdate },
                        { text: COMFORT_MESSAGES.DELETE, onPress: onDelete, style: 'destructive' },
                        { text: '취소', style: 'cancel' },
                    ],
                    { cancelable: true }
                );
            } else {
                Alert.alert(
                    '게시글 관리',
                    undefined,
                    [
                        { text: COMFORT_MESSAGES.REPORT, onPress: onReport },
                        { text: COMFORT_MESSAGES.BLOCK, onPress: onBlock, style: 'destructive' },
                        { text: '취소', style: 'cancel' },
                    ],
                    { cancelable: true }
                );
            }
        }
    };

    return (
        <View style={styles.card}>
            {/* 헤더 */}
            <View style={styles.header}>
                <View style={styles.authorInfo}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{post.emoji || '🐱'}</Text>
                    </View>
                    <View>
                        <Text style={styles.displayId}>{post.displayId}</Text>
                        <Text style={styles.time}>{formatTime(post.createdAt)}</Text>
                    </View>
                </View>
                <Pressable onPress={handleShowMenu} hitSlop={8}>
                    <Feather name="more-horizontal" size={20} color={COLORS.textSecondary} />
                </Pressable>
            </View>

            {/* 본문 */}
            <Text style={styles.content}>{post.content}</Text>

            {/* 액션 버튼 */}
            <View style={styles.actions}>
                <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={onLike}
                >
                    <Feather
                        name="heart"
                        size={18}
                        color={post.isLiked ? '#E91E63' : COLORS.textSecondary}
                        fill={post.isLiked ? '#E91E63' : 'transparent'}
                    />
                    <Text style={[styles.actionText, post.isLiked && styles.actionTextActive]}>
                        {post.likeCount > 0 ? post.likeCount : COMFORT_MESSAGES.LIKE}
                    </Text>
                </Pressable>

                <Pressable
                    style={({ pressed }) => [styles.actionButton, pressed && styles.actionButtonPressed]}
                    onPress={handleToggleComments}
                >
                    <Feather name="message-circle" size={18} color={COLORS.textSecondary} />
                    <Text style={styles.actionText}>
                        {post.commentCount > 0 ? COMFORT_MESSAGES.SHOW_COMMENTS(post.commentCount) : '댓글'}
                    </Text>
                </Pressable>
            </View>

            {/* 댓글 섹션 */}
            {showComments && (
                <View style={styles.commentsSection}>
                    {comments.map((comment, index) => (
                        <View key={comment.id || `comment-${index}`} style={styles.commentItem}>
                            <View style={styles.commentHeader}>
                                <Text style={styles.commentAuthor}>{comment.displayId || '익명'}</Text>
                                <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                                {comment.isOwner && (
                                    <Pressable
                                        onPress={() => handleDeleteComment(comment.id)}
                                        hitSlop={8}
                                        style={styles.commentDeleteButton}
                                    >
                                        <Feather name="x" size={14} color={COLORS.textSecondary} />
                                    </Pressable>
                                )}
                            </View>
                            <Text style={styles.commentContent}>{comment.content || ''}</Text>
                        </View>
                    ))}

                    {/* 댓글 입력 */}
                    <View style={styles.commentInputContainer}>
                        <TextInput
                            style={styles.commentInputField}
                            value={commentText}
                            onChangeText={setCommentText}
                            placeholder={COMFORT_MESSAGES.COMMENT_PLACEHOLDER}
                            placeholderTextColor={COLORS.textSecondary}
                            maxLength={300}
                            multiline
                        />
                        <Pressable
                            style={[
                                styles.commentSubmitButton,
                                (!commentText.trim() || isSubmitting) && styles.commentSubmitButtonDisabled
                            ]}
                            onPress={handleSubmitComment}
                            disabled={!commentText.trim() || isSubmitting}
                        >
                            <Feather
                                name="send"
                                size={18}
                                color={commentText.trim() && !isSubmitting ? COLORS.primary : COLORS.textSecondary}
                            />
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        marginHorizontal: 16,
        marginTop: 12,
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#FFF3E0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
    },
    displayId: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    time: {
        fontSize: 12,
        color: COLORS.textSecondary,
        marginTop: 2,
    },
    content: {
        fontSize: 15,
        lineHeight: 22,
        color: COLORS.textPrimary,
        marginBottom: 12,
    },
    actions: {
        flexDirection: 'row',
        gap: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        paddingTop: 12,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 8,
    },
    actionButtonPressed: {
        backgroundColor: COLORS.background,
    },
    actionText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    actionTextActive: {
        color: '#E91E63',
    },
    commentsSection: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    commentItem: {
        marginBottom: 12,
        paddingLeft: 8,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.border,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 12,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    commentTime: {
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    commentDeleteButton: {
        marginLeft: 'auto',
        padding: 4,
    },
    commentContent: {
        fontSize: 13,
        lineHeight: 18,
        color: COLORS.textPrimary,
    },
    commentInput: {
        marginTop: 8,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 8,
    },
    commentInputField: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 13,
        color: COLORS.textPrimary,
        maxHeight: 100,
    },
    commentSubmitButton: {
        padding: 10,
        borderRadius: 20,
        backgroundColor: COLORS.background,
    },
    commentSubmitButtonDisabled: {
        opacity: 0.5,
    },
    commentInputPlaceholder: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    commentInputText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});

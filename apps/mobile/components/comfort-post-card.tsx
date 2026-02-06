import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, TextInput, Keyboard } from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, COMFORT_MESSAGES } from '../constants';
import { ComfortPost, ComfortComment, getComments, createComment, updateComment, deleteComment } from '../services';
import ComfortCommentReportModal from './comfort-comment-report-modal';

interface ComfortPostCardProps {
    post: ComfortPost;
    onLike: () => void;
    onDelete: () => void;
    onBlock: () => void;
    onReport: () => void;
    onUpdate?: () => void;
}

export default function ComfortPostCard({
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
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editingCommentText, setEditingCommentText] = useState('');
    const [localCommentCount, setLocalCommentCount] = useState(post.commentCount);
    const [commentReportModalVisible, setCommentReportModalVisible] = useState(false);
    const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);

    const [visibleCommentCount, setVisibleCommentCount] = useState(20);

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
            setEditingCommentId(null);
            return;
        }

        setIsLoadingComments(true);
        try {
            const response = await getComments(post.id);
            if (response.success && response.data) {
                setComments(response.data.comments);
                setVisibleCommentCount(20); // Reset pagination
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

        setIsSubmitting(true);
        try {
            const response = await createComment(post.id, commentText.trim());
            if (response.success && response.data) {
                setComments(prev => [...prev, response.data!.comment]);
                setLocalCommentCount(prev => prev + 1);
                setCommentText('');
                Keyboard.dismiss();
            } else if (response.error) {
                Alert.alert('알림', response.error.message || '댓글 작성에 실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '댓글 작성에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditComment = (comment: ComfortComment) => {
        setEditingCommentId(comment.id);
        setEditingCommentText(comment.content);
    };

    const handleCancelEdit = () => {
        setEditingCommentId(null);
        setEditingCommentText('');
    };

    const handleSaveEdit = async () => {
        if (!editingCommentId || !editingCommentText.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const response = await updateComment(editingCommentId, editingCommentText.trim());
            if (response.success && response.data) {
                setComments(prev => prev.map(c =>
                    c.id === editingCommentId
                        ? { ...response.data!.comment, isOwner: c.isOwner }
                        : c
                ));
                setEditingCommentId(null);
                setEditingCommentText('');
                Keyboard.dismiss();
            } else if (response.error) {
                Alert.alert('알림', response.error.message || '댓글 수정에 실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '댓글 수정에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCommentMenu = (comment: ComfortComment) => {
        if (comment.isOwner) {
            // 본인 댓글: 수정, 삭제
            Alert.alert(
                '댓글 관리',
                undefined,
                [
                    { text: COMFORT_MESSAGES.EDIT, onPress: () => handleEditComment(comment) },
                    { text: COMFORT_MESSAGES.DELETE, onPress: () => handleDeleteComment(comment.id), style: 'destructive' },
                    { text: '취소', style: 'cancel' },
                ],
                { cancelable: true }
            );
        } else {
            // 타인 댓글: 신고
            Alert.alert(
                '댓글 관리',
                undefined,
                [
                    { text: COMFORT_MESSAGES.REPORT, onPress: () => handleReportComment(comment.id) },
                    { text: '취소', style: 'cancel' },
                ],
                { cancelable: true }
            );
        }
    };

    const handleReportComment = (commentId: string) => {
        setReportingCommentId(commentId);
        setCommentReportModalVisible(true);
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
                            setLocalCommentCount(prev => Math.max(0, prev - 1));
                        }
                    },
                },
            ]
        );
    };

    const handleShowMenu = () => {
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
    };

    const handleLoadMore = () => {
        setVisibleCommentCount(prev => prev + 20);
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
                        <View style={styles.displayIdRow}>
                            <Text style={styles.displayId}>{post.displayId}</Text>
                            {post.isOwner && (
                                <View style={styles.myBadge}>
                                    <Text style={styles.myBadgeText}>내가 쓴 글</Text>
                                </View>
                            )}
                        </View>
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
                        color={post.isLiked ? COLORS.pink : COLORS.textSecondary}
                        fill={post.isLiked ? COLORS.pink : 'transparent'}
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
                        {localCommentCount > 0 ? COMFORT_MESSAGES.SHOW_COMMENTS(localCommentCount) : '댓글'}
                    </Text>
                </Pressable>
            </View>

            {/* 댓글 섹션 */}
            {showComments && (
                <View style={styles.commentsSection}>
                    {comments.slice(0, visibleCommentCount).map((comment, index) => (
                        <View key={comment.id || `comment-${index}`} style={styles.commentItem}>
                            {editingCommentId === comment.id ? (
                                /* 댓글 수정 모드 */
                                <View style={styles.commentEditContainer}>
                                    <View style={styles.commentEditRow}>
                                        <TextInput
                                            style={styles.commentEditInput}
                                            value={editingCommentText}
                                            onChangeText={setEditingCommentText}
                                            placeholder="댓글을 입력하세요"
                                            placeholderTextColor={COLORS.textSecondary}
                                            maxLength={300}
                                            multiline
                                            autoFocus
                                        />
                                        <View style={styles.commentEditActions}>
                                            <Pressable onPress={handleCancelEdit} style={styles.commentEditButton}>
                                                <Feather name="x" size={18} color={COLORS.textSecondary} />
                                            </Pressable>
                                            <Pressable
                                                onPress={handleSaveEdit}
                                                style={[styles.commentEditButton, !editingCommentText.trim() && styles.commentEditButtonDisabled]}
                                                disabled={!editingCommentText.trim() || isSubmitting}
                                            >
                                                <Feather name="check" size={18} color={editingCommentText.trim() && !isSubmitting ? COLORS.primary : COLORS.textSecondary} />
                                            </Pressable>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                /* 댓글 보기 모드 */
                                <>
                                    <View style={styles.commentHeader}>
                                        <Text style={styles.commentAuthor}>{comment.displayId || '익명'}</Text>
                                        {comment.isOwner && (
                                            <View style={styles.myCommentBadge}>
                                                <Text style={styles.myCommentBadgeText}>내 댓글</Text>
                                            </View>
                                        )}
                                        <Text style={styles.commentTime}>{formatTime(comment.createdAt)}</Text>
                                        <Pressable
                                            onPress={() => handleCommentMenu(comment)}
                                            hitSlop={8}
                                            style={styles.commentMenuButton}
                                        >
                                            <Feather name="more-horizontal" size={14} color={COLORS.textSecondary} />
                                        </Pressable>
                                    </View>
                                    <Text style={styles.commentContent}>{comment.content || ''}</Text>
                                </>
                            )}
                        </View>
                    ))}

                    {/* 더보기 버튼 */}
                    {visibleCommentCount < comments.length && (
                        <Pressable style={styles.loadMoreButton} onPress={handleLoadMore}>
                            <Text style={styles.loadMoreText}>댓글 더보기 ({comments.length - visibleCommentCount})</Text>
                            <Feather name="chevron-down" size={16} color={COLORS.textSecondary} />
                        </Pressable>
                    )}

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
                            blurOnSubmit={false}
                            returnKeyType="send"
                            onSubmitEditing={handleSubmitComment}
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

            {/* 댓글 신고 모달 */}
            <ComfortCommentReportModal
                visible={commentReportModalVisible}
                commentId={reportingCommentId}
                onClose={() => {
                    setCommentReportModalVisible(false);
                    setReportingCommentId(null);
                }}
            />
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
        backgroundColor: COLORS.avatarBg,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        fontSize: 18,
    },
    displayIdRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    displayId: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    myBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    myBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: COLORS.primary,
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
        color: COLORS.pink,
    },
    commentsSection: {
        marginTop: 12,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    commentItem: {
        marginBottom: 12,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: COLORS.border,
    },
    commentHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    myCommentBadge: {
        backgroundColor: COLORS.primary + '20',
        paddingHorizontal: 5,
        paddingVertical: 1,
        borderRadius: 3,
    },
    myCommentBadgeText: {
        fontSize: 9,
        fontWeight: '600',
        color: COLORS.primary,
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
        fontSize: 14,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    commentInput: {
        marginTop: 8,
    },
    commentInputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 8,
        marginTop: 4,
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
    commentMenuButton: {
        marginLeft: 'auto',
        padding: 4,
    },
    commentEditContainer: {
        flex: 1,
    },
    commentEditRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 8,
    },
    commentEditInput: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 13,
        color: COLORS.textPrimary,
        minHeight: 40,
        maxHeight: 100,
    },
    commentEditActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    commentEditButton: {
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    commentEditButtonDisabled: {
        opacity: 0.5,
    },
    commentEditButtonTextCancel: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    commentEditButtonTextSave: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.primary,
    },
    commentEditButtonTextDisabled: {
        color: COLORS.textSecondary,
    },
    loadMoreButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginBottom: 4,
        gap: 4,
    },
    loadMoreText: {
        fontSize: 13,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
});

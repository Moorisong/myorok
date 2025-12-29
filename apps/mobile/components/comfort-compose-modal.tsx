import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

import { COLORS, COMFORT_MESSAGES } from '../constants';

interface ComfortComposeModalProps {
    visible: boolean;
    onClose: () => void;
    onSubmit: (content: string) => Promise<{ success: boolean; error?: string }>;
    initialContent?: string;
    isEdit?: boolean;
}

const MAX_LENGTH = 500;

export function ComfortComposeModal({
    visible,
    onClose,
    onSubmit,
    initialContent = '',
    isEdit = false,
}: ComfortComposeModalProps) {
    const [content, setContent] = useState(initialContent);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const inputRef = useRef<TextInput>(null);

    useEffect(() => {
        if (visible) {
            setContent(initialContent);
            setTimeout(() => {
                inputRef.current?.focus();
            }, 300);
        }
    }, [visible, initialContent]);

    const handleSubmit = async () => {
        if (!content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const result = await onSubmit(content.trim());
            if (result.success) {
                setContent('');
                onClose();
                Alert.alert('완료', COMFORT_MESSAGES.POST_SUCCESS);
            } else {
                Alert.alert('오류', result.error || '게시에 실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '게시에 실패했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (content.trim() && content !== initialContent) {
            Alert.alert(
                '작성 취소',
                '작성 중인 내용이 삭제됩니다.',
                [
                    { text: '계속 작성', style: 'cancel' },
                    { text: '취소', style: 'destructive', onPress: onClose },
                ]
            );
        } else {
            onClose();
        }
    };

    const remainingChars = MAX_LENGTH - content.length;
    const isOverLimit = remainingChars < 0;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {/* 헤더 */}
                <View style={styles.header}>
                    <Pressable onPress={handleClose} hitSlop={8}>
                        <Text style={styles.cancelButton}>취소</Text>
                    </Pressable>
                    <Text style={styles.title}>
                        {isEdit ? '글 수정' : COMFORT_MESSAGES.COMPOSE_TITLE}
                    </Text>
                    <Pressable
                        onPress={handleSubmit}
                        disabled={!content.trim() || isOverLimit || isSubmitting}
                        hitSlop={8}
                    >
                        <Text
                            style={[
                                styles.submitButton,
                                (!content.trim() || isOverLimit || isSubmitting) && styles.submitButtonDisabled,
                            ]}
                        >
                            {isSubmitting ? '게시 중...' : '게시'}
                        </Text>
                    </Pressable>
                </View>

                {/* 본문 입력 */}
                <View style={styles.inputContainer}>
                    <TextInput
                        ref={inputRef}
                        style={styles.input}
                        placeholder={COMFORT_MESSAGES.COMPOSE_PLACEHOLDER}
                        placeholderTextColor={COLORS.textSecondary}
                        multiline
                        value={content}
                        onChangeText={setContent}
                        maxLength={MAX_LENGTH + 50} // 약간의 여유
                        textAlignVertical="top"
                    />
                </View>

                {/* 하단 정보 */}
                <View style={styles.footer}>
                    <View style={styles.noticeRow}>
                        <Feather name="clock" size={14} color={COLORS.textSecondary} />
                        <Text style={styles.noticeText}>1시간에 1번 글을 쓸 수 있어요</Text>
                    </View>
                    <Text style={[styles.charCount, isOverLimit && styles.charCountOver]}>
                        {content.length}{COMFORT_MESSAGES.COMPOSE_LIMIT}
                    </Text>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    cancelButton: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
    },
    submitButton: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    submitButtonDisabled: {
        color: COLORS.textSecondary,
    },
    inputContainer: {
        flex: 1,
        padding: 16,
    },
    input: {
        flex: 1,
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.textPrimary,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
        backgroundColor: COLORS.background,
    },
    noticeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    noticeText: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    charCount: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
    charCountOver: {
        color: COLORS.error,
    },
});

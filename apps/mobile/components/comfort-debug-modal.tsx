import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { debugAction, ApiResponse } from '../services';

interface ComfortDebugModalProps {
    visible: boolean;
    onClose: () => void;
    onResetCooldown: () => void;
    onReload: () => void;
}

export default function ComfortDebugModal({
    visible,
    onClose,
    onResetCooldown,
    onReload,
}: ComfortDebugModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action: string, params = {}) => {
        setIsLoading(true);
        try {
            if (action === 'set-trial-expiring') {
                const { setTrialExpiringTestMode } = require('../services/subscription');
                await setTrialExpiringTestMode();
                Alert.alert('성공', '무료체험이 24시간 남은 상태로 변경되었습니다.', [{ text: '확인', onPress: onClose }]);
                return;
            }

            const response = await debugAction(action, params) as ApiResponse<{ message: string }>;
            if (response.success) {
                Alert.alert('성공', response.data?.message || '완료되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => {
                            if (action === 'reset-cooldown') {
                                onResetCooldown();
                                onClose();
                            } else if (action === 'create-sample') {
                                onReload();
                            } else if (action === 'set-inactivity-3days') {
                                // 알림 권한이나 상태 확인이 필요하다면 여기서 추가 안내 가능
                            }
                        },
                    },
                ]);
            } else {
                Alert.alert('오류', response.error?.message || '실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '요청 처리에 실패했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={styles.container}>
                {/* 헤더 */}
                <View style={styles.header}>
                    <Text style={styles.title}>🧪 테스트 모드</Text>
                    <Pressable onPress={onClose} hitSlop={8}>
                        <Feather name="x" size={24} color={COLORS.textPrimary} />
                    </Pressable>
                </View>

                {/* 메뉴 목록 */}
                <View style={styles.content}>
                    <DebugButton
                        icon="message-circle"
                        title="최신 글에 댓글 추가"
                        description="다른 계정이 쓴 테스트 댓글 추가"
                        onPress={() => handleAction('add-test-comment')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="bell-off"
                        title="댓글 알림 쿨타임 초기화"
                        description="댓글 알림 쿨타임(3시간) 제거"
                        onPress={() => handleAction('reset-comment-cooldown')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="refresh-cw"
                        title="글쓰기 쿨타임 리셋"
                        description="글쓰기 제한을 즉시 해제합니다."
                        onPress={() => handleAction('reset-cooldown')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="layers"
                        title="샘플 생성 x3 (동일 유저)"
                        description="같은 사용자가 작성한 글 3개 생성"
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="bell"
                        title="미활동 3일 상태 만들기"
                        description="마지막 글을 3일 전으로 (부재중 알림 테스트)"
                        onPress={() => handleAction('set-inactivity-3days')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="credit-card"
                        title="무료체험 24시간 남음"
                        description="구독 만료일 조정 (구독 알림 테스트)"
                        onPress={() => handleAction('set-trial-expiring')}
                        isLoading={isLoading}
                    />
                </View>
            </View>
        </Modal>
    );
}

function DebugButton({ icon, title, description, onPress, isLoading }: any) {
    return (
        <Pressable
            style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
            onPress={onPress}
            disabled={isLoading}
        >
            <View style={styles.iconContainer}>
                <Feather name={icon} size={24} color={COLORS.primary} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.buttonTitle}>{title}</Text>
                <Text style={styles.buttonDescription}>{description}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
        </Pressable>
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
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.textPrimary,
    },
    content: {
        padding: 20,
        gap: 16,
    },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: COLORS.background,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    buttonPressed: {
        backgroundColor: COLORS.border,
    },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: COLORS.surface,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    textContainer: {
        flex: 1,
    },
    buttonTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.textPrimary,
        marginBottom: 4,
    },
    buttonDescription: {
        fontSize: 13,
        color: COLORS.textSecondary,
    },
});

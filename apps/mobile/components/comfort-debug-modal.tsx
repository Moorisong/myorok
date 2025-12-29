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

export function ComfortDebugModal({
    visible,
    onClose,
    onResetCooldown,
    onReload,
}: ComfortDebugModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleAction = async (action: string, params = {}) => {
        setIsLoading(true);
        try {
            const response = await debugAction(action, params) as ApiResponse<{ message: string }>;
            if (response.success) {
                Alert.alert('성공', response.data?.message || '완료되었습니다.', [
                    {
                        text: '확인',
                        onPress: () => {
                            if (action === 'reset-cooldown') {
                                onResetCooldown();
                                onClose();
                            } else if (action === 'create-sample' || action === 'time-travel') {
                                onReload();
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
                        icon="refresh-cw"
                        title="쿨타임 리셋"
                        description="글쓰기 제한을 즉시 해제합니다."
                        onPress={() => handleAction('reset-cooldown')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="file-text"
                        title="샘플 게시글 생성"
                        description="랜덤 닉네임, 욕설 포함, 이모지 🧪"
                        onPress={() => handleAction('create-sample')}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="clock"
                        title="시간 이동 +1시간"
                        description="최근 글 작성 시간을 1시간 전으로"
                        onPress={() => handleAction('time-travel', { hours: 1 })}
                        isLoading={isLoading}
                    />

                    <DebugButton
                        icon="clock"
                        title="시간 이동 +2시간"
                        description="최근 글 작성 시간을 2시간 전으로"
                        onPress={() => handleAction('time-travel', { hours: 2 })}
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

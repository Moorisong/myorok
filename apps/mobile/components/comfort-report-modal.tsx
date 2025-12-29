import React, { useState } from 'react';
import {
    View,
    Text,
    Modal,
    StyleSheet,
    Pressable,
    TouchableOpacity,
    TouchableWithoutFeedback,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { COLORS, COMFORT_MESSAGES } from '../constants';
import { reportPost } from '../services';

interface ComfortReportModalProps {
    visible: boolean;
    postId: string | null;
    onClose: () => void;
}

export function ComfortReportModal({
    visible,
    postId,
    onClose,
}: ComfortReportModalProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleReport = async (reason: string) => {
        if (!postId) return;

        setIsLoading(true);
        try {
            const response = await reportPost(postId, reason);
            if (response.success) {
                Alert.alert('완료', COMFORT_MESSAGES.REPORT_SUCCESS);
                onClose();
            } else {
                Alert.alert('오류', response.error?.message || '신고 접수에 실패했습니다.');
            }
        } catch {
            Alert.alert('오류', '신고 접수 중 문제가 발생했습니다.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableWithoutFeedback onPress={onClose}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.contentContainer}>
                            <View style={styles.header}>
                                <Text style={styles.title}>{COMFORT_MESSAGES.REPORT}</Text>
                                <Text style={styles.subtitle}>신고 사유를 선택해주세요</Text>
                            </View>

                            <View style={styles.reasonsContainer}>
                                {COMFORT_MESSAGES.REPORT_REASONS.map((reason, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={styles.reasonItem}
                                        onPress={() => handleReport(reason)}
                                        disabled={isLoading}
                                    >
                                        <Text style={styles.reasonText}>{reason}</Text>
                                        <Feather name="chevron-right" size={20} color={COLORS.textSecondary} />
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Pressable
                                style={styles.cancelButton}
                                onPress={onClose}
                                disabled={isLoading}
                            >
                                <Text style={styles.cancelText}>취소</Text>
                            </Pressable>

                            {isLoading && (
                                <View style={styles.loadingOverlay}>
                                    <ActivityIndicator size="large" color={COLORS.primary} />
                                </View>
                            )}
                        </View>
                    </TouchableWithoutFeedback>
                </View>
            </TouchableWithoutFeedback>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    contentContainer: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    header: {
        marginBottom: 20,
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    reasonsContainer: {
        width: '100%',
        marginBottom: 16,
    },
    reasonItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    reasonText: {
        fontSize: 16,
        color: COLORS.textPrimary,
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        marginTop: 8,
    },
    cancelText: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 16,
    },
});

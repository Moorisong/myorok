import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Dimensions,
} from 'react-native';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

interface SubscriptionPopupProps {
    visible: boolean;
    onSubscribe: () => void;
    onDismiss: () => void;
}

/**
 * 구독 만료 팝업 컴포넌트
 * - "구독하기" / "나중에" 버튼
 */
export function SubscriptionPopup({
    visible,
    onSubscribe,
    onDismiss,
}: SubscriptionPopupProps) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDismiss}
        >
            <TouchableWithoutFeedback onPress={onDismiss}>
                <View style={styles.overlay}>
                    <TouchableWithoutFeedback>
                        <View style={styles.popup}>
                            {/* Icon */}
                            <Text style={styles.icon}>🐾</Text>

                            {/* Title */}
                            <Text style={styles.title}>구독이 만료되었습니다</Text>

                            {/* Description */}
                            <Text style={styles.description}>
                                앱하루의 모든 기능을 계속 이용하시려면{'\n'}
                                구독을 갱신해주세요.
                            </Text>

                            {/* Buttons */}
                            <View style={styles.buttonContainer}>
                                <TouchableOpacity
                                    style={styles.subscribeButton}
                                    onPress={onSubscribe}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.subscribeButtonText}>구독하기</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.dismissButton}
                                    onPress={onDismiss}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.dismissButtonText}>나중에</Text>
                                </TouchableOpacity>
                            </View>
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
    },
    popup: {
        width: width - 48,
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
    },
    icon: {
        fontSize: 48,
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    description: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    buttonContainer: {
        width: '100%',
    },
    subscribeButton: {
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginBottom: 12,
    },
    subscribeButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    dismissButton: {
        backgroundColor: COLORS.lightGray,
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
    },
    dismissButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.textSecondary,
    },
});

export default SubscriptionPopup;

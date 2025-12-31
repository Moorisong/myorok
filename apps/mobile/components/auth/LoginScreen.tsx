import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
    onLoginSuccess: (userId: string) => void;
    onLoginPress: () => Promise<void>;
    isLoading?: boolean;
}

/**
 * 로그인 화면 컴포넌트
 * - 카카오 로그인 버튼 (노란색, 카카오 디자인 가이드 준수)
 * - 안내 문구: "월 구독 결제로 앱하루를 이용하려면 로그인하세요."
 */
export function LoginScreen({ onLoginPress, isLoading = false }: LoginScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Logo / App Name */}
                <View style={styles.logoContainer}>
                    <Text style={styles.logoEmoji}>🐾</Text>
                    <Text style={styles.appName}>앱하루</Text>
                    <Text style={styles.appSubtitle}>반려묘 병상일지</Text>
                </View>

                {/* Description */}
                <View style={styles.descriptionContainer}>
                    <Text style={styles.description}>
                        월 구독 결제로 앱하루를 이용하려면{'\n'}로그인하세요.
                    </Text>
                </View>

                {/* Kakao Login Button */}
                <TouchableOpacity
                    style={[styles.kakaoButton, isLoading && styles.kakaoButtonDisabled]}
                    onPress={onLoginPress}
                    disabled={isLoading}
                    activeOpacity={0.8}
                >
                    <Text style={styles.kakaoLogo}>💬</Text>
                    <Text style={styles.kakaoButtonText}>
                        {isLoading ? '로그인 중...' : '카카오 로그인'}
                    </Text>
                </TouchableOpacity>

                {/* Terms */}
                <Text style={styles.terms}>
                    로그인 시 이용약관 및 개인정보처리방침에 동의하게 됩니다.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 48,
    },
    logoEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    appName: {
        fontSize: 32,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 8,
    },
    appSubtitle: {
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    descriptionContainer: {
        marginBottom: 48,
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
    },
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE500', // Kakao Yellow
        width: width - 48,
        height: 52,
        borderRadius: 12,
        marginBottom: 16,
    },
    kakaoButtonDisabled: {
        opacity: 0.6,
    },
    kakaoLogo: {
        fontSize: 20,
        marginRight: 8,
    },
    kakaoButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000',
    },
    terms: {
        fontSize: 12,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginTop: 16,
    },
});

export default LoginScreen;

import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Image,
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
export function LoginScreen({ onLoginSuccess, onLoginPress, isLoading = false }: LoginScreenProps) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                {/* Header Section */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/myorok_logo_big.png')}
                            style={styles.logoImage}
                            resizeMode="contain"
                        />
                    </View>
                    <Text style={styles.appName}>묘록</Text>
                    <Text style={styles.appSubtitle}>소중한 반려묘를 위한 병상일지</Text>
                </View>

                {/* Illustration/Description Section */}
                <View style={styles.centerSection}>
                    <Text style={styles.descriptionTitle}>
                        기록을 시작해보세요
                    </Text>
                    <Text style={styles.descriptionText}>
                        아이의 건강 상태를 꼼꼼하게 기록하고{'\n'}
                        변화를 한눈에 파악할 수 있어요.
                    </Text>
                </View>
// ... rest of the component matches perfectly up to line 104 in context
                // I will only replace the top part and styles


                {/* Actions Section */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.kakaoButton, isLoading && styles.kakaoButtonDisabled]}
                        onPress={onLoginPress}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.kakaoIcon}>💬</Text>
                        <Text style={styles.kakaoButtonText}>
                            {isLoading ? '카카오 로그인 중...' : '카카오로 3초 만에 시작하기'}
                        </Text>
                    </TouchableOpacity>

                    <Text style={styles.termsText}>
                        로그인 시 <Text style={styles.linkText}>이용약관</Text> 및 <Text style={styles.linkText}>개인정보처리방침</Text>에{'\n'}동의하게 됩니다.
                    </Text>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingBottom: 40,
        paddingTop: 60,
    },
    header: {
        alignItems: 'center',
        marginTop: 40,
    },
    logoContainer: {
        width: 120,
        height: 120,
        marginBottom: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    logoImage: {
        width: '100%',
        height: '100%',
    },
    appName: {
        fontSize: 32,
        fontWeight: '800',
        color: COLORS.textPrimary, // Keep primary dark
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    appSubtitle: {
        fontSize: 16,
        color: '#666666', // Darker than textSecondary
        fontWeight: '500',
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    descriptionTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: COLORS.textPrimary,
        marginBottom: 12,
        textAlign: 'center',
    },
    descriptionText: {
        fontSize: 16,
        color: '#4A4A4A', // Much darker for readability
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
    },
    kakaoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEE500', // Kakao Yellow
        width: '100%',
        height: 56,
        borderRadius: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    kakaoButtonDisabled: {
        opacity: 0.7,
    },
    kakaoIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    kakaoButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000000', // Kakao Label Color
    },
    termsText: {
        fontSize: 12,
        color: '#999999',
        textAlign: 'center',
        lineHeight: 18,
    },
    linkText: {
        textDecorationLine: 'underline',
        color: '#777777',
    },
});

export default LoginScreen;

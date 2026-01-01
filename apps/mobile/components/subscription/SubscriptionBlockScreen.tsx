import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { useAuth } from '../../hooks/useAuth';

export function SubscriptionBlockScreen() {
    const { logout } = useAuth();

    const handleSubscribe = () => {
        Alert.alert('구독하기', '인앱 결제 기능을 준비 중입니다.');
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.centerSection}>
                    <Text style={styles.icon}>🔒</Text>
                    <Text style={styles.title}>구독이 만료되었습니다</Text>
                    <Text style={styles.description}>
                        더 이상 기록을 작성하거나 조회할 수 없습니다.{'\n'}
                        계속 이용하려면 구독을 갱신해주세요.
                    </Text>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.subscribeButton}
                        onPress={handleSubscribe}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.subscribeButtonText}>구독 갱신하기</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.logoutButton}
                        onPress={logout}
                    >
                        <Text style={styles.logoutButtonText}>로그아웃</Text>
                    </TouchableOpacity>
                </View>
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
        paddingBottom: 40,
    },
    centerSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    icon: {
        fontSize: 60,
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.textPrimary,
        marginBottom: 16,
        textAlign: 'center',
    },
    description: {
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 40,
    },
    footer: {
        width: '100%',
        alignItems: 'center',
        gap: 16,
    },
    subscribeButton: {
        width: '100%',
        height: 56,
        backgroundColor: COLORS.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subscribeButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    logoutButton: {
        padding: 12,
    },
    logoutButtonText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        textDecorationLine: 'underline',
    },
});

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { SubscriptionBlockScreen } from '../../../components';

export default function SubscriptionPreviewScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <SubscriptionBlockScreen visible={true} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});

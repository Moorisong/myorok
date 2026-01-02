import { Stack } from 'expo-router';

import { COLORS } from '../../../constants';

export default function SettingsLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: COLORS.background },
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen name="pets" />
            <Stack.Screen name="block-list" />
            <Stack.Screen name="about" />
            <Stack.Screen name="pro" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="notification-test" />
            <Stack.Screen name="reference-memos" />
            <Stack.Screen name="subscription-preview" />
        </Stack>
    );
}

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
            <Stack.Screen name="pin" />
            <Stack.Screen name="about" />
            <Stack.Screen name="pro" />
        </Stack>
    );
}

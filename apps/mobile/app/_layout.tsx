import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { COLORS } from '../constants';

export default function RootLayout() {
    return (
        <>
            <StatusBar style="dark" />
            <Stack
                screenOptions={{
                    headerShown: false,
                    contentStyle: { backgroundColor: COLORS.background },
                }}
            >
                <Stack.Screen name="(tabs)" />
                <Stack.Screen
                    name="pro"
                    options={{
                        presentation: 'modal',
                    }}
                />
                <Stack.Screen
                    name="about"
                    options={{
                        presentation: 'modal',
                    }}
                />
            </Stack>
        </>
    );
}


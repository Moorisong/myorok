import { Stack } from 'expo-router';

export default function ChartsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="summary" />
            <Stack.Screen name="custom" />
        </Stack>
    );
}

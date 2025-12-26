import { Stack } from 'expo-router';

export default function RecordsLayout() {
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="food" />
            <Stack.Screen name="medicine" />
            <Stack.Screen name="hospital" />
            <Stack.Screen name="fluid" />
            <Stack.Screen name="custom-metrics" />
        </Stack>
    );
}

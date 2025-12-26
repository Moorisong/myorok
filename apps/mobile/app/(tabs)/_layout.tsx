import { Tabs } from 'expo-router';
import { Text, View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS } from '../../constants';

interface TabIconProps {
    emoji: string;
    focused: boolean;
}

function TabIcon({ emoji, focused }: TabIconProps) {
    return (
        <View style={[styles.iconContainer, focused && styles.iconFocused]}>
            <Text style={styles.emoji}>{emoji}</Text>
        </View>
    );
}

export default function TabLayout() {
    const insets = useSafeAreaInsets();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    ...styles.tabBar,
                    height: 60 + insets.bottom,
                    paddingBottom: insets.bottom,
                },
                tabBarActiveTintColor: COLORS.primary,
                tabBarInactiveTintColor: COLORS.textSecondary,
                tabBarLabelStyle: styles.tabLabel,
            }}
        >
            <Tabs.Screen
                name="index"
                options={{
                    title: '오늘',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📋" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    title: '캘린더',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="charts"
                options={{
                    title: '차트',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="📊" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="settings"
                options={{
                    title: '설정',
                    tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
                }}
            />
            <Tabs.Screen
                name="today"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="records"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: COLORS.surface,
        borderTopColor: COLORS.border,
        paddingTop: 8,
    },
    tabLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    iconContainer: {
        padding: 4,
    },
    iconFocused: {
        transform: [{ scale: 1.1 }],
    },
    emoji: {
        fontSize: 22,
    },
});
